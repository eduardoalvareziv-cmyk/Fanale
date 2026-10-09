// Language menu test: English by default, every language redraws the page, Arabic flips to right-to-left, ?lang= links work.
import { chromium } from "playwright";
import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";

const here = path.dirname(fileURLToPath(import.meta.url));
const PAGE = pathToFileURL(path.join(here, "..", "index.html")).href;
let failures = 0;
const check = (ok, msg) => { console.log(`${ok ? "PASS" : "FAIL"}  ${msg}`); if (!ok) failures++; };

const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 1400 } });
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.route("https://fonts.googleapis.com/**", (r) => r.abort());
  await page.goto(PAGE);
  const snap = () => page.evaluate(() => ({
    lang: document.documentElement.lang, dir: document.documentElement.dir,
    h1: document.querySelector("h1").textContent, search: document.getElementById("go").textContent,
    cont: document.querySelector(".contHead").firstChild.textContent, label: document.querySelector(".card .label").textContent,
    title: document.getElementById("rtitle").textContent, notice: document.getElementById("notice").innerText,
    hintHidden: document.getElementById("searchHint").hidden, options: [...document.querySelectorAll("#lang option")].map((o) => o.value),
    chip: document.querySelector(".chip").textContent, chipQ: document.querySelector(".chip").dataset.q,
  }));
  let s = await snap();
  check(s.lang === "en" && /Find the researchers/.test(s.h1) && s.hintHidden, "English is the default");
  check(s.options.join(",") === "en,es,fr,pt,de,ru,zh,hi,ja,ar,sw", "11 languages in the menu");

  const expect = { es: ["Encuentra", "América del Norte", "Buscar"], fr: ["Trouvez", "Amérique du Nord", "Rechercher"], pt: ["Encontre", "América do Norte", "Pesquisar"],
    de: ["Finden", "Nordamerika", "Suchen"], ru: ["Найдите", "Северная Америка", "Найти"], zh: ["找到", "北美洲", "搜索"], hi: ["खोजें", "उत्तरी अमेरिका", "खोजें"],
    ja: ["見つけ", "北アメリカ", "検索"], ar: ["اعثر", "أمريكا الشمالية", "بحث"], sw: ["Pata", "Amerika Kaskazini", "Tafuta"] };
  for (const [code, [h, c, b]] of Object.entries(expect)) {
    await page.selectOption("#lang", code);
    s = await snap();
    check(s.lang === code && s.h1.includes(h) && s.cont === c && s.search === b && !s.hintHidden && s.chipQ === "systemic lupus erythematosus" && !/Example layout|Researcher contact/.test(s.notice + s.label),
      `${code}: page, cards, notice and continent names redraw; search tip shown; example search stays in English`);
  }
  await page.selectOption("#lang", "ar");
  check((await snap()).dir === "rtl", "Arabic switches the page to right-to-left");
  await page.selectOption("#lang", "en");
  s = await snap();
  check(s.dir === "ltr" && /Researcher contact/.test(s.label) && s.hintHidden, "switching back to English restores everything");

  await page.goto(PAGE + "?lang=ja");
  s = await snap();
  check(s.lang === "ja" && s.h1.includes("見つけ"), "?lang=ja link opens in Japanese");
  check(errors.length === 0, "no script errors");
  await page.close();
} finally {
  await browser.close();
}
console.log(failures ? `\n${failures} check(s) failed` : "\nAll checks passed");
process.exit(failures ? 1 : 0);
