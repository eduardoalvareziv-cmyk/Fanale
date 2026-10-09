(() => {
  // Fanale, free standalone version: runs entirely in the visitor's browser.
  // Data: NCBI E-utilities (PubMed) and the ClinicalTrials.gov v2 API, called directly. No AI, no keys, nothing stored.
  const EUTILS = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/";
  const CTGOV = "https://clinicaltrials.gov/api/v2/studies";
  const ROR = "https://api.ror.org/v2/organizations?affiliation=";
  const WIKIDATA = "https://www.wikidata.org/w/api.php?action=wbgetentities&props=claims&format=json&origin=*&ids=";
  const OPENALEX = "https://api.openalex.org/";
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
  ].map((r, i) => ({ ...r, example: true, continent: continentOf(r.country), ids: [], citations: [4210, 12890, 860, 2475, 1530][i], hIndex: [31, 58, 14, 24, 19][i], works: [96, 240, 37, 71, 52][i],
    blurb: ["This example study followed adults with lupus nephritis for two years. Patients on the combined regimen kept kidney function better, with fewer flares.", "This example review explains how blocking type I interferon signaling may calm the immune system in lupus.", "This example cohort describes children diagnosed with lupus before age 16 and links earlier treatment to fewer hospital stays.", "This example study tracks biomarkers that may predict a lupus flare before symptoms start.", "This example phase 2 trial tests a targeted therapy in people with active lupus. Enrollment is open."][i], blurbUrl: "https://pubmed.ncbi.nlm.nih.gov/", treatments: r.treatments.map(([name, kind]) => ({ name, kind, src: null })) }));

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
  const resetSteps = () => ["pubmed", "trials", "db", "cite", "org"].forEach((s) => setStep(s, null, ""));
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
  // ---------- Source filter: publications / trials ----------
  let srcFilter = "all";
  try { const m = localStorage.getItem("fanale-src"); if (m === "all" || m === "pub" || m === "trial") srcFilter = m; } catch {}
  const itemsOf = (r) => (r.items && r.items.length ? r.items : [{ date: r.date, trialDate: r.trialDate, mla: r.mla, blurb: r.blurb, url: r.blurbUrl, ids: r.ids || [] }]);
  const itemMatches = (it, m) => m === "all" || (m === "trial") === !!it.trialDate;
  const itemOf = (r, m = srcFilter) => itemsOf(r).find((it) => itemMatches(it, m)) || null; // items are newest first
  const txOf = (r, m = srcFilter) => (r.treatments || []).filter((t) => m === "all" || !t.src || (m === "trial") === (t.src.type === "nct"));
  const dateOf = (r) => { const it = r.items ? itemOf(r) : null; return it ? it.date : r.date; };

  function treatList(r) {
    const t = txOf(r);
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
  const fmtN = (n) => { try { return new Intl.NumberFormat(I.getLang()).format(n); } catch { return String(n); } };
  const tip = (label, key) => `<span class="tip" tabindex="0" title="${esc(tr(key))}">${label}<span class="tipBox" role="tooltip">${esc(tr(key))}</span></span>`;
  // Header line: h-index, works and the OpenAlex profile link. The citation total itself sits in the contact block.
  function citeLine(r) {
    if (r.citations == null) return "";
    const parts = [];
    if (r.hIndex != null) parts.push(tip(esc(tr("hIndex", { h: fmtN(r.hIndex) })) + " ⓘ", "tipH"));
    if (r.works != null) parts.push(tip(esc(tr("worksN", { n: fmtN(r.works) })) + " ⓘ", "tipWorks"));
    const link = r.oaUrl ? `<a href="${esc(r.oaUrl)}" target="_blank" rel="noopener">OpenAlex</a>` : "";
    const all = parts.concat(link ? [link] : []);
    return all.length ? `<div class="cites">${all.join(" · ")}</div>` : "";
  }
  function totalCitesHtml(r) {
    if (r.citePending) return `<span class="pending">${esc(tr("citePending"))}</span>`;
    if (r.citations == null) return r.example ? naHtml() : `<span class="na">${esc(tr("citeNotFound"))}</span>`;
    return `<b class="totalCites">${esc(fmtN(r.citations))}</b>`;
  }
  function card(r, i) {
    const it = itemOf(r) || itemsOf(r)[0];
    const ids = (it.ids || []).map(idLink).join("");
    const missingOrg = r.organization && !(has(r.organizationPhone) && has(r.organizationEmail)) && !r.example && !r.orgPending;
    const orgSrc = r.orgSource ? `<div class="src">${esc(r.orgSource.kind === "trial" ? tr("orgFromTrial", { nct: r.orgSource.nct }) : tr("orgFromWikidata", { name: r.orgSource.name }))}</div>` : "";
    const site = r.website ? `<a href="${esc(r.website)}" target="_blank" rel="noopener">${esc(hostOf(r.website))}</a>` : (r.orgPending ? `<span class="pending">${esc(tr("lookingUp"))}</span>` : naHtml());
    const findOrg = missingOrg ? `<div class="src"><a href="${esc(google(`${r.organization} contact phone email`))}" target="_blank" rel="noopener">${esc(tr("findOrg"))}</a> ${esc(tr("opensSearch"))}</div>` : "";
    return `<article class="card">
      <div class="cardHead"><span class="rank">${i + 1}</span><div style="min-width:0">
        <h3 class="name">${esc(fullName(r)) || esc(tr("unnamed"))}</h3>
        <div class="occ">${r.occupation ? esc(r.occupation) : naHtml()}</div>
        ${citeLine(r)}</div></div>
      <div class="block"><div class="label">${esc(tr("researcherContact"))}</div>
        <div class="who"><div class="avatar" aria-hidden="true">${esc(initials(r))}</div><div class="whoText">${profileLine(r)}</div></div>
        <dl><dt>${esc(tr("phone"))}</dt><dd>${val(r.phone)}</dd><dt>${esc(tr("email"))}</dt><dd>${val(r.email)}</dd><dt>${tip(esc(tr("totalCites")) + " ⓘ", "tipCites")}</dt><dd>${totalCitesHtml(r)}</dd></dl></div>
      <div class="block"><div class="label">${esc(tr("workOrg"))}</div>
        <div class="org">${val(r.organization)}${r.country ? `<span class="country">${esc(r.country)}</span>` : ""}</div>${r.rorName ? `<div class="src">${esc(tr("matchedRor", { name: r.rorName }))}</div>` : ""}
        <dl><dt>${esc(tr("address"))}</dt><dd>${val(r.organizationAddress)}</dd><dt>${esc(tr("phone"))}</dt><dd>${orgContact(r, "organizationPhone")}</dd><dt>${esc(tr("email"))}</dt><dd>${orgContact(r, "organizationEmail")}</dd><dt>${esc(tr("website"))}</dt><dd>${site}</dd></dl>
        ${orgSrc}${findOrg}</div>
      <div class="block"><div class="label">${esc(tr("txHead"))}</div>${treatList(r)}</div>
      <div class="block pub">${it.blurb ? `<div class="abs"><div class="absHead">${esc(tr("absHead"))}</div><p>${esc(it.blurb)}</p>${it.url ? `<a href="${esc(it.url)}" target="_blank" rel="noopener">${esc(tr(it.trialDate ? "readTrial" : "readAbs"))} ↗</a>` : ""}</div>` : ""}<div class="label">${esc(tr(it.trialDate ? "recentTrial" : "recentPub"))}</div>
        <div class="date">${val(it.date)}</div>
        <div class="mla">${it.mla ? safeMLA(it.mla) : naHtml()}</div>
        ${ids ? `<div class="ids">${ids}</div>` : ""}
        ${r.example ? "" : `<button type="button" class="mlaLink" data-uid="${esc(r.uid)}">${esc(tr("mlaAll"))} ↗</button>`}</div>
      <div class="cardTools"><button type="button" class="copyBtn" data-uid="${esc(r.uid)}">${esc(tr("copySummary"))}</button></div>
    </article>`;
  }

  // Shown only with at least one real contact: a phone or email for the researcher or their organization.
  // While an organization lookup is still running, the card stays until the lookup finishes.
  const reachable = (r) => has(r.email) || has(r.phone) || has(r.organizationPhone) || has(r.organizationEmail);
  const visibleIn = (r, m) => txOf(r, m).length > 0 && !!itemOf(r, m) && (reachable(r) || !!r.orgPending);
  const visible = (r) => visibleIn(r, srcFilter);
  // Ranking: most cited first (default) or newest first. Researchers without a citation count go after those with one.
  // "top" (default) blends how recent and how cited each researcher is; "cited" and "newest" sort by one only.
  let sortMode = "top";
  try { const m = localStorage.getItem("fanale-sort"); if (m === "top" || m === "cited" || m === "newest") sortMode = m; } catch {}
  const byCited = (a, b) => ((b.citations ?? -1) - (a.citations ?? -1)) || byRecent(a, b);
  // Percentile (0 = lowest, 1 = highest) of each value within the list; ties share a percentile.
  const percentiles = (vals) => {
    const uniq = [...new Set(vals)].sort((x, y) => (x < y ? -1 : x > y ? 1 : 0));
    const at = new Map(uniq.map((v, i) => [v, uniq.length > 1 ? i / (uniq.length - 1) : 1]));
    return vals.map((v) => at.get(v));
  };
  const blendScores = (arr) => {
    const rec = percentiles(arr.map((r) => dateKey(dateOf(r))));
    const cit = percentiles(arr.map((r) => r.citations ?? -1));
    // A researcher with no citation count found gets no citation credit.
    return new Map(arr.map((r, i) => [r, 0.5 * rec[i] + 0.5 * (r.citations == null ? 0 : cit[i])]));
  };
  const ranked = (arr) => {
    if (sortMode === "newest") return arr.slice().sort(byRecent);
    if (sortMode === "cited") return arr.slice().sort(byCited);
    const sc = blendScores(arr);
    return arr.slice().sort((a, b) => (sc.get(b) - sc.get(a)) || byCited(a, b));
  };
  const subKey = () => ({ top: "shownSubTop", cited: "shownSubCited", newest: "shownSub" })[sortMode];
  function groupShown(list) {
    const vis = ranked(list.filter(visible));
    return [...CONTINENTS, null].map((c) => ({ c, people: vis.filter((r) => (r.continent || null) === c).slice(0, PER_CONTINENT) })).filter((g) => g.people.length);
  }
  let lastList = [], headFn = null;
  function setHead(fn) { headFn = fn; const m = fn(); $("rtitle").textContent = m.title; $("rmeta").textContent = m.sub || ""; }
  function render(list, metaFn) {
    lastList = list;
    list.forEach((r, i) => { if (r.uid == null) r.uid = i; });
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
    document.querySelectorAll("#sortBar button").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.sort === sortMode)));
    document.querySelectorAll("#srcBar button").forEach((b) => {
      b.setAttribute("aria-pressed", String(b.dataset.src === srcFilter));
      const n = list.filter((r) => visibleIn(r, b.dataset.src)).length;
      b.querySelector(".cnt").textContent = list.length && !list.every((r) => r.example) ? String(n) : "";
    });
    $("dbRows").innerHTML = ranked(list).map((r) => { const it = itemOf(r) || itemsOf(r)[0]; return `<tr>
      <td class="date">${val(it.date)}</td>
      <td>${esc(fullName(r))}${r.occupation ? `<br><span class="na" style="font-style:normal">${esc(r.occupation)}</span>` : ""}</td>
      <td class="num">${r.citations != null ? esc(fmtN(r.citations)) : naHtml()}</td>
      <td>${val(r.organization)}</td><td>${val(r.country)}</td><td>${r.continent ? esc(tr(r.continent)) : naHtml()}</td><td>${val(r.email)}</td><td>${val(r.phone)}</td>
      <td>${(r.treatments || []).map((x) => `${esc(x.name)} (${esc(tr(x.kind === "Medicine" ? "medicine" : "treatment").toLowerCase())})`).join(", ") || naHtml()}</td>
      <td>${it.mla ? safeMLA(it.mla) : naHtml()}</td></tr>`; }).join("");
  }
  function subFor(list, q) {
    const n = groupShown(list).reduce((a, g) => a + g.people.length, 0);
    const vis = list.filter(visible).length, base = list.filter((r) => visibleIn(r, "all")).length;
    const hidden = list.length - base, filtered = base - list.filter((r) => visibleIn(r, "all") && visible(r)).length, over = vis - n;
    return {
      title: tr(n ? "resultsFor" : "noneWithContact", { q }),
      sub: tr(subKey(), { n, max: PER_CONTINENT }) + (over ? tr("overLimit", { n: over }) : "") + (filtered ? tr("filteredSub", { n: filtered }) : "") + (hidden ? tr("hiddenSub", { n: hidden }) : ""),
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
  const byRecent = (a, b) => dateKey(dateOf(b)).localeCompare(dateKey(dateOf(a)));
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

  // Extractive summary: the first two sentences (or the conclusions), cut at about 320 characters.
  function briefOf(text) {
    const t = String(text || "").replace(/\s+/g, " ").trim();
    if (!t) return "";
    const sents = t.split(/(?<=[.!?])\s+(?=[A-Z0-9])/);
    let out = "";
    for (const x of sents) { if (out && (out + " " + x).length > 320) break; out = out ? out + " " + x : x; if (out.length >= 200) break; }
    return out.length > 340 ? out.slice(0, 337).replace(/\s+\S*$/, "") + "…" : out;
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
    const absEls = [...el.querySelectorAll("Abstract > AbstractText")];
    const concl = absEls.find((x) => /^conclusion/i.test(x.getAttribute("Label") || ""));
    const abstract = (concl ? concl.textContent : absEls.map((x) => x.textContent).join(" ")).trim();
    return {
      abstract,
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
      summary: (p.descriptionModule || {}).briefSummary || "",
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
    const fields = "&fields=" + encodeURIComponent(["IdentificationModule", "StatusModule", "SponsorCollaboratorsModule", "ArmsInterventionsModule", "ContactsLocationsModule", "DescriptionModule"].join(","));
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
        r.items.push({ date: isoDate(a.pd), mla: mlaArticle(a), blurb: briefOf(a.abstract), url: `https://pubmed.ncbi.nlm.nih.gov/${a.pmid}/`, ids: [{ type: "pmid", id: a.pmid }, ...(a.doi ? [{ type: "doi", id: a.doi }] : [])] });
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
        r.items.push({ date: t.date, trialDate: true, mla: mlaTrial(t), blurb: briefOf(t.summary), url: `https://clinicaltrials.gov/study/${t.nct}`, ids: [{ type: "nct", id: t.nct }] });
        for (const iv of t.ivs) addTx(r, iv.name, iv.kind, { type: "nct", id: t.nct });
      }
    }
    const list = [];
    for (const r of people.values()) {
      if (!r.items.length) continue;
      r.items.sort(byRecent);
      const top = r.items[0];
      Object.assign(r, { date: top.date, trialDate: !!top.trialDate, mla: top.mla, ids: r.items.flatMap((x) => x.ids).slice(0, 4),
        pmids: [...new Set(r.items.flatMap((x) => x.ids).filter((x) => x.type === "pmid").map((x) => x.id))] });
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

  // ---------- Citation counts: OpenAlex (free, no key) ----------
  const GENERIC = new Set(["university", "universidad", "universite", "universita", "universitat", "hospital", "medical", "medicine", "center", "centre", "institute", "instituto", "institut", "school", "college", "health", "research", "department", "faculty", "national", "clinic", "clinical", "sciences", "science", "and", "the", "for", "of", "de", "del", "la"]);
  const sigWords = (s) => new Set(norm(s).split(/[^a-z0-9]+/).filter((w) => w.length > 3 && !GENERIC.has(w)));
  const sameInstitution = (a, b) => { const A = sigWords(a), B = sigWords(b); for (const w of A) if (B.has(w)) return true; return false; };
  const nameMatches = (display, r) => {
    const d = norm(display).replace(/[^a-z\s-]/g, " ").split(/\s+/).filter(Boolean);
    const last = norm(r.lastName).split(/\s+/).pop(), firstI = norm(r.firstName).charAt(0);
    return d.length > 0 && d.includes(last) && (!firstI || d[0].charAt(0) === firstI);
  };
  const shortId = (u) => String(u || "").split("/").pop();

  async function citeLookup(list, signal, onProgress) {
    const people = list.filter((r) => (r.treatments || []).length);
    if (!people.length) return { matched: 0, failed: false };
    people.forEach((r) => { r.citePending = true; });
    onProgress();
    let calls = 0, failures = 0;
    const get = async (url) => { calls++; try { return await getOK(url, signal, "json"); } catch (e) { if (e.name === "AbortError") throw e; failures++; return null; } };
    const ids = new Map(); // researcher -> OpenAlex author id
    // 1) Researchers with PubMed papers: find their author id in those papers' authorships.
    const pmids = [...new Set(people.flatMap((r) => r.pmids || []))].slice(0, 100);
    if (pmids.length) {
      const res = await get(`${OPENALEX}works?filter=ids.pmid:${pmids.join("|")}&per-page=100&select=ids,authorships`);
      const byPmid = {};
      for (const w of (res && res.results) || []) { const p = shortId(w.ids && w.ids.pmid); if (p) byPmid[p] = w.authorships || []; }
      for (const r of people) for (const p of r.pmids || []) {
        const hit = (byPmid[p] || []).find((a) => a.author && nameMatches(a.author.display_name || a.raw_author_name, r));
        if (hit) { ids.set(r, shortId(hit.author.id)); break; }
      }
    }
    // 2) Trial investigators without papers here: search by name, accept only one whose institution matches.
    const stats = {};
    const searchable = people.filter((r) => !ids.has(r) && r.organization).slice(0, 15);
    await pool(searchable, 4, async (r) => {
      const res = await get(`${OPENALEX}authors?search=${encodeURIComponent(fullName(r))}&per-page=10&select=id,display_name,cited_by_count,works_count,summary_stats,last_known_institutions`);
      const hits = ((res && res.results) || []).filter((a) => nameMatches(a.display_name, r) && (a.last_known_institutions || []).some((i) => sameInstitution(i.display_name, r.organization)));
      if (hits.length === 1) { const a = hits[0]; ids.set(r, shortId(a.id)); stats[shortId(a.id)] = a; }
    });
    // 3) Citation totals for every matched author, 50 per request.
    const need = [...new Set([...ids.values()].filter((id) => !stats[id]))];
    for (let i = 0; i < need.length; i += 50) {
      const res = await get(`${OPENALEX}authors?filter=openalex:${need.slice(i, i + 50).join("|")}&per-page=50&select=id,display_name,cited_by_count,works_count,summary_stats`);
      for (const a of (res && res.results) || []) stats[shortId(a.id)] = a;
    }
    let matched = 0;
    for (const r of people) {
      r.citePending = false;
      const a = stats[ids.get(r)];
      if (!a) continue;
      matched++;
      r.citations = a.cited_by_count ?? null;
      r.hIndex = (a.summary_stats && a.summary_stats.h_index) ?? null;
      r.works = a.works_count ?? null;
      r.oaUrl = "https://openalex.org/" + shortId(a.id);
    }
    return { matched, failed: calls > 0 && failures === calls };
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
        setStep("org", "active"); setStep("cite", "active");
        const redraw = () => render(list, metaFn);
        const [o, c] = await Promise.all([
          orgLookup(list, ctl.signal, redraw).finally(() => list.forEach((r) => { r.orgPending = false; })),
          citeLookup(list, ctl.signal, redraw).finally(() => list.forEach((r) => { r.citePending = false; })),
        ]);
        if (o.failed) { setStep("org", "error"); problems.push("rorDown"); }
        else setStep("org", "done", { k: "orgDone", v: { m: o.matched, p: o.phones } });
        if (c.failed) { setStep("cite", "error"); problems.push("citeDown"); }
        else setStep("cite", "done", { k: "citeDone", v: { m: c.matched } });
        render(list, metaFn);
        notice(problems.length ? "err" : "", problems);
      }
    } catch (e) {
      if (e && e.name === "AbortError") { notice("", "stopped"); ["pubmed", "trials", "db", "cite", "org"].forEach((s) => { if ($("s-" + s).classList.contains("active")) setStep(s, null); }); lastList.forEach((r) => { r.orgPending = false; r.citePending = false; }); render(lastList, headFn); }
      else { notice("err", "wentWrong"); }
    } finally {
      running = false; $("go").disabled = false; $("stop").hidden = true;
    }
  }

  // ---------- Wire up ----------
  // ---------- Suggestions dropdown ----------
  // "Did you mean" from PubMed's spelling suggester (ESpell), plus matching condition names from the NLM Clinical Tables
  // service. Nothing is changed in the search box unless the user picks a suggestion.
  const CLINTABLES = "https://clinicaltables.nlm.nih.gov/api/conditions/v3/search";
  const qInput = $("q"), sugBox = $("sug");
  let sugItems = [], sugIdx = -1, sugTimer = 0, sugSeq = 0, sugCtl = null;
  const withTimeout = (p, ms) => Promise.race([p, new Promise((_, rej) => setTimeout(() => rej(new Error("timeout")), ms))]);
  function sugClose() {
    sugSeq++; clearTimeout(sugTimer); if (sugCtl) sugCtl.abort();
    sugItems = []; sugIdx = -1; sugBox.hidden = true; sugBox.innerHTML = "";
    qInput.setAttribute("aria-expanded", "false"); qInput.removeAttribute("aria-activedescendant");
  }
  function sugRender() {
    if (!sugItems.length) { sugBox.hidden = true; sugBox.innerHTML = ""; qInput.setAttribute("aria-expanded", "false"); return; }
    sugBox.innerHTML = sugItems.map((it, i) => `<li role="option" id="sug-${i}" data-i="${i}" aria-selected="${i === sugIdx}">${it.fix ? `<span class="sugTag">${esc(tr("sugDidYou"))}</span>` : ""}<span class="sugText">${esc(it.text)}</span></li>`).join("");
    sugBox.hidden = false; qInput.setAttribute("aria-expanded", "true");
    if (sugIdx >= 0) qInput.setAttribute("aria-activedescendant", "sug-" + sugIdx); else qInput.removeAttribute("aria-activedescendant");
  }
  async function sugFetch(term, seq) {
    if (sugCtl) sugCtl.abort();
    sugCtl = new AbortController();
    const sig = sugCtl.signal;
    const [sp, ct] = await Promise.allSettled([
      withTimeout(getOK(`${EUTILS}espell.fcgi?db=pubmed&tool=fanale&term=${encodeURIComponent(term)}`, sig, "text"), 4000),
      withTimeout(getOK(`${CLINTABLES}?terms=${encodeURIComponent(term)}&df=primary_name&sf=primary_name,consumer_name&maxList=7`, sig, "json"), 4000),
    ]);
    if (seq !== sugSeq) return;
    const lc = (x) => x.toLowerCase();
    const items = [], seen = new Set([lc(term)]);
    if (sp.status === "fulfilled") {
      const c = ((new DOMParser().parseFromString(sp.value, "text/xml").querySelector("CorrectedQuery") || {}).textContent || "").replace(/\s+/g, " ").trim();
      if (c && !seen.has(lc(c))) { seen.add(lc(c)); items.push({ text: c, fix: true }); }
    }
    if (ct.status === "fulfilled" && Array.isArray(ct.value) && Array.isArray(ct.value[3])) {
      for (const row of ct.value[3]) {
        const n = String((Array.isArray(row) ? row[0] : row) || "").trim();
        if (n && !seen.has(lc(n)) && items.length < 7) { seen.add(lc(n)); items.push({ text: n }); }
      }
    }
    sugItems = items; sugIdx = -1; sugRender();
  }
  function sugPick(i) {
    const it = sugItems[i]; if (!it) return;
    qInput.value = it.text; sugClose();
    if (!running) runSearch(it.text);
  }
  qInput.addEventListener("input", () => {
    clearTimeout(sugTimer);
    const term = qInput.value.trim();
    if (term.length < 3) { sugClose(); return; }
    const seq = ++sugSeq;
    sugTimer = setTimeout(() => sugFetch(term, seq), 250);
  });
  qInput.addEventListener("keydown", (e) => {
    if (e.key === "Escape") { if (!sugBox.hidden) { e.preventDefault(); sugClose(); } return; }
    if (sugBox.hidden || !sugItems.length) return;
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      sugIdx = e.key === "ArrowDown" ? (sugIdx + 1) % sugItems.length : (sugIdx <= 0 ? sugItems.length - 1 : sugIdx - 1);
      sugRender();
    } else if (e.key === "Enter" && sugIdx >= 0) { e.preventDefault(); sugPick(sugIdx); }
  });
  qInput.addEventListener("blur", () => setTimeout(() => { if (document.activeElement !== qInput) sugClose(); }, 150));
  sugBox.addEventListener("mousedown", (e) => e.preventDefault());
  sugBox.addEventListener("click", (e) => { const li = e.target.closest("li[data-i]"); if (li) sugPick(Number(li.dataset.i)); });
  I.onChange(() => { if (sugItems.length) sugRender(); });

  document.querySelectorAll("#srcBar button").forEach((b) => b.addEventListener("click", () => {
    srcFilter = b.dataset.src;
    try { localStorage.setItem("fanale-src", srcFilter); } catch {}
    render(lastList, headFn);
  }));
  $("printBtn").addEventListener("click", () => window.print());

  // ---------- Copy summary (to bring to a doctor) ----------
  function summaryText(r) {
    const it = itemOf(r) || itemsOf(r)[0];
    const L = [tr("summaryIntro"), "", [fullName(r), r.occupation].filter(has).join(" — ")];
    const org = [r.organization, r.country].filter(has).join(", "); if (org) L.push(org);
    if (has(r.organizationAddress)) L.push(`${tr("address")}: ${r.organizationAddress}`);
    if (has(r.phone)) L.push(`${tr("researcherContact")} · ${tr("phone")}: ${r.phone}`);
    if (has(r.email)) L.push(`${tr("researcherContact")} · ${tr("email")}: ${r.email}`);
    if (has(r.organizationPhone)) L.push(`${tr("workOrg")} · ${tr("phone")}: ${r.organizationPhone}`);
    if (has(r.organizationEmail)) L.push(`${tr("workOrg")} · ${tr("email")}: ${r.organizationEmail}`);
    if (has(r.website)) L.push(`${tr("website")}: ${r.website}`);
    if (r.citations != null) L.push(`${tr("totalCites")}: ${fmtN(r.citations)}`);
    const tx = txOf(r).map((t) => t.name);
    if (tx.length) L.push("", `${tr("txHead")}: ${tx.join(", ")}`);
    if (it && it.mla) L.push("", `${tr(it.trialDate ? "recentTrial" : "recentPub")} (${it.date || ""}):`, it.mla.replace(/<\/?i>/g, ""));
    L.push("", tr("notRec"), "Fanale · Struvante");
    return L.join("\n");
  }
  async function copyText(text) {
    try { await navigator.clipboard.writeText(text); return true; } catch {}
    try {
      const ta = document.createElement("textarea"); ta.value = text; ta.setAttribute("readonly", ""); ta.style.cssText = "position:fixed;opacity:0";
      document.body.appendChild(ta); ta.select(); const ok = document.execCommand("copy"); ta.remove(); return ok;
    } catch { return false; }
  }
  $("grid").addEventListener("click", async (e) => {
    const b = e.target.closest && e.target.closest("button.copyBtn"); if (!b) return;
    const r = lastList.find((x) => String(x.uid) === b.dataset.uid); if (!r) return;
    const ok = await copyText(summaryText(r));
    b.textContent = tr(ok ? "copied" : "copyFailed"); b.classList.toggle("done", ok);
    setTimeout(() => { if (b.isConnected) { b.textContent = tr("copySummary"); b.classList.remove("done"); } }, 2000);
  });
  // ---------- All papers by one researcher, in MLA ----------
  const mlaDlg = $("mlaDlg");
  let mlaLines = [];
  const plain = (h) => String(h).replace(/<\/?i>/g, "");
  async function openMla(r) {
    const name = fullName(r);
    $("mlaTitle").textContent = tr("mlaTitle", { name });
    $("mlaBody").innerHTML = `<p class="hint">${esc(tr("mlaLoading"))}</p>`;
    $("mlaCount").textContent = ""; mlaLines = [];
    if (mlaDlg.showModal) { if (!mlaDlg.open) mlaDlg.showModal(); } else mlaDlg.setAttribute("open", "");
    let arts = [];
    try {
      const last = r.lastName, fore = r.firstName || "";
      const terms = [`"${last} ${fore}"[Author]`, `${last} ${fore.charAt(0)}[Author]`].filter((x, i) => fore || i);
      for (const term of terms) {
        const s = await getOK(`${EUTILS}esearch.fcgi?db=pubmed&retmode=json&sort=pub_date&retmax=100&tool=fanale&term=${encodeURIComponent(term)}`, undefined, "json");
        const ids = ((s && s.esearchresult) || {}).idlist || [];
        if (!ids.length) continue;
        const xml = await getOK(`${EUTILS}efetch.fcgi?db=pubmed&retmode=xml&tool=fanale&id=${ids.join(",")}`, undefined, "text");
        arts = [...new DOMParser().parseFromString(xml, "text/xml").querySelectorAll("PubmedArticle")].map(parseArticle);
        break;
      }
    } catch {}
    mlaLines = arts.map(mlaArticle);
    if (!mlaLines.length) mlaLines = itemsOf(r).map((x) => x.mla).filter(Boolean); // fall back to what this search found
    $("mlaCount").textContent = mlaLines.length ? tr("mlaCount", { n: mlaLines.length }) : "";
    $("mlaBody").innerHTML = mlaLines.length ? `<ol>${mlaLines.map((l) => `<li>${safeMLA(l)}</li>`).join("")}</ol>` : `<p class="hint">${esc(tr("mlaNone"))}</p>`;
  }
  $("grid").addEventListener("click", (e) => {
    const b = e.target.closest && e.target.closest("button.mlaLink"); if (!b) return;
    const r = lastList.find((x) => String(x.uid) === b.dataset.uid); if (r) openMla(r);
  });
  $("mlaClose").addEventListener("click", () => mlaDlg.close ? mlaDlg.close() : mlaDlg.removeAttribute("open"));
  mlaDlg.addEventListener("click", (e) => { if (e.target === mlaDlg && mlaDlg.close) mlaDlg.close(); });
  $("mlaCopy").addEventListener("click", async (e) => {
    const b = e.currentTarget, ok = await copyText(mlaLines.map(plain).join("\n\n"));
    b.textContent = tr(ok ? "copied" : "copyFailed"); setTimeout(() => { b.textContent = tr("mlaCopyAll"); }, 2000);
  });
  $("mlaPrint").addEventListener("click", () => { document.body.classList.add("printMla"); window.print(); });
  window.addEventListener("afterprint", () => document.body.classList.remove("printMla"));
  $("form").addEventListener("submit", (e) => { e.preventDefault(); sugClose(); const q = $("q").value.trim(); if (q && !running) runSearch(q); });
  $("stop").addEventListener("click", () => ctl && ctl.abort());
  document.querySelectorAll(".chip").forEach((b) => b.addEventListener("click", () => { sugClose(); $("q").value = b.dataset.q; if (!running) runSearch(b.dataset.q); }));

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
  document.querySelectorAll("#sortBar button").forEach((b) => b.addEventListener("click", () => {
    sortMode = b.dataset.sort;
    try { localStorage.setItem("fanale-sort", sortMode); } catch {}
    render(lastList, headFn);
  }));

  notice("example", "exampleNotice");
  render(EXAMPLE, () => ({ title: tr("exampleTitle"), sub: tr(subKey(), { n: groupShown(EXAMPLE).reduce((a, g) => a + g.people.length, 0), max: PER_CONTINENT }) }));
})();
