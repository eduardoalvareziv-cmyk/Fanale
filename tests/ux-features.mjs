// Checks for the UX additions: abstract summary + link, hover explanations, one-line disclaimer, MLA list of a researcher's papers.
import { chromium } from "playwright";
import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";
const here = path.dirname(fileURLToPath(import.meta.url));
const PAGE = pathToFileURL(path.join(here, "..", "index.html")).href;
let failures = 0;
const check = (ok, msg) => { console.log(`${ok ? "PASS" : "FAIL"}  ${msg}`); if (!ok) failures++; };
const cors = { "Access-Control-Allow-Origin": "*" };
const art = (pmid, year, title, abs) => `<PubmedArticle><MedlineCitation><PMID>${pmid}</PMID><Article>
 <Journal><JournalIssue><Volume>9</Volume><PubDate><Year>${year}</Year></PubDate></JournalIssue><Title>Example journal of lupus</Title></Journal>
 <ArticleTitle>${title}.</ArticleTitle><Pagination><MedlinePgn>1-9</MedlinePgn></Pagination>${abs}
 <AuthorList><Author><LastName>Das</LastName><ForeName>Undurti N</ForeName><AffiliationInfo><Affiliation>UND Life Sciences, Battle Ground, WA, USA. undurti@lipidworld.com.</Affiliation></AffiliationInfo></Author></AuthorList>
 </Article><MeshHeadingList><MeshHeading><DescriptorName>Adrenal Cortex Hormones</DescriptorName><QualifierName>therapeutic use</QualifierName></MeshHeading></MeshHeadingList></MedlineCitation></PubmedArticle>`;
const ABS = `<Abstract><AbstractText Label="BACKGROUND">Background sentence that should not be used.</AbstractText><AbstractText Label="CONCLUSIONS">Steroids helped kidney outcomes in this example. Flares were less frequent.</AbstractText></Abstract>`;
const XML = `<?xml version="1.0"?><PubmedArticleSet>${art("111", "2027", "First example paper", ABS)}${art("222", "2024", "Second example paper", "")}${art("333", "2020", "Third example paper", "")}</PubmedArticleSet>`;
const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
  const errors = []; page.on("pageerror", (e) => errors.push(e.message));
  await page.addInitScript(() => { window.__copied = null; Object.defineProperty(navigator, "clipboard", { value: { writeText: async (s) => { window.__copied = s; } }, configurable: true }); });
  const terms = [];
  await page.route("https://fonts.googleapis.com/**", (r) => r.abort());
  await page.route("https://eutils.ncbi.nlm.nih.gov/**", (r) => {
    const u = new URL(r.request().url());
    if (u.pathname.includes("esearch")) { terms.push(u.searchParams.get("term")); return r.fulfill({ status: 200, contentType: "application/json", headers: cors, body: JSON.stringify({ esearchresult: { idlist: ["111", "222", "333"] } }) }); }
    return r.fulfill({ status: 200, contentType: "text/xml", headers: cors, body: XML });
  });
  for (const h of ["clinicaltrials.gov", "api.ror.org", "api.openalex.org", "www.wikidata.org", "clinicaltables.nlm.nih.gov"]) await page.route(`https://${h}/**`, (r) => r.abort());
  await page.goto(PAGE);
  check(/Let us find the researchers that know this condition best\./.test(await page.textContent("h1")), "headline text");
  const foot = await page.evaluate(() => { const d = document.querySelector("footer .disclaimer"); const r = d.getBoundingClientRect(); const lh = parseFloat(getComputedStyle(d).lineHeight); return { text: d.textContent, lines: Math.round(r.height / lh), w: r.width, cw: document.querySelector(".wrap").getBoundingClientRect().width, credit: document.querySelector("footer .credit").getBoundingClientRect().top > r.bottom - 1 }; });
  check(foot.text === "Fanale is not medical advice. Researcher details come from public PubMed records, ClinicalTrials.gov, ROR, Wikidata and OpenAlex. No user data is collected, archived, or shared.", "disclaimer text exact");
  check(foot.lines === 1 && foot.w <= foot.cw, `disclaimer on one line within the page (${foot.lines} line, ${Math.round(foot.w)}px of ${Math.round(foot.cw)}px)`);
  check(foot.credit, "Struvante credit on its own line below");

  await page.fill("#q", "lupus"); await page.click("#go");
  await page.waitForSelector(".card .abs", { timeout: 15000 });
  const c = await page.evaluate(() => { const card = document.querySelector(".card"); const abs = card.querySelector(".abs"); const lab = card.querySelector(".pub .label");
    return { abs: abs.textContent, href: abs.querySelector("a").href, above: abs.compareDocumentPosition(lab) & Node.DOCUMENT_POSITION_FOLLOWING, tips: [...card.querySelectorAll(".tip")].map((t) => t.textContent) }; });
  check(/Steroids helped kidney outcomes in this example\. Flares were less frequent\./.test(c.abs) && !/Background sentence/.test(c.abs), "abstract summary uses the conclusions");
  check(c.href === "https://pubmed.ncbi.nlm.nih.gov/111/", "link to the full abstract on PubMed");
  check(!!c.above, "summary sits above the most recent publication");
  check(c.tips.length >= 1 && c.tips.some((t) => /Total citations/.test(t) && /how many times other researchers/.test(t)), "total citations has a hover explanation");
  const vis = async () => page.evaluate(() => getComputedStyle(document.querySelector(".card .tip .tipBox")).visibility);
  await page.hover(".card .tip");
  check((await vis()) === "visible", "explanation shows on hover");
  await page.mouse.move(5, 5);
  check((await vis()) === "hidden", "explanation hides again");

  await page.click(".card .mlaLink");
  await page.waitForSelector("#mlaDlg li", { timeout: 8000 });
  const m = await page.evaluate(() => ({ items: [...document.querySelectorAll("#mlaDlg li")].map((l) => l.textContent), title: document.getElementById("mlaTitle").textContent, count: document.getElementById("mlaCount").textContent }));
  check(m.items.length === 3 && /^Das, Undurti N\. "First example paper\./.test(m.items[0]), "MLA list of the researcher's papers, newest first");
  check(/Undurti N Das/.test(m.title) && /3 references/.test(m.count), "dialog title and count");
  check(/Das/.test(terms[terms.length - 1] || "") && /\[Author\]/.test(terms[terms.length - 1]), "PubMed searched by author name");
  await page.click("#mlaCopy");
  const copied = await page.evaluate(() => window.__copied);
  check(copied && copied.split("\n\n").length === 3 && !/<i>/.test(copied), "Copy all gives plain MLA lines");
  await page.click("#mlaClose");
  check(!(await page.evaluate(() => document.getElementById("mlaDlg").open)), "dialog closes");
  check(errors.length === 0, "no script errors" + (errors.length ? ": " + errors[0] : ""));
} finally { await browser.close(); }
console.log(failures ? `${failures} check(s) failed` : "All checks passed");
process.exit(failures ? 1 : 0);
