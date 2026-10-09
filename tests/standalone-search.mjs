// Simulated end-to-end test for the free standalone site (index.html + standalone.js).
// Intercepts the PubMed (E-utilities) and ClinicalTrials.gov v2 requests with recorded-format responses.
// Run: npm install && npx playwright install chromium && npm run test:site
import { chromium } from "playwright";
import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";

const here = path.dirname(fileURLToPath(import.meta.url));
const PAGE = pathToFileURL(path.join(here, "..", "index.html")).href;
let failures = 0;
const check = (ok, msg) => { console.log(`${ok ? "PASS" : "FAIL"}  ${msg}`); if (!ok) failures++; };

const ESEARCH = { esearchresult: { idlist: ["42834216", "42000001"] } };
const EFETCH = `<?xml version="1.0"?>
<PubmedArticleSet>
 <PubmedArticle><MedlineCitation><PMID>42834216</PMID><Article>
  <Journal><JournalIssue><Volume>188</Volume><PubDate><Year>2027</Year></PubDate></JournalIssue><Title>Reviews of physiology, biochemistry and pharmacology</Title></Journal>
  <ArticleTitle>AA in Rheumatoid Arthritis and Lupus.</ArticleTitle><Pagination><MedlinePgn>203-252</MedlinePgn></Pagination>
  <AuthorList><Author><LastName>Das</LastName><ForeName>Undurti N</ForeName><AffiliationInfo><Affiliation>UND Life Sciences, Battle Ground, WA, USA. undurti@lipidworld.com.</Affiliation></AffiliationInfo></Author></AuthorList>
 </Article><MeshHeadingList>
  <MeshHeading><DescriptorName>Lupus Erythematosus, Systemic</DescriptorName><QualifierName>drug therapy</QualifierName></MeshHeading>
  <MeshHeading><DescriptorName>Adrenal Cortex Hormones</DescriptorName><QualifierName>therapeutic use</QualifierName></MeshHeading>
  <MeshHeading><DescriptorName>Biomarkers</DescriptorName></MeshHeading>
 </MeshHeadingList></MedlineCitation>
 <PubmedData><ArticleIdList><ArticleId IdType="doi">10.1007/978-981-92-5964-9_9</ArticleId></ArticleIdList></PubmedData></PubmedArticle>
 <PubmedArticle><MedlineCitation><PMID>42000001</PMID><Article>
  <Journal><JournalIssue><Volume>5</Volume><Issue>2</Issue><PubDate><Year>2026</Year><Month>Mar</Month></PubDate></JournalIssue><Title>Lupus science &amp; medicine</Title></Journal>
  <ArticleTitle>Registry of patients in Europe.</ArticleTitle><Pagination><MedlinePgn>e100</MedlinePgn></Pagination>
  <AuthorList>
   <Author><LastName>Rossi</LastName><ForeName>Maria</ForeName><AffiliationInfo><Affiliation>Department of Rheumatology, University of Padua, Padua, Italy.</Affiliation></AffiliationInfo></Author>
   <Author><LastName>Bianchi</LastName><ForeName>Luca</ForeName><AffiliationInfo><Affiliation>University of Padua, Padua, Italy.</Affiliation></AffiliationInfo></Author>
  </AuthorList>
 </Article><MeshHeadingList>
  <MeshHeading><DescriptorName>Hydroxychloroquine</DescriptorName><QualifierName>therapeutic use</QualifierName></MeshHeading>
 </MeshHeadingList></MedlineCitation></PubmedArticle>
</PubmedArticleSet>`;
const ROR_PADUA = { number_of_results: 2, items: [
  { chosen: false, score: 0.7, organization: { names: [{ value: "Padua Hospital", types: ["ror_display"] }] } },
  { chosen: true, score: 1, organization: { id: "https://ror.org/00240q980", names: [{ value: "University of Padua", types: ["ror_display", "label"] }],
    links: [{ type: "website", value: "https://www.unipd.it" }], locations: [{ geonames_details: { name: "Padua", country_name: "Italy" } }],
    external_ids: [{ type: "wikidata", all: ["Q193510"], preferred: null }] } }] };
