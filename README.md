# Fanale

**A guiding light for families facing rare disease.**

Fanale is a web app that finds the researchers who know the most about a rare disease, and shows how to reach them. Built for the Caribbean AI Summit Healthcare Hackathon, Puerto Rico, October 8–10, 2026.

**Try it:** https://eduardoalvareziv-cmyk.github.io/Fanale/ (no account or sign-in needed)

This repository holds two versions of the same app:

| | **Website version** (`index.html` + `standalone.js`) | **Claude version** (`claude/index.html`) |
|---|---|---|
| Runs on | Any browser, hosted free on GitHub Pages | Claude (claude.ai or the desktop app) |
| Needs | Nothing | A Claude account plus the PubMed, Clinical Trials and Parallel Search connectors |
| Data | PubMed and ClinicalTrials.gov, called directly from the browser | The same, through Claude connectors |
| Researcher database | Built in code: affiliation parsing, trial registrations, MeSH "therapeutic use" indexing | Built by Claude, then verified in code |
| Organization contacts and profiles | Trial site contacts, plus official website and phone/email from the ROR and Wikidata open databases; web-search links as fallback | Looked up on the web with Parallel Search |
| Ranking | Most recent and most cited first, using OpenAlex citation counts; switchable to "Most cited" or "Newest" | Newest publication first |


## The problem, the users, the solution

**Problem.** Over 300 million people live with a rare disease, and diagnosis often takes years. In Puerto Rico, an estimated 110,000–190,000 people are affected (3.5–5.9% global prevalence applied to 3.18 million residents; no official island count exists), and the most specialized care is often off-island. Families have no map to the world's leading experts.

**Users.** Patients, caregivers and families in Puerto Rico and the Caribbean, and the clinicians who refer them.

**Solution.** Type a diagnosis in plain language. Fanale searches PubMed and ClinicalTrials.gov, builds a temporary database of the researchers behind the newest work, and shows them grouped by continent with:

