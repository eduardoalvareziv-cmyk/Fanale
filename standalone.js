(() => {
  // Fanale, free standalone version: runs entirely in the visitor's browser.
  // Data: NCBI E-utilities (PubMed) and the ClinicalTrials.gov v2 API, called directly. No AI, no keys, nothing stored.
  const EUTILS = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/";
  const CTGOV = "https://clinicaltrials.gov/api/v2/studies";
  const ROR = "https://api.ror.org/v2/organizations?affiliation=";
  const WIKIDATA = "https://www.wikidata.org/w/api.php?action=wbgetentities&props=claims&format=json&origin=*&ids=";
  const PER_CONTINENT = 10;

  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const I = window.FanaleI18n;
  const tr = (k, v) => I.t(k, v);
  const naHtml = () => `<span class="na">${esc(tr("na"))}</span>`;
  const has = (s) => s != null && String(s).trim() !== "";
  const val = (s) => (has(s) ? esc(String(s).trim()) : naHtml());
  const norm = (s) => String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/\s+/g, " ").trim();
  const google = (q) => "https://www.google.com/search?q=" + encodeURIComponent(q);

  // ---------- Continents ----------
  const CONTINENTS = ["North America", "South America", "Europe", "Asia", "Africa", "Oceania"];
  const C_MAP = (() => {
    const m = {}, add = (c, names) => names.split("|").forEach((n) => { m[n] = c; });
    add("North America", "united states|usa|us|u.s.a|u.s|united states of america|puerto rico|pr|canada|mexico|cuba|dominican republic|jamaica|haiti|trinidad and tobago|barbados|bahamas|guatemala|honduras|el salvador|nicaragua|costa rica|panama|belize|virgin islands|us virgin islands");
    add("South America", "brazil|argentina|chile|colombia|peru|venezuela|ecuador|bolivia|uruguay|paraguay|guyana|suriname");
    add("Europe", "united kingdom|uk|england|scotland|wales|northern ireland|ireland|france|germany|italy|spain|portugal|netherlands|the netherlands|belgium|switzerland|austria|sweden|norway|denmark|finland|iceland|poland|czech republic|czechia|slovakia|hungary|romania|bulgaria|greece|croatia|serbia|slovenia|bosnia and herzegovina|albania|north macedonia|estonia|latvia|lithuania|ukraine|belarus|russia|russian federation|luxembourg|malta|cyprus|monaco");
    add("Asia", "china|p.r. china|pr china|people's republic of china|japan|south korea|korea|republic of korea|korea, republic of|india|pakistan|bangladesh|sri lanka|nepal|taiwan|hong kong|singapore|malaysia|thailand|vietnam|viet nam|indonesia|philippines|israel|turkey|türkiye|turkiye|iran|iraq|saudi arabia|united arab emirates|uae|qatar|kuwait|oman|bahrain|jordan|lebanon|syria|kazakhstan|uzbekistan|mongolia|cambodia|myanmar|laos");
    add("Africa", "south africa|nigeria|egypt|kenya|ethiopia|ghana|morocco|algeria|tunisia|uganda|tanzania|rwanda|cameroon|senegal|zimbabwe|zambia|malawi|botswana|sudan|ivory coast|cote d'ivoire|mozambique|namibia");
    add("Oceania", "australia|new zealand|fiji|papua new guinea");
    return m;
  })();
  const continentOf = (country) => {
    const k = norm(country).replace(/[.\s]+$/, "").replace(/^the\s+/, "");
    return C_MAP[k] || null;
  };

  // ---------- Example data (fictional, shown until a real search runs) ----------
  const EXAMPLE = [
    { firstName: "Elena", lastName: "Marrero", occupation: "Rheumatologist, Principal Investigator", phone: "(555) 010-2231", email: "e.marrero@example.org", organization: "Example University Hospital, Division of Rheumatology", organizationAddress: "100 Example Ave, San Juan, PR 00936", organizationPhone: "(555) 010-2200", organizationEmail: "rheum-trials@example.org", country: "Puerto Rico", date: "2026-08-14", mla: 'Marrero, Elena, et al. "Example Study of Renal Outcomes in Lupus Nephritis." <i>Journal of Example Rheumatology</i>, vol. 12, no. 4, 2026, pp. 211-19.', treatments: [["Belimumab", "Medicine"], ["Mycophenolate mofetil", "Medicine"]] },
    { firstName: "David", lastName: "Okafor", occupation: "Immunologist", email: "d.okafor@example.org", organization: "Example Institute of Immunology", organizationAddress: "22 Sample Road, London", country: "United Kingdom", date: "2026-07-02", mla: 'Okafor, David, and Mei Lin. "Example Interferon Signatures in Autoimmune Disease." <i>Example Immunology Reports</i>, vol. 8, 2026, pp. 45-58.', treatments: [["Anifrolumab", "Medicine"]] },
    { firstName: "Sofía", lastName: "Reyes", occupation: "Pediatric Nephrologist", organization: "Example Children's Medical Center", organizationAddress: "5 Placeholder St, Houston, TX", organizationPhone: "(555) 010-4400", organizationEmail: "research@example.org", country: "United States", date: "2026-05-20", mla: 'Reyes, Sofía, et al. "Example Cohort of Childhood-Onset Lupus." <i>Example Pediatrics</i>, vol. 30, no. 2, 2026, pp. 77-84.', treatments: [["Hydroxychloroquine", "Medicine"], ["Exercise program", "Treatment"]] },
    { firstName: "Hiro", lastName: "Tanaka", email: "h.tanaka@example.org", organization: "Example Medical University", country: "Japan", date: "2026-03", mla: 'Tanaka, Hiro, et al. "Example Biomarkers for Flare Prediction." <i>Example Clinical Medicine</i>, vol. 4, 2026, p. 19.', treatments: [["Low-dose aspirin", "Medicine"]] },
    { firstName: "Laura", lastName: "Bennett", occupation: "Principal Investigator", organization: "Example Clinical Research Network", organizationAddress: "Boston, Massachusetts 02115", organizationPhone: "(555) 010-7700", country: "United States", date: "2025-12-01", trialDate: true, mla: '"Example Phase 2 Trial of a Targeted Therapy in Lupus." <i>ClinicalTrials.gov</i>, sponsored by Example Clinical Research Network, NCT00000000.', treatments: [["CAR-T cell therapy", "Treatment"]] },
  ].map((r) => ({ ...r, example: true, continent: continentOf(r.country), ids: [], treatments: r.treatments.map(([name, kind]) => ({ name, kind, src: null })) }));

  // ---------- UI helpers ----------
  let running = false, ctl = null;
  // Step counts are kept as {key, vars} so they can be redrawn when the language changes.
  const stepCounts = {};
  const countText = (c) => (!c ? "" : typeof c === "string" ? c : tr(c.k, c.v));
  function setStep(id, state, count) {
    const el = $("s-" + id); if (!el) return;
    el.classList.remove("active", "done", "error");
    if (state) el.classList.add(state);
    if (count !== undefined) { stepCounts[id] = count; $("n-" + id).textContent = countText(count); }
  }
  const resetSteps = () => ["pubmed", "trials", "db", "org"].forEach((s) => setStep(s, null, ""));
  // Notices are kept as translation keys so they can be redrawn in another language.
  let lastNotice = { kind: "", keys: [] };
  function notice(kind, keys) {
    lastNotice = { kind, keys: (Array.isArray(keys) ? keys : keys ? [keys] : []) };
    const html = lastNotice.keys.map((k) => (typeof k === "string" ? tr(k) : tr(k.k, k.v))).join("<br>");
    $("notice").innerHTML = html ? `<div class="notice ${kind}" role="status"><div>${html}</div></div>` : "";
  }
  const safeMLA = (s) => esc(s).replace(/&lt;i&gt;/g, "<i>").replace(/&lt;\/i&gt;/g, "</i>");
  const initials = (r) => ((r.firstName || "").trim().charAt(0) + (r.lastName || "").trim().charAt(0)).toUpperCase() || "?";
  const fullName = (r) => [r.firstName, r.lastName].filter(Boolean).join(" ");

  function idLink(x) {
    if (x.type === "pmid") return `<a href="https://pubmed.ncbi.nlm.nih.gov/${esc(x.id)}/" target="_blank" rel="noopener">PMID ${esc(x.id)}</a>`;
    if (x.type === "doi") return `<a href="https://doi.org/${esc(x.id)}" target="_blank" rel="noopener">DOI</a>`;
    if (x.type === "nct") return `<a href="https://clinicaltrials.gov/study/${esc(x.id)}" target="_blank" rel="noopener">${esc(x.id)}</a>`;
    return "";
  }
  function treatList(r) {
    const t = r.treatments || [];
    if (!t.length) return `<div class="na">${esc(tr("noneNamed"))}</div>`;
    return `<ul class="tx">${t.map((x) => `<li><span class="txName">${esc(x.name)}</span><span class="kind ${x.kind === "Medicine" ? "med" : "trt"}">${esc(tr(x.kind === "Medicine" ? "medicine" : "treatment"))}</span><span class="txSrc">${x.src ? idLink(x.src) : ""}</span></li>`).join("")}</ul>
      <div class="src">${esc(tr("notRec"))}</div>`;
  }
  function profileLine(r) {
    if (r.example) return `<span class="na">${esc(tr("profileExample"))}</span>`;
    return `<a href="${esc(google(`"${fullName(r)}" ${r.organization || ""}`))}" target="_blank" rel="noopener">${esc(tr("findProfile"))}</a><div class="src">${esc(tr("opensTab"))}</div>`;
  }
  function orgContact(r, f) {
    if (has(r[f])) return esc(r[f]);
    return r.orgPending ? `<span class="pending">${esc(tr("lookingUp"))}</span>` : naHtml();
  }
  const hostOf = (u) => { try { return new URL(u).hostname.replace(/^www\./, ""); } catch { return u; } };
  function card(r, i) {
    const ids = (r.ids || []).map(idLink).join("");
    const missingOrg = r.organization && !(has(r.organizationPhone) && has(r.organizationEmail)) && !r.example && !r.orgPending;
    const orgSrc = r.orgSource ? `<div class="src">${esc(r.orgSource.kind === "trial" ? tr("orgFromTrial", { nct: r.orgSource.nct }) : tr("orgFromWikidata", { name: r.orgSource.name }))}</div>` : "";
    const site = r.website ? `<a href="${esc(r.website)}" target="_blank" rel="noopener">${esc(hostOf(r.website))}</a>` : (r.orgPending ? `<span class="pending">${esc(tr("lookingUp"))}</span>` : naHtml());
    const findOrg = missingOrg ? `<div class="src"><a href="${esc(google(`${r.organization} contact phone email`))}" target="_blank" rel="noopener">${esc(tr("findOrg"))}</a> ${esc(tr("opensSearch"))}</div>` : "";
    return `<article class="card">
      <div class="cardHead"><span class="rank">${i + 1}</span><div style="min-width:0">
        <h3 class="name">${esc(fullName(r)) || esc(tr("unnamed"))}</h3>
        <div class="occ">${r.occupation ? esc(r.occupation) : naHtml()}</div></div></div>
      <div class="block"><div class="label">${esc(tr("researcherContact"))}</div>
        <div class="who"><div class="avatar" aria-hidden="true">${esc(initials(r))}</div><div class="whoText">${profileLine(r)}</div></div>
        <dl><dt>${esc(tr("phone"))}</dt><dd>${val(r.phone)}</dd><dt>${esc(tr("email"))}</dt><dd>${val(r.email)}</dd></dl></div>
      <div class="block"><div class="label">${esc(tr("workOrg"))}</div>
        <div class="org">${val(r.organization)}${r.country ? `<span class="country">${esc(r.country)}</span>` : ""}</div>${r.rorName ? `<div class="src">${esc(tr("matchedRor", { name: r.rorName }))}</div>` : ""}
        <dl><dt>${esc(tr("address"))}</dt><dd>${val(r.organizationAddress)}</dd><dt>${esc(tr("phone"))}</dt><dd>${orgContact(r, "organizationPhone")}</dd><dt>${esc(tr("email"))}</dt><dd>${orgContact(r, "organizationEmail")}</dd><dt>${esc(tr("website"))}</dt><dd>${site}</dd></dl>
        ${orgSrc}${findOrg}</div>
      <div class="block"><div class="label">${esc(tr("txHead"))}</div>${treatList(r)}</div>
      <div class="block pub"><div class="label">${esc(tr(r.trialDate ? "recentTrial" : "recentPub"))}</div>
        <div class="date">${val(r.date)}</div>
        <div class="mla">${r.mla ? safeMLA(r.mla) : naHtml()}</div>
        ${ids ? `<div class="ids">${ids}</div>` : ""}</div>
    </article>`;
  }

  const reachable = (r) => has(r.email) || has(r.phone) || has(r.organization);
  const visible = (r) => (r.treatments || []).length > 0 && reachable(r);
  function groupShown(list) {
    const vis = list.filter(visible);
    return [...CONTINENTS, null].map((c) => ({ c, people: vis.filter((r) => (r.continent || null) === c).slice(0, PER_CONTINENT) })).filter((g) => g.people.length);
  }
  let lastList = [], headFn = null;
  function setHead(fn) { headFn = fn; const m = fn(); $("rtitle").textContent = m.title; $("rmeta").textContent = m.sub || ""; }
  function render(list, metaFn) {
    lastList = list;
    let html = "";
    for (const { c, people } of groupShown(list)) {
      const cName = c ? tr(c) : tr("locNotListed");
      html += `<section class="cont" aria-label="${esc(cName)}">
        <h3 class="contHead">${esc(cName)}<span class="contN">${esc(I.plural(people.length, "researcher1", "researcherN"))}</span></h3>
        <div class="grid">${people.map((r, j) => card(r, j)).join("")}</div></section>`;
    }
    $("grid").innerHTML = html;
    if (metaFn) setHead(metaFn);
    $("dbCount").textContent = "· " + I.plural(list.length, "record1", "recordN");
    $("dbRows").innerHTML = list.map((r) => `<tr>
      <td class="date">${val(r.date)}</td>
      <td>${esc(fullName(r))}${r.occupation ? `<br><span class="na" style="font-style:normal">${esc(r.occupation)}</span>` : ""}</td>
      <td>${val(r.organization)}</td><td>${val(r.country)}</td><td>${r.continent ? esc(tr(r.continent)) : naHtml()}</td><td>${val(r.email)}</td><td>${val(r.phone)}</td>
      <td>${(r.treatments || []).map((x) => `${esc(x.name)} (${esc(tr(x.kind === "Medicine" ? "medicine" : "treatment").toLowerCase())})`).join(", ") || naHtml()}</td>
      <td>${r.mla ? safeMLA(r.mla) : naHtml()}</td></tr>`).join("");
  }
  function subFor(list, q) {
    const n = groupShown(list).reduce((a, g) => a + g.people.length, 0);
    const vis = list.filter(visible).length, hidden = list.length - vis, over = vis - n;
    return {
      title: tr(n ? "resultsFor" : "noneWithContact", { q }),
      sub: tr("shownSub", { n, max: PER_CONTINENT }) + (over ? tr("overLimit", { n: over }) : "") + (hidden ? tr("hiddenSub", { n: hidden }) : ""),
    };
  }

  // ---------- Dates and MLA ----------
  const MON = ["Jan.", "Feb.", "Mar.", "Apr.", "May", "June", "July", "Aug.", "Sept.", "Oct.", "Nov.", "Dec."];
  const MONTHS = { jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12 };
  const monthNum = (m) => (!m ? null : !isNaN(+m) ? +m : MONTHS[String(m).slice(0, 3).toLowerCase()] || null);
  const isoDate = (pd) => {
    if (!pd || !pd.year) return "";
    const m = monthNum(pd.month);
    return [pd.year, m ? String(m).padStart(2, "0") : null, m && pd.day ? String(pd.day).padStart(2, "0") : null].filter(Boolean).join("-");
  };
  const dateKey = (d) => {
    const m = String(d || "").match(/(\d{4})(?:-(\d{1,2}))?(?:-(\d{1,2}))?/);
    return m ? `${m[1]}-${String(m[2] || 0).padStart(2, "0")}-${String(m[3] || 0).padStart(2, "0")}` : "0000-00-00";
  };
  const byRecent = (a, b) => dateKey(b.date).localeCompare(dateKey(a.date));
  const SMALL = new Set(["a", "an", "and", "as", "at", "but", "by", "for", "in", "nor", "of", "on", "or", "the", "to", "with"]);
  const titleCase = (s) => String(s || "").split(/\s+/).map((w, i) => (i > 0 && SMALL.has(w.toLowerCase())) ? w.toLowerCase() : w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
  function mlaArticle(a) {
    const au = a.authors || [];
    const first = au[0] ? `${au[0].last}${au[0].fore ? ", " + au[0].fore : ""}` : "";
    let who = "";
    if (au.length === 1) who = first + ". ";
    else if (au.length === 2) who = `${first}, and ${[au[1].fore, au[1].last].filter(Boolean).join(" ")}. `;
    else if (au.length > 2) who = `${first}, et al. `;
    const parts = [];
    if (a.journal) parts.push(`<i>${titleCase(a.journal)}</i>`);
    if (a.volume) parts.push(`vol. ${a.volume}`);
    if (a.issue) parts.push(`no. ${a.issue}`);
    const m = monthNum(a.pd.month);
    if (a.pd.year) parts.push([a.pd.day && m ? +a.pd.day : null, m ? MON[m - 1] : null, a.pd.year].filter(Boolean).join(" "));
    if (a.pages) parts.push(/[-–]/.test(a.pages) ? `pp. ${a.pages}` : `p. ${a.pages}`);
    return `${who}"${String(a.title || "").replace(/\.$/, "")}." ${parts.join(", ")}.${a.doi ? ` https://doi.org/${a.doi}.` : ""}`;
  }
  const mlaTrial = (t) => `"${String(t.title || "").replace(/\.$/, "")}." <i>ClinicalTrials.gov</i>${t.sponsor ? `, sponsored by ${t.sponsor}` : ""}, ${t.nct}, clinicaltrials.gov/study/${t.nct}.`;

  // ---------- Parsing ----------
  const EMAIL_RE = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/;
  const INST_RE = /universit|hospital|institut|cent(er|re)\b|college|school|clinic|foundation|laborator|academy|medical|health|research|faculty|national|pharma|\binc\b|\bltd\b|\bllc\b|gmbh|corporation|ministry|agency/i;
  const DEPT_RE = /^(department|dept|division|section|unit|service|program|programme|laboratory of|lab of|graduate)\b/i;
  function parseAffiliation(s) {
    s = String(s || "").trim();
    const email = ((s.match(EMAIL_RE) || [])[0] || "").replace(/\.$/, "") || null;
    let clean = s.replace(/(electronic address:)?\s*[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\.?/gi, "").split(/;\s*/)[0].replace(/[.;,\s]+$/, "");
    const parts = clean.split(/,\s*/).map((x) => x.trim()).filter(Boolean);
    if (!parts.length) return { email, organization: null, address: null, country: null, dept: null };
    const country = parts.length > 1 ? parts[parts.length - 1].replace(/\b\d{3,}\b/g, "").replace(/[.]+$/, "").trim() : null;
    let orgIdx = parts.findIndex((p, i) => (i < parts.length - 1 || parts.length === 1) && INST_RE.test(p) && !DEPT_RE.test(p));
    if (orgIdx < 0) orgIdx = parts.findIndex((p) => !DEPT_RE.test(p));
    if (orgIdx < 0) orgIdx = 0;
    const dept = parts.slice(0, orgIdx).filter((p) => DEPT_RE.test(p)).join(", ") || null;
    const address = parts.slice(orgIdx + 1, parts.length > 1 ? parts.length - 1 : undefined).join(", ") || null;
    return { email, organization: parts[orgIdx] || null, address, country: country || null, dept };
  }

  function parseArticle(el) {
    const t = (sel, root = el) => { const n = root.querySelector(sel); return n ? n.textContent.trim() : ""; };
    const pdEl = el.querySelector("JournalIssue > PubDate");
    let pd = { year: pdEl ? t("Year", pdEl) : "", month: pdEl ? t("Month", pdEl) : "", day: pdEl ? t("Day", pdEl) : "" };
    if (!pd.year && pdEl) { const md = t("MedlineDate", pdEl); const y = md.match(/\d{4}/); if (y) pd = { year: y[0], month: (md.match(/\d{4}\s+([A-Za-z]{3})/) || [])[1] || "", day: "" }; }
    if (!pd.year) { const ad = el.querySelector("ArticleDate"); if (ad) pd = { year: t("Year", ad), month: t("Month", ad), day: t("Day", ad) }; }
    const doiEl = el.querySelector('ArticleIdList > ArticleId[IdType="doi"]') || el.querySelector('ELocationID[EIdType="doi"]');
    const authors = [...el.querySelectorAll("AuthorList > Author")].filter((a) => a.querySelector("LastName")).map((a) => ({
      last: t("LastName", a), fore: t("ForeName", a) || t("Initials", a),
      affs: [...a.querySelectorAll("AffiliationInfo > Affiliation")].map((x) => x.textContent.trim()),
    }));
    // Medicines: MeSH headings PubMed indexers marked with the "therapeutic use" qualifier.
    const meds = [];
    for (const mh of el.querySelectorAll("MeshHeadingList > MeshHeading")) {
      const quals = [...mh.querySelectorAll("QualifierName")].map((q) => q.textContent.trim().toLowerCase());
      if (quals.includes("therapeutic use")) meds.push(t("DescriptorName", mh));
    }
    return {
      pmid: t("MedlineCitation > PMID"), title: t("ArticleTitle"), journal: t("Journal > Title"),
      volume: t("JournalIssue > Volume"), issue: t("JournalIssue > Issue"), pages: t("Pagination > MedlinePgn"),
      pd, doi: doiEl ? doiEl.textContent.trim() : "", authors, meds: [...new Set(meds.filter(Boolean))],
    };
  }

  const SKIP_IV = /placebo|sham|standard of care|usual care|no intervention|observation only|questionnaire|survey/i;
  const MED_TYPES = new Set(["DRUG", "BIOLOGICAL", "COMBINATION_PRODUCT"]);
  const TRT_TYPES = new Set(["PROCEDURE", "DEVICE", "BEHAVIORAL", "RADIATION", "GENETIC", "DIETARY_SUPPLEMENT"]);
  function parseStudy(s) {
    const p = s.protocolSection || {};
    const id = p.identificationModule || {}, st = p.statusModule || {}, cl = p.contactsLocationsModule || {};
    const ivs = ((p.armsInterventionsModule || {}).interventions || [])
      .filter((i) => i && i.name && !SKIP_IV.test(i.name) && (MED_TYPES.has(i.type) || TRT_TYPES.has(i.type)))
      .map((i) => ({ name: i.name, kind: MED_TYPES.has(i.type) ? "Medicine" : "Treatment" }));
    return {
      nct: id.nctId, title: id.briefTitle || id.officialTitle, date: (st.startDateStruct || {}).date || "",
      sponsor: ((p.sponsorCollaboratorsModule || {}).leadSponsor || {}).name || "",
      ivs, officials: cl.overallOfficials || [], central: cl.centralContacts || [], locations: cl.locations || [],
    };
  }
  const ROLE = { PRINCIPAL_INVESTIGATOR: "Principal Investigator", STUDY_DIRECTOR: "Study Director", STUDY_CHAIR: "Study Chair" };
  function splitName(raw) {
    const [namePart, ...deg] = String(raw || "").split(",");
    const words = namePart.replace(/^(dr\.?|prof\.?|professor)\s+/i, "").trim().split(/\s+/);
    return { firstName: words.slice(0, -1).join(" "), lastName: words[words.length - 1] || "", degrees: deg.join(",").trim() };
  }
  const phoneOf = (c) => (c && c.phone ? c.phone + (c.phoneExt ? ` ext. ${c.phoneExt}` : "") : null);

  // ---------- Fetching ----------
  async function getOK(url, signal, kind) {
    const r = await fetch(url, { signal });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return kind === "json" ? r.json() : r.text();
  }
  async function fetchPubMed(q, signal) {
    setStep("pubmed", "active");
    const s = await getOK(`${EUTILS}esearch.fcgi?db=pubmed&retmode=json&sort=pub_date&retmax=40&tool=fanale&term=${encodeURIComponent(q)}`, signal, "json");
    const ids = ((s && s.esearchresult) || {}).idlist || [];
    if (!ids.length) { setStep("pubmed", "done", { k: "nArticles", v: { n: 0 } }); return []; }
    const xml = await getOK(`${EUTILS}efetch.fcgi?db=pubmed&retmode=xml&tool=fanale&id=${ids.join(",")}`, signal, "text");
    const doc = new DOMParser().parseFromString(xml, "text/xml");
    const arts = [...doc.querySelectorAll("PubmedArticle")].map(parseArticle);
    setStep("pubmed", "done", { k: "nArticles", v: { n: arts.length } });
    return arts;
  }
  async function fetchTrials(q, signal) {
    setStep("trials", "active");
    const status = "RECRUITING,NOT_YET_RECRUITING,ACTIVE_NOT_RECRUITING,ENROLLING_BY_INVITATION";
    const base = `${CTGOV}?format=json&pageSize=25&query.cond=${encodeURIComponent(q)}&filter.overallStatus=${status}`;
    const fields = "&fields=" + encodeURIComponent(["IdentificationModule", "StatusModule", "SponsorCollaboratorsModule", "ArmsInterventionsModule", "ContactsLocationsModule"].join(","));
    // Try the compact request first, then simpler forms if the API rejects a parameter.
    const noStatus = `${CTGOV}?format=json&pageSize=25&query.cond=${encodeURIComponent(q)}`;
    let data, lastErr;
    for (const url of [base + fields, base, noStatus]) {
      try { data = await getOK(url, signal, "json"); break; }
      catch (e) { if (e.name === "AbortError") throw e; lastErr = e; }
    }
    if (!data) throw lastErr;
    const trials = (data.studies || []).map(parseStudy).filter((t) => t.nct);
    setStep("trials", "done", { k: "nTrials", v: { n: trials.length } });
    return trials;
  }

  // ---------- Building the researcher database ----------
  function build(arts, trials) {
    const people = new Map();
    const keyOf = (f, l) => norm(f) + "|" + norm(l);
    const get = (f, l) => {
      const k = keyOf(f, l);
      if (!people.has(k)) people.set(k, { firstName: f, lastName: l, items: [], treatments: [], seenTx: new Set() });
      return people.get(k);
    };
    const fill = (r, f, v) => { if (!has(r[f]) && has(v)) r[f] = String(v).trim(); };
    const addTx = (r, name, kind, src) => {
      const k = norm(name); if (!k || r.seenTx.has(k) || r.treatments.length >= 5) return;
      r.seenTx.add(k); r.treatments.push({ name, kind, src });
    };

    for (const a of arts) {
      const au = a.authors;
      const picks = au.length > 1 ? [au[0], au[au.length - 1]] : au;
      for (const x of picks) {
        if (!x.last) continue;
        const r = get(x.fore, x.last);
        const aff = parseAffiliation(x.affs[0]);
        fill(r, "affRaw", x.affs[0]);
        fill(r, "email", aff.email); fill(r, "organization", aff.organization); fill(r, "organizationAddress", aff.address);
        fill(r, "country", aff.country); fill(r, "occupation", aff.dept);
        r.items.push({ date: isoDate(a.pd), mla: mlaArticle(a), ids: [{ type: "pmid", id: a.pmid }, ...(a.doi ? [{ type: "doi", id: a.doi }] : [])] });
        for (const m of a.meds) addTx(r, m, "Medicine", { type: "pmid", id: a.pmid });
      }
    }
    for (const t of trials) {
      const contacts = [...t.central, ...t.locations.flatMap((l) => l.contacts || [])];
      for (const o of t.officials) {
        const n = splitName(o.name);
        if (!n.lastName) continue;
        const r = get(n.firstName, n.lastName);
        fill(r, "occupation", [n.degrees, ROLE[o.role]].filter(Boolean).join(", "));
        const mine = contacts.find((c) => norm(c.name).includes(norm(n.lastName)));
        if (mine) { fill(r, "phone", phoneOf(mine)); fill(r, "email", mine.email); }
        fill(r, "organization", o.affiliation);
        const aff = norm(o.affiliation);
        const locForAff = t.locations.find((l) => aff && (norm(l.facility).includes(aff) || aff.includes(norm(l.facility))));
        fill(r, "affRaw", [o.affiliation, locForAff && locForAff.city, locForAff && locForAff.country].filter(Boolean).join(", "));
        const loc = t.locations.find((l) => aff && (norm(l.facility).includes(aff) || aff.includes(norm(l.facility)))) || (t.locations.length === 1 ? t.locations[0] : null);
        if (loc) {
          fill(r, "organizationAddress", [loc.city, [loc.state, loc.zip].filter(Boolean).join(" ")].filter(Boolean).join(", "));
          fill(r, "country", loc.country);
          const site = (loc.contacts || []).find((c) => !norm(c.name).includes(norm(n.lastName)) && (c.phone || c.email));
          if (site && !has(r.organizationPhone) && !has(r.organizationEmail)) {
            r.organizationPhone = phoneOf(site); r.organizationEmail = site.email || null;
            r.orgSource = { kind: "trial", nct: t.nct };
          }
        }
        r.items.push({ date: t.date, trialDate: true, mla: mlaTrial(t), ids: [{ type: "nct", id: t.nct }] });
        for (const iv of t.ivs) addTx(r, iv.name, iv.kind, { type: "nct", id: t.nct });
      }
    }
    const list = [];
    for (const r of people.values()) {
      if (!r.items.length) continue;
      r.items.sort(byRecent);
      const top = r.items[0];
      Object.assign(r, { date: top.date, trialDate: !!top.trialDate, mla: top.mla, ids: r.items.flatMap((x) => x.ids).slice(0, 4) });
      r.continent = continentOf(r.country);
      delete r.seenTx;
      list.push(r);
    }
    return list.sort(byRecent);
  }

  // ---------- Organization lookup: ROR (official name, website, Wikidata link) + Wikidata (phone, email, address) ----------
  async function pool(items, n, fn) {
    let i = 0;
    await Promise.all(Array.from({ length: Math.min(n, items.length) }, async () => { while (i < items.length) { const k = i++; await fn(items[k], k); } }));
  }
  const claim = (claims, p) => {
    const list = (claims && claims[p]) || [];
    const c = list.find((x) => x.rank === "preferred") || list.find((x) => x.rank !== "deprecated");
    const v = c && c.mainsnak && c.mainsnak.datavalue && c.mainsnak.datavalue.value;
    return v == null ? null : typeof v === "string" ? v : v.text || null;
  };
  async function orgLookup(list, signal, onProgress) {
    const groups = new Map();
    for (const r of list) {
      if (!(r.treatments || []).length || !has(r.affRaw)) continue;
      if (has(r.organizationPhone) && has(r.organizationEmail) && r.website) continue;
      const k = norm(r.affRaw).slice(0, 240);
      if (!groups.has(k)) { if (groups.size >= 30) continue; groups.set(k, { aff: r.affRaw, people: [] }); }
      groups.get(k).people.push(r);
    }
    const jobs = [...groups.values()];
    if (!jobs.length) return { matched: 0, phones: 0, failed: false };
    jobs.forEach((j) => j.people.forEach((r) => { r.orgPending = true; }));
    onProgress();
    let done = 0, failures = 0, matched = 0;
    // 1) ROR affiliation matching, 4 at a time; accept only ROR's own "chosen" match.
    await pool(jobs, 4, async (j) => {
      try {
        const res = await getOK(ROR + encodeURIComponent(j.aff.slice(0, 300)), signal, "json");
        const hit = ((res && res.items) || []).find((x) => x.chosen);
        const o = hit && hit.organization;
        if (o) {
          matched++;
          j.ror = {
            name: ((o.names || []).find((n) => (n.types || []).includes("ror_display")) || {}).value || null,
            website: ((o.links || []).find((l) => l.type === "website") || {}).value || null,
            city: (((o.locations || [])[0] || {}).geonames_details || {}).name || null,
            country: (((o.locations || [])[0] || {}).geonames_details || {}).country_name || null,
            qid: (((o.external_ids || []).find((x) => x.type === "wikidata") || {}).preferred) || ((((o.external_ids || []).find((x) => x.type === "wikidata") || {}).all || [])[0]) || null,
          };
        }
      } catch (e) { if (e.name === "AbortError") throw e; failures++; }
      done++; setStep("org", "active", { k: "orgProgress", v: { done, total: jobs.length } });
    });
    // 2) Wikidata contact details for the matched organizations, in batches of 50.
    const qids = [...new Set(jobs.map((j) => j.ror && j.ror.qid).filter(Boolean))];
    const wd = {};
    for (let i = 0; i < qids.length; i += 50) {
      try {
        const res = await getOK(WIKIDATA + qids.slice(i, i + 50).join("|"), signal, "json");
        for (const [q, ent] of Object.entries((res && res.entities) || {})) {
          const c = ent.claims || {};
          wd[q] = { phone: claim(c, "P1329"), email: (claim(c, "P968") || "").replace(/^mailto:/i, "") || null, website: claim(c, "P856"), street: claim(c, "P6375") };
        }
      } catch (e) { if (e.name === "AbortError") throw e; }
    }
    let phones = 0;
    for (const j of jobs) {
      const d = j.ror, w = (d && d.qid && wd[d.qid]) || {};
      for (const r of j.people) {
        r.orgPending = false;
        if (!d) continue;
        if (!r.website) r.website = d.website || w.website || null;
        if (!has(r.organizationPhone) && has(w.phone)) { r.organizationPhone = w.phone; phones++; }
        if (!has(r.organizationEmail) && has(w.email)) r.organizationEmail = w.email;
        if ((has(w.phone) || has(w.email)) && !r.orgSource) r.orgSource = { kind: "wikidata", name: d.name || r.organization };
        if (!has(r.organizationAddress) && has(w.street)) r.organizationAddress = w.street;
        if (!has(r.organizationAddress) && d.city) r.organizationAddress = d.city;
        if (!has(r.country) && d.country) r.country = d.country;
        if (!r.continent) r.continent = continentOf(r.country) || continentOf(d.country);
        if (d.name && norm(d.name) !== norm(r.organization)) r.rorName = d.name;
      }
    }
    return { matched, phones, failed: failures === jobs.length };
  }

  // ---------- Search ----------
  async function runSearch(q) {
    running = true; $("go").disabled = true; $("stop").hidden = false;
    resetSteps();
    notice("", "searching");
    setHead(() => ({ title: tr("searchingFor", { q }), sub: "" }));
    ctl = new AbortController();
    const problems = [];
    try {
      const [pm, ct] = await Promise.allSettled([fetchPubMed(q, ctl.signal), fetchTrials(q, ctl.signal)]);
      if ([pm, ct].some((x) => x.status === "rejected" && x.reason && x.reason.name === "AbortError")) throw { name: "AbortError" };
      if (pm.status === "rejected") { setStep("pubmed", "error"); problems.push("pubmedDown"); }
      if (ct.status === "rejected") { setStep("trials", "error"); problems.push("trialsDown"); }
      const arts = pm.status === "fulfilled" ? pm.value : [], trials = ct.status === "fulfilled" ? ct.value : [];
      if (pm.status === "rejected" && ct.status === "rejected") {
        notice("err", "bothDown");
        render([], () => ({ title: tr("noResults"), sub: "" }));
        return;
      }
      setStep("db", "active");
      const list = build(arts, trials);
      setStep("db", "done", { k: "nResearchers", v: { n: list.length } });
      const metaFn = list.length ? () => subFor(list, q) : () => ({ title: tr("noneFound", { q }), sub: tr("tryBroader") });
      render(list, metaFn);
      notice(problems.length ? "err" : "", problems);
      if (list.length) {
        setStep("org", "active");
        const o = await orgLookup(list, ctl.signal, () => render(list, metaFn));
        list.forEach((r) => { r.orgPending = false; });
        if (o.failed) { setStep("org", "error"); problems.push("rorDown"); }
        else setStep("org", "done", { k: "orgDone", v: { m: o.matched, p: o.phones } });
        render(list, metaFn);
        notice(problems.length ? "err" : "", problems);
      }
    } catch (e) {
      if (e && e.name === "AbortError") { notice("", "stopped"); ["pubmed", "trials", "db", "org"].forEach((s) => { if ($("s-" + s).classList.contains("active")) setStep(s, null); }); }
      else { notice("err", "wentWrong"); }
    } finally {
      running = false; $("go").disabled = false; $("stop").hidden = true;
    }
  }

  // ---------- Wire up ----------
  $("form").addEventListener("submit", (e) => { e.preventDefault(); const q = $("q").value.trim(); if (q && !running) runSearch(q); });
  $("stop").addEventListener("click", () => ctl && ctl.abort());
  document.querySelectorAll(".chip").forEach((b) => b.addEventListener("click", () => { $("q").value = b.dataset.q; if (!running) runSearch(b.dataset.q); }));

  // Language menu: English by default; switching redraws everything already on the page.
  const langSel = $("lang");
  if (langSel) {
    langSel.innerHTML = I.LANGS.map((l) => `<option value="${l.code}"${l.code === I.getLang() ? " selected" : ""}>${esc(l.name)}</option>`).join("");
    langSel.addEventListener("change", () => I.setLang(langSel.value));
  }
  I.onChange(() => {
    if (langSel) langSel.value = I.getLang();
    Object.entries(stepCounts).forEach(([id, c]) => { $("n-" + id).textContent = countText(c); });
    notice(lastNotice.kind, lastNotice.keys);
    render(lastList, headFn);
  });
  I.applyStatic();

  notice("example", "exampleNotice");
  render([...EXAMPLE].sort(byRecent), () => ({ title: tr("exampleTitle"), sub: tr("shownSub", { n: 5, max: PER_CONTINENT }) }));
})();