const ROR_FEINSTEIN = { number_of_results: 1, items: [{ chosen: true, score: 1, organization: { names: [{ value: "Feinstein Institutes for Medical Research", types: ["ror_display"] }],
  links: [{ type: "website", value: "https://feinstein.northwell.edu" }], locations: [{ geonames_details: { name: "Manhasset", country_name: "United States" } }],
  external_ids: [{ type: "wikidata", all: ["Q5442410"], preferred: "Q5442410" }] } }] };
const ROR_NOMATCH = { number_of_results: 3, items: [{ chosen: false, score: 0.6, organization: { names: [{ value: "Some Other Place", types: ["ror_display"] }], links: [{ type: "website", value: "https://wrong.example" }] } }] };
const WIKIDATA = { entities: {
  Q193510: { claims: { P1329: [{ rank: "normal", mainsnak: { datavalue: { value: "+39 049 827 5111" } } }], P968: [{ rank: "normal", mainsnak: { datavalue: { value: "mailto:urp@unipd.it" } } }],
    P6375: [{ rank: "normal", mainsnak: { datavalue: { value: { text: "Via 8 Febbraio 2, Padua", language: "it" } } } }] } },
  Q5442410: { claims: { P1329: [{ rank: "deprecated", mainsnak: { datavalue: { value: "000" } } }, { rank: "normal", mainsnak: { datavalue: { value: "+1 516-562-3000" } } }] } } } };
const CT = { studies: [{ protocolSection: {
  identificationModule: { nctId: "NCT06987565", briefTitle: "Transcutaneous Vagus Nerve Stimulation in SLE" },
  statusModule: { startDateStruct: { date: "2025-07-25" } },
  sponsorCollaboratorsModule: { leadSponsor: { name: "Northwell Health" } },
  armsInterventionsModule: { interventions: [{ type: "DEVICE", name: "Active vagus nerve stimulation" }, { type: "DEVICE", name: "Sham vagus nerve stimulation" }, { type: "DRUG", name: "Placebo" }] },
  contactsLocationsModule: {
    overallOfficials: [{ name: "Cynthia Aranow, MD", affiliation: "Feinstein Institutes for Medical Research", role: "PRINCIPAL_INVESTIGATOR" }],
    centralContacts: [{ name: "Cynthia Aranow, MD", role: "CONTACT", phone: "516-562-3830", email: "caranow@northwell.edu" }],
    locations: [{ facility: "Feinstein Institutes for Medical Research", city: "Manhasset", state: "New York", zip: "11030", country: "United States",
      contacts: [{ name: "Sanita Kandasami", role: "CONTACT", phone: "516-562-0000", email: "skandasami@northwell.edu" }] }],
  } } }] };

async function run(browser, { failPubMed = false, failRor = false } = {}) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 1600 } });
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.route("https://fonts.googleapis.com/**", (r) => r.abort());
  await page.route("https://eutils.ncbi.nlm.nih.gov/**", (r) => {
    if (failPubMed) return r.abort();
    const u = r.request().url();
    if (u.includes("esearch")) return r.fulfill({ status: 200, contentType: "application/json", headers: { "Access-Control-Allow-Origin": "*" }, body: JSON.stringify(ESEARCH) });
    return r.fulfill({ status: 200, contentType: "text/xml", headers: { "Access-Control-Allow-Origin": "*" }, body: EFETCH });
  });
  await page.route("https://api.ror.org/**", (r) => {
    if (failRor) return r.abort();
    const aff = decodeURIComponent(new URL(r.request().url()).searchParams.get("affiliation") || "");
    const body = /Padua/.test(aff) ? ROR_PADUA : /Feinstein/.test(aff) ? ROR_FEINSTEIN : ROR_NOMATCH;
    return r.fulfill({ status: 200, contentType: "application/json", headers: { "Access-Control-Allow-Origin": "*" }, body: JSON.stringify(body) });
  });
  await page.route("https://www.wikidata.org/**", (r) => r.fulfill({ status: 200, contentType: "application/json", headers: { "Access-Control-Allow-Origin": "*" }, body: JSON.stringify(WIKIDATA) }));
  await page.route("https://clinicaltrials.gov/**", (r) => r.fulfill({ status: 200, contentType: "application/json", headers: { "Access-Control-Allow-Origin": "*" }, body: JSON.stringify(CT) }));
  await page.goto(PAGE);
  await page.fill("#q", "systemic lupus erythematosus");
  await page.click("#go");
  await page.waitForFunction(() => { const s = document.getElementById("s-org"); return s.classList.contains("done") || s.classList.contains("error"); }, null, { timeout: 15000 });
  const out = await page.evaluate(() => ({
    sections: [...document.querySelectorAll(".cont")].map((s) => ({ name: s.querySelector(".contHead").firstChild.textContent.trim(), cards: [...s.querySelectorAll(".card")].map((c) => c.innerText) })),
    meta: document.getElementById("rmeta").textContent, notice: document.getElementById("notice").innerText,
    dbRows: document.querySelectorAll("#dbRows tr").length,
    links: [...document.querySelectorAll(".card a")].map((a) => a.textContent + " " + a.href),
  }));
  await page.close();
  return { ...out, errors };
}

