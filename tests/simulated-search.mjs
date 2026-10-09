// Simulated end-to-end test for Fanale.
// Replays recorded PubMed / ClinicalTrials.gov responses (and a simulated Parallel Search and Claude)
// through the real page code, then checks the verification and display rules.
// Run: npm install && npx playwright install chromium && npm test
import { chromium } from "playwright";
import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";

const here = path.dirname(fileURLToPath(import.meta.url));
const PAGE = pathToFileURL(path.join(here, "..", "index.html")).href;

let failures = 0;
const check = (ok, msg) => { console.log(`${ok ? "PASS" : "FAIL"}  ${msg}`); if (!ok) failures++; };

// Scenario 1: recorded lupus data with deliberately invented items mixed in.
function scenarioVerification() {
  const ART = { articles: [{ identifiers: { pmid: "42834216", doi: "10.1007/978-981-92-5964-9_9" }, title: "AA in Rheumatoid Arthritis and Lupus.",
    abstract: "In general, corticosteroids, disease-modifying drugs, and monoclonal antibodies against IL-6 and TNF-α, JAK inhibitors are used in RA and lupus.",
    keywords: ["Corticosteroids"], mesh_terms: ["Adrenal Cortex Hormones"], journal: { title: "Reviews of physiology, biochemistry and pharmacology" },
    authors: [{ last_name: "Das", fore_name: "Undurti N", affiliations: ["UND Life Sciences, Battle Ground, WA, USA. undurti@lipidworld.com."] }],
    publication_date: { year: "2027" }, citation: { volume: "188", pages: "203-252" } }] };
  const TR = { items: [{ nct_id: "NCT06987565", title: "Transcutaneous Vagus Nerve Stimulation in SLE (TvSSLE)", sponsor: "Northwell Health", start_date: "2025-07-25", interventions: ["Active vagus nerve stimulation", "Sham vagus nerve stimulation"] }] };
  const INV = { investigators: [
    { name: "Cynthia Aranow, MD", role: "PRINCIPAL_INVESTIGATOR", affiliation: "Feinstein Institutes for Medical Research", facility: "Feinstein Institutes for Medical Research", location: "Manhasset, New York", nct_id: "NCT06987565" },
    { name: "Mark Smith", role: "PRINCIPAL_INVESTIGATOR", affiliation: "Hidden Hospital", facility: "Hidden Hospital", location: "Boston", nct_id: "NCT06987565" }] };
  const WEB_ORG = { results: [{ url: "https://feinstein.northwell.edu/contact", excerpts: ["Feinstein Institutes, Manhasset, NY 11030. Phone: (516) 562-3400. Email: info@northwell.edu"] }] };
  const WEB_PROFILE = { results: [{ url: "https://feinstein.northwell.edu/institutes-researchers/our-researchers/cynthia-aranow-md", excerpts: ["Cynthia Aranow, MD, investigator at the Feinstein Institutes"] }] };
  return { ART, TR, INV, WEB_ORG, WEB_PROFILE,
    PEOPLE: [
      { firstName: "Undurti N", lastName: "Das", email: "undurti@lipidworld.com", phone: "555-1234567", organization: "UND Life Sciences", organizationAddress: "Battle Ground, WA", country: "USA", continent: "North America", pmids: ["42834216"], nctIds: [],
        treatments: [{ name: "Corticosteroids", kind: "Medicine", source: "PMID:42834216" }, { name: "Rituximab", kind: "Medicine", source: "PMID:42834216" }, { name: "Vagus nerve stimulation", kind: "Treatment", source: "NCT06987565" }] },
      { firstName: "Cynthia", lastName: "Aranow", occupation: "MD, Principal Investigator", organization: "Feinstein Institutes for Medical Research", organizationAddress: "Manhasset, New York", country: "United States", continent: "North America", pmids: [], nctIds: ["NCT06987565"],
        treatments: [{ name: "Active vagus nerve stimulation", kind: "Treatment", source: "NCT06987565" }] },
      { firstName: "Mark", lastName: "Smith", organization: "Hidden Hospital", country: "United States", pmids: [], nctIds: ["NCT06987565"], treatments: [] },
      { firstName: "Fake", lastName: "Person", pmids: ["1"], nctIds: [] }],
    ORGS: [{ organization: "Feinstein Institutes for Medical Research", phone: "(516) 562-3400", email: "info@northwell.edu", url: "https://feinstein.northwell.edu/contact" },
           { organization: "UND Life Sciences", phone: "(360) 999-9999", email: "made@up.com", url: "https://nope.example" }],
    PROFILES: [{ firstName: "Cynthia", lastName: "Aranow", url: "https://feinstein.northwell.edu/institutes-researchers/our-researchers/cynthia-aranow-md" },
               { firstName: "Undurti N", lastName: "Das", url: "https://made-up.example/das" }],
    busyFirstWebCall: true };
}

