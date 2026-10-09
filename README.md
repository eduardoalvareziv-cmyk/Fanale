# Fanale

**A guiding light for families facing rare disease.**

Fanale is a web app that finds the researchers who know the most about a rare disease, and shows how to reach them. Built for the Caribbean AI Summit Healthcare Hackathon, Puerto Rico, October 8–10, 2026.

## The problem, the users, the solution

**Problem.** Over 300 million people live with a rare disease, and diagnosis often takes years. In Puerto Rico, an estimated 110,000–190,000 people are affected (3.5–5.9% global prevalence applied to 3.18 million residents; no official island count exists), and the most specialized care is often off-island. Families have no map to the world's leading experts.

**Users.** Patients, caregivers and families in Puerto Rico and the Caribbean, and the clinicians who refer them.

**Solution.** Type a diagnosis in plain language. Fanale searches PubMed and ClinicalTrials.gov, builds a temporary database of the researchers behind the newest work, and shows them grouped by continent with:

- Name, occupation, and researcher contact details when the sources list them
- Work organization, address, country, and organization phone/email (found on the web when the sources don't list them, with a link to where they came from)
- A link to the researcher's profile page, where their photo is
- Treatments and medicines named in that researcher's own papers or trials
- Date and MLA citation of their most recent publication, with PMID, DOI and NCT links

## How it works

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

### Live app (runs inside Claude)

Fanale is published as a Claude artifact. The live search runs in the viewer's browser, on the viewer's own Claude account:

1. Open the published Fanale artifact in claude.ai or the Claude desktop app.
2. Add these connectors in Settings → Connectors (none needs a login): **PubMed**, **Clinical Trials**, **Parallel Search**.
3. Search a diagnosis, for example *Hermansky-Pudlak syndrome* or *systemic lupus erythematosus*. Allow the page to use the connectors and Claude when asked. A search takes about 30–90 seconds.

No server or computer needs to be running. The page uses the artifact runtime's `mcp` (connectors) and `sample` (Claude) capabilities.

### Review the code and layout locally

`index.html` is the complete app in one file: markup, styles and script.

- **Open it in any browser** to see the layout with fictional example researchers. Live search needs the Claude runtime, so outside Claude the page explains that instead of searching.
- **Run the simulated end-to-end test**, which replays recorded PubMed and ClinicalTrials.gov responses through the full pipeline and checks the verification rules:

```bash
npm install
npx playwright install chromium
npm test
```

The test confirms that:
- Invented researchers, contacts, profile links and treatments are rejected.
- A busy web search retries.
- Researchers without contact details or treatments are hidden from the grid but kept in the database.
- The 10-per-continent limit holds.

## Data, privacy and limitations

- **Data:** only public sources are used (PubMed, ClinicalTrials.gov and public web pages). No patient data, no confidential information, and no credentials are in this repository or the app.
- **No user data is collected, archived, or shared by Fanale.** The researcher database lives only in the open page and is discarded when it closes. The diagnosis a user types is sent to PubMed, ClinicalTrials.gov, Parallel Search and Claude to run the search.
- **Not medical advice.** Treatments shown are those named in the research, not recommendations.
- **Limitations:**
  - Researchers' personal phone numbers are rarely published, so most contacts come from the researcher's organization.
  - The Clinical Trials connector lists trial contacts by name only.
  - Profile links come from web search and should be confirmed as the same person.
  - The page cannot display photos hosted on other sites, so it links to the profile page instead.
  - Parallel Search's free tier is rate-limited; the page offers a "Retry web lookup" button.
  - Results reflect the newest 40 PubMed articles and active trials, not every expert in the field.

## Built with

- Claude artifact runtime: connectors (`mcp`) and Claude (`sample`)
- PubMed, Clinical Trials (ClinicalTrials.gov API v2) and Parallel Search connectors
- Vanilla HTML, CSS and JavaScript; no build step
- Typefaces: TeX Gyre Pagella (GUST Font License, embedded), Public Sans and IBM Plex Mono (Google Fonts, SIL Open Font License)

## Credit

Created by **Struvante**, Puerto Rico.

## License

MIT License. Copyright (c) 2026 Struvante. See [LICENSE](LICENSE).

The embedded TeX Gyre Pagella typeface is distributed under the GUST Font License; Public Sans and IBM Plex Mono are loaded from Google Fonts under the SIL Open Font License. Those fonts keep their own licenses.
