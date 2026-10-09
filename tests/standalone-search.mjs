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
 </Article></MedlineCitation></PubmedArticle>
</PubmedArticleSet>`;
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

async function run(browser, { failPubMed = false } = {}) {
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
  await page.route("https://clinicaltrials.gov/**", (r) => r.fulfill({ status: 200, contentType: "application/json", headers: { "Access-Control-Allow-Origin": "*" }, body: JSON.stringify(CT) }));
  await page.goto(PAGE);
  await page.fill("#q", "systemic lupus erythematosus");
  await page.click("#go");
  await page.waitForFunction(() => /researchers/.test(document.getElementById("n-db").textContent), null, { timeout: 15000 });
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
  check(r.errors.length === 0, "page runs without script errors");
  check(r.sections.map((s) => s.name).join(",") === "North America", "researchers grouped by continent");
  check(/Undurti N Das/.test(all) && /Cynthia Aranow/.test(all), "PubMed author and trial investigator both shown");
  check(!/Maria Rossi|Luca Bianchi/.test(all) && r.dbRows === 4, "researchers with no treatments are hidden but kept in the database");
  check(/undurti@lipidworld\.com/.test(all) && !/lipidworld\.com\./.test(all), "email parsed from the PubMed affiliation");
  check(/Adrenal Cortex Hormones/.test(all) && !/Biomarkers/.test(all) && !/Lupus Erythematosus, Systemic/.test(all), "medicines come from MeSH 'therapeutic use' only");
  check(/516-562-3830/.test(all) && /caranow@northwell\.edu/.test(all), "investigator phone and email from the trial registration");
  check(/516-562-0000/.test(all) && /site contact for NCT06987565/.test(all), "organization contact from the trial site contact");
  check(/Active vagus nerve stimulation/.test(all) && !/Sham vagus|Placebo/.test(all), "trial treatments exclude placebo and sham");
  check(/MD, Principal Investigator/.test(all), "occupation from degrees and trial role");
  check(/Manhasset, New York 11030/.test(all), "address from the trial site location");
  check(/Das, Undurti N\. "AA in Rheumatoid Arthritis and Lupus\." Reviews of Physiology, Biochemistry and Pharmacology, vol\. 188, 2027, pp\. 203-252\./.test(all), "MLA citation from PubMed metadata");
  check(r.links.some((l) => /Find profile and photo .*google\.com\/search/.test(l)) && r.links.some((l) => /Find organization contact/.test(l)), "profile and organization-contact search links present");

  const f = await run(browser, { failPubMed: true });
  check(/PubMed<\/b>|PubMed could not be reached/.test(f.notice) || /PubMed could not be reached/.test(f.notice), "clear message when PubMed is unreachable");
  check(f.sections.flatMap((s) => s.cards).some((c) => /Cynthia Aranow/.test(c)), "ClinicalTrials.gov results still shown when PubMed fails");
} finally {
  await browser.close();
}
console.log(failures ? `\n${failures} check(s) failed` : "\nAll checks passed");
process.exit(failures ? 1 : 0);