// Scenario 2: 13 qualifying researchers on one continent, to check the 10-per-continent limit.
function scenarioCap() {
  const names = Array.from({ length: 13 }, (_, i) => ({ first: "Ana" + String.fromCharCode(65 + i), last: "Rivera" + String.fromCharCode(65 + i) }));
  return {
    ART: { articles: [] }, TR: { items: [{ nct_id: "NCT06987565", title: "Vagus Nerve Stimulation in SLE", sponsor: "Northwell Health", start_date: "2025-07-25", interventions: ["Active vagus nerve stimulation"] }] },
    INV: { investigators: names.map((n) => ({ name: `${n.first} ${n.last}`, role: "PRINCIPAL_INVESTIGATOR", affiliation: "Feinstein Institutes for Medical Research", facility: "Feinstein Institutes for Medical Research", location: "Manhasset, New York", nct_id: "NCT06987565" })) },
    WEB_ORG: { results: [{ url: "https://feinstein.northwell.edu/contact", excerpts: ["Phone: (516) 562-3400"] }] }, WEB_PROFILE: { results: [] },
    PEOPLE: names.map((n) => ({ firstName: n.first, lastName: n.last, organization: "Feinstein Institutes for Medical Research", country: "United States", continent: "North America", pmids: [], nctIds: ["NCT06987565"], treatments: [{ name: "Active vagus nerve stimulation", kind: "Treatment", source: "NCT06987565" }] })),
    ORGS: [{ organization: "Feinstein Institutes for Medical Research", phone: "(516) 562-3400", email: null, url: "https://feinstein.northwell.edu/contact" }],
    PROFILES: [], busyFirstWebCall: false };
}

async function run(browser, data) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 1600 } });
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.addInitScript((d) => {
    let webCalls = 0;
    const mcp = { callTool: async (server, tool, input) => {
      if (tool === "search_articles") return { payload: { pmids: d.ART.articles.map((a) => a.identifiers.pmid) } };
      if (tool === "get_article_metadata") return { payload: d.ART };
      if (tool === "search_trials") return { payload: d.TR };
      if (tool === "search_investigators") return { payload: d.INV };
      if (tool === "web_search") {
        webCalls++;
        if (d.busyFirstWebCall && webCalls === 1) throw { code: "tool_error", message: "Error POSTing to endpoint: Too Many Requests" };
        return { payload: /profile page/.test(input.objective) ? d.WEB_PROFILE : d.WEB_ORG };
      }
      throw { code: "bad_request", message: "unexpected tool " + tool };
    } };
    const sample = { json: async (prompt) => {
      if (prompt.includes("RESEARCHERS:")) return { profiles: d.PROFILES };
      if (prompt.includes("ORGANIZATIONS:")) return { orgs: d.ORGS };
      return { researchers: d.PEOPLE };
    } };
    window.claude = { use: async (n) => (n === "mcp" ? mcp : n === "sample" ? sample : n === "permissions" ? { request: async () => ({}) } : null) };
  }, data);
  await page.goto(PAGE);
  await page.fill("#q", "systemic lupus erythematosus");
  await page.click("#go");
  await page.waitForFunction(() => /profiles/.test(document.getElementById("n-web").textContent), null, { timeout: 30000 });
  const result = await page.evaluate(() => ({
    cards: [...document.querySelectorAll(".card")].map((c) => c.innerText),
    sections: [...document.querySelectorAll(".cont")].map((s) => ({ name: s.querySelector(".contHead").firstChild.textContent.trim(), ranks: [...s.querySelectorAll(".rank")].map((r) => r.textContent) })),
    meta: document.getElementById("rmeta").textContent,
    dbRows: document.querySelectorAll("#dbRows tr").length,
  }));
  await page.close();
  return { ...result, errors };
}

const browser = await chromium.launch();
try {
  const v = await run(browser, scenarioVerification());
  const all = v.cards.join("\n");
  check(v.errors.length === 0, "page runs without script errors");
  check(v.cards.length === 2, "two researchers shown (Das, Aranow)");
  check(!/Fake Person/.test(all), "invented researcher is rejected");
  check(!/Mark Smith/.test(all) && v.dbRows === 3, "researcher with no treatments is hidden but kept in the database");
  check(!/555-1234567/.test(all), "invented researcher phone is rejected");
  check(/undurti@lipidworld\.com/.test(all), "email from the PubMed affiliation is kept");
  check(!/made@up\.com|999-9999/.test(all), "invented organization contacts are rejected");
  check(/\(516\) 562-3400/.test(all) && /info@northwell\.edu/.test(all), "web-sourced organization contacts are shown (after a busy-retry)");
  check(/Corticosteroids/.test(all) && !/Rituximab/.test(all), "treatment not named in the paper is rejected");
  check(!/Vagus nerve stimulation\s*\n?\s*TREATMENT[\s\S]*Das/i.test(all), "trial treatment credited to the wrong researcher is rejected");
  check(!/made-up\.example/.test(all), "invented profile link is rejected");
  check(/Profile and photo/.test(all), "real profile link is shown");
  check(/Das, Undurti N\. "AA in Rheumatoid Arthritis and Lupus\." Reviews of Physiology, Biochemistry and Pharmacology, vol\. 188, 2027, pp\. 203-252\./.test(all), "MLA citation is built from PubMed metadata");

  const c = await run(browser, scenarioCap());
  check(c.sections.length === 1 && c.sections[0].name === "North America", "researchers grouped under North America");
  check(c.sections[0].ranks.join(",") === "1,2,3,4,5,6,7,8,9,10", "at most 10 per continent, numbered from 1");
  check(c.dbRows === 13 && /3 more over the limit/.test(c.meta), "researchers over the limit stay in the database");
} finally {
  await browser.close();
}
console.log(failures ? `\n${failures} check(s) failed` : "\nAll checks passed");
process.exit(failures ? 1 : 0);