- Name, occupation, and researcher contact details when the sources list them
- Work organization, address, country, and organization phone/email (found on the web when the sources don't list them, with a link to where they came from)
- A link to the researcher's profile page, where their photo is
- Treatments and medicines named in that researcher's own papers or trials
- Date and MLA citation of their most recent publication, with PMID, DOI and NCT links

## How it works (Claude version)

The website version follows the same steps without Claude or Parallel Search; see "Website version" below.

```
Diagnosis ──► PubMed (40 newest articles + metadata)        ┐
          └─► ClinicalTrials.gov (active trials + PIs)      ├─► Claude builds the researcher database
                                                            ┘          │
                                                                       ▼
              Parallel Search (organization contacts, profile pages) ◄─┘
                                                                       │
                                                                       ▼
                  Verified cards, up to 10 per continent, newest publication first
```

1. **Search.** The page calls the PubMed and Clinical Trials connectors directly: `search_articles` + `get_article_metadata`, and `search_trials` + `search_investigators`.
2. **Build the database.** Claude reads the compacted records and picks lead and senior authors and trial principal investigators, parsing their affiliation, location, continent and the treatments named in their work.
3. **Verify.** The page code, not the model, checks every item against the source data before showing it:
   - A researcher must appear in the records.
   - Every PMID and NCT ID must exist in the results.
   - Emails and phone numbers must appear word for word in a source.
   - Each treatment must be named in the specific paper or trial it is credited to.
   - Web-sourced contacts and profile links must appear in the search results.
   - MLA citations are built in code from PubMed metadata, not written by the model.
4. **Look up on the web.** For organizations without a listed phone or email, and for each shown researcher's profile page, the page runs batched Parallel Search queries, with one retry when the free tier is busy.
5. **Show.** Researchers appear only if they have at least one way to be reached and at least one treatment or medicine named in their work. They are grouped by continent (North America, including Puerto Rico and the Caribbean, first), up to 10 per continent, numbered from 1 in each section, newest publication first. Everyone found stays in the "Temporary researcher database" table.

## Running or reviewing the project

### Website version (no account needed)

**Languages:** English (default), Español, Français, Português, Deutsch, Русский, 中文, हिन्दी, 日本語, العربية (right-to-left) and Kiswahili, covering every continent. Pick one from the globe menu in the header, or link straight to one with `?lang=` (for example `?lang=es`). The choice is remembered in the visitor's browser. The interface is translated. Research data (names, titles, affiliations, MLA citations) stays as published, and searches work best with the English medical name, which the page explains in each language. Translations are in `i18n.js` (English, Spanish, French, Portuguese) and `i18n-more.js` (the rest). They were machine-drafted, so native-speaker review is welcome.

Open https://eduardoalvareziv-cmyk.github.io/Fanale/, type a diagnosis (for example *Hermansky-Pudlak syndrome* or *systemic lupus erythematosus*) and click **Search**. Results take a few seconds. The page runs entirely in the visitor's browser and calls:

- **PubMed E-utilities:** `esearch` for the 40 newest articles, and `efetch` for titles, authors, affiliations and MeSH indexing.
- **ClinicalTrials.gov API v2:** active trials, with officials, contacts, sites and interventions.
- **ROR (Research Organization Registry):** matches each raw affiliation to an official organization, its website and its Wikidata ID. Only ROR's own confident ("chosen") match is used.
- **Wikidata:** the matched organization's main phone number, email and street address, when recorded.
- **OpenAlex:** each researcher's total citations, h-index and number of works.

None of these services needs an API key.

How the website version builds each card:

- **Researchers:** the first and last author of each article, plus each trial's overall officials, merged by name.
- **Contacts:** emails are parsed from PubMed affiliations. Phone numbers and emails come from trial registrations. Organization contacts come from the trial site contact at the researcher's institution.
- **Medicines:** substances PubMed's indexers tagged with the MeSH qualifier "therapeutic use", and trial interventions of type drug or biological.
- **Treatments:** trial interventions such as procedures, devices and behavioral therapy. Placebo and sham arms are excluded.
- **Who is shown:** researchers appear only if they have a treatment or medicine and at least one real contact: a phone or email for the researcher or their organization. Everyone else stays in the temporary database table.
- **Organization contacts:** the trial site contact comes first. The organization's general phone number and email from Wikidata are used only when that's missing, labeled with their source.
- **Missing contacts:** where a profile or organization contact isn't in any source, the card offers a web-search link instead.
- **Citations:** each researcher is matched to their OpenAlex author profile through their own PubMed paper (name must match an author of that paper). Trial investigators without a paper in the results are matched by name only when exactly one OpenAlex author with that name works at the same institution. The card shows "Cited N times · h-index · works" with a link to the OpenAlex profile.
- **Ranking:** by default, researchers with the most recent publication *and* the most citations come first. Each researcher gets a recency percentile and a citation percentile within the results, and the two are averaged equally; a researcher whose citation count isn't found gets no citation credit. The "Rank by" buttons switch to "Most cited" (career citations only) or "Newest" (most recent publication only); the choice is remembered in the browser.

To run it locally, serve the folder with any static server (`npx serve .`) and open the printed address.

### Claude version (runs inside Claude)

`claude/index.html` is the version published as a Claude artifact. It adds a Claude-built researcher database, Parallel Search lookups of organization contacts and profile pages, and verification of every model output against the source data.

1. Open the published Fanale artifact in claude.ai or the Claude desktop app.
2. Add these connectors in Settings → Connectors (none needs a login): **PubMed**, **Clinical Trials**, **Parallel Search**.
3. Search a diagnosis and allow the page to use the connectors and Claude when asked. A search takes about 30–90 seconds.

### Tests

Both versions have simulated end-to-end tests. They replay recorded-format PubMed and ClinicalTrials.gov responses through the real page code and check the data rules: parsing, verification, filtering, the continent grouping and the 10-per-continent limit.

```bash
npm install
npx playwright install chromium
npm test              # both versions
npm run test:site     # website version only
npm run test:claude   # Claude version only
```

## Data, privacy and limitations

- **Data:** only public sources are used (PubMed, ClinicalTrials.gov, ROR, Wikidata, OpenAlex and public web pages). No patient data, no confidential information, and no credentials are in this repository or the app.
- **No user data is collected, archived, or shared by Fanale.** The researcher database lives only in the open page and is discarded when it closes. In the website version, the diagnosis a user types is sent only to PubMed and ClinicalTrials.gov, researchers' affiliations to ROR and Wikidata, and researchers' names and PubMed IDs to OpenAlex. In the Claude version it also goes to Parallel Search and Claude.
- **Not medical advice.** Treatments shown are those named in the research, not recommendations.
- **Limitations:**
  - Researchers' personal phone numbers are rarely published, so most contacts come from the researcher's organization.
  - Claude version: the Clinical Trials connector lists trial contacts by name only. The website version reads phone numbers and emails straight from the ClinicalTrials.gov API.
  - Website version: organization phone numbers and emails exist in Wikidata for many large universities and hospitals but not for many smaller institutes, so coverage is partial.
  - Website version: medicines depend on PubMed's MeSH indexing, which can lag new articles by weeks, so the newest papers may show none yet.
  - Profile links come from web search and should be confirmed as the same person.
  - The page cannot display photos hosted on other sites, so it links to the profile page instead.
  - Claude version: Parallel Search's free tier is rate-limited; the page offers a "Retry web lookup" button.
  - Website version: citation counts are career totals from OpenAlex, which reflect all of a researcher's work, not only work on the searched disease. Name matching can occasionally miss a researcher (shown as "Citation count not found") or, rarely, pick a namesake. OpenAlex allows a limited number of keyless requests per day (each search uses about 2–17), which is ample for a demo; a free OpenAlex key raises it.
  - Results reflect the newest 40 PubMed articles and active trials, not every expert in the field.

## Built with

- Website version: NCBI E-utilities, the ClinicalTrials.gov API v2, ROR, Wikidata and OpenAlex, hosted on GitHub Pages
- Claude version: Claude artifact runtime, connectors (`mcp`) and Claude (`sample`)
- Claude version connectors: PubMed, Clinical Trials and Parallel Search
- Vanilla HTML, CSS and JavaScript; no build step
- Typefaces: TeX Gyre Pagella (GUST Font License, embedded), Public Sans and IBM Plex Mono (Google Fonts, SIL Open Font License)

## Credit

Created by **Struvante**, Puerto Rico.

## License

MIT License. Copyright (c) 2026 Struvante. See [LICENSE](LICENSE).

The embedded TeX Gyre Pagella typeface is distributed under the GUST Font License; Public Sans and IBM Plex Mono are loaded from Google Fonts under the SIL Open Font License. Those fonts keep their own licenses.