const browser = await chromium.launch();
try {
  const r = await run(browser);
  const all = r.sections.flatMap((s) => s.cards).join("\n");
  const card = (name) => r.sections.flatMap((s) => s.cards).find((c) => c.includes(name)) || "";
  check(r.errors.length === 0, "page runs without script errors");
  check(r.sections.map((s) => s.name).join(",") === "North America,Europe", "researchers grouped by continent (North America first)");
  check(/Undurti N Das/.test(all) && /Cynthia Aranow/.test(all) && /Maria Rossi/.test(all), "PubMed authors and trial investigator shown");
  check(r.dbRows === 4, "all researchers kept in the database");
  check(/undurti@lipidworld\.com/.test(all) && !/lipidworld\.com\./.test(all), "email parsed from the PubMed affiliation");
  check(/Adrenal Cortex Hormones/.test(all) && !/Biomarkers/.test(all) && !/Lupus Erythematosus, Systemic/.test(all), "medicines come from MeSH 'therapeutic use' only");
  check(/516-562-3830/.test(all) && /caranow@northwell\.edu/.test(all), "investigator phone and email from the trial registration");
  check(/516-562-0000/.test(card("Aranow")) && !/516-562-3000/.test(card("Aranow")), "trial site contact kept over Wikidata's general number");
  check(/Active vagus nerve stimulation/.test(all) && !/Sham vagus|Placebo/.test(all), "trial treatments exclude placebo and sham");
  check(/MD, Principal Investigator/.test(all), "occupation from degrees and trial role");
  check(/Das, Undurti N\. "AA in Rheumatoid Arthritis and Lupus\." Reviews of Physiology, Biochemistry and Pharmacology, vol\. 188, 2027, pp\. 203-252\./.test(all), "MLA citation from PubMed metadata");
  check(/\+39 049 827 5111/.test(card("Maria Rossi")) && /urp@unipd\.it/.test(card("Maria Rossi")), "organization phone and email from Wikidata (via ROR match)");
  check(/unipd\.it/.test(card("Maria Rossi")) && /feinstein\.northwell\.edu/.test(card("Aranow")), "official website from ROR");
  check(/Matched to University of Padua/.test(card("Maria Rossi")) === false, "no 'matched to' note when names already agree");
  check(!/wrong\.example/.test(all) && /Find organization contact/.test(card("Das")), "unmatched organization (no ROR 'chosen') gets no website, keeps the search link");
  check(!/\b000\b/.test(card("Aranow")), "deprecated Wikidata values ignored");
  check(r.links.some((l) => /Find profile and photo .*google\.com\/search/.test(l)), "profile search link present");

  const g = await run(browser, { failRor: true });
  check(/organization directory \(ROR\) could not be reached/.test(g.notice), "clear message when ROR is unreachable");
  check(g.sections.flatMap((s) => s.cards).some((c) => /Maria Rossi/.test(c)), "results still shown when ROR fails");

  const f = await run(browser, { failPubMed: true });
  check(/PubMed<\/b>|PubMed could not be reached/.test(f.notice) || /PubMed could not be reached/.test(f.notice), "clear message when PubMed is unreachable");
  check(f.sections.flatMap((s) => s.cards).some((c) => /Cynthia Aranow/.test(c)), "ClinicalTrials.gov results still shown when PubMed fails");
} finally {
  await browser.close();
}
console.log(failures ? `\n${failures} check(s) failed` : "\nAll checks passed");
process.exit(failures ? 1 : 0);
