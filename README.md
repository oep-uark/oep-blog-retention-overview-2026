# OEP Teacher Retention Overview 2025–26

**Production (OEP)**: https://oep-uark.github.io/oep-blog-retention-overview-2026/
**Dev (staging)**: https://roymckenzie4.github.io/oep-blog-retention-overview-2026/

An interactive data visualization post from the [Office for Education Policy](https://oep.uark.edu/) at the University of Arkansas. This is Post 1 in a planned series on the Arkansas teacher workforce.

## What this post covers

- Did retention categories change in 2025–26? (Similar to 2024–25; still below pre-pandemic levels)
- What's driving lower retention? (Higher exits among early/mid-career teachers, not retirements)
- How do Stayer and Mover rates compare to pre-pandemic baselines?
- How does retention vary across Arkansas districts? (Interactive map + district explorer)

## Tech stack

- **[Observable Framework](https://observablehq.com/framework/)** — static site generator for data-driven pages
- **R data loaders** — R scripts in `src/data/*.R` read from OneDrive at build time and output JSON/CSV
- **Observable Plot + D3** — charts and map
- **GitHub Pages** — hosting, deployed automatically via GitHub Actions

## Local development

```bash
npm install
npm run dev
```

Then visit http://localhost:3000.

## Data

The underlying data comes from the Arkansas Department of Education via the University's OneDrive. It is **not committed to this repo**. The R data loaders (`src/data/*.R`) read from OneDrive and output the processed CSV/JSON files at build time.

**Important for CI:** GitHub Actions cannot access OneDrive. The build uses Observable Framework's data cache (`src/.observablehq/cache/`) instead of re-running the R loaders. This cache is force-committed to the repo.

When the underlying data is updated, regenerate the cache locally:

```bash
npm run clean       # clears the old cache
npm run build       # re-runs R loaders, populates cache with fresh data
git add -f src/.observablehq/cache/
git commit -m "update data cache"
git push
```

## Deployment

There are two remotes and two GitHub Pages deployments:

| Remote | Repo | URL | Purpose |
|--------|------|-----|---------|
| `origin` | `roymckenzie4/oep-blog-retention-overview-2026` | roymckenzie4.github.io/... | Dev / staging |
| `oep` | `oep-uark/oep-blog-retention-overview-2026` | oep-uark.github.io/... | Production (WordPress iframe) |

Pushing to either remote automatically triggers a GitHub Actions build and deploy. No manual build step needed.

**Day-to-day:** push to `origin` (your personal account) to preview changes.

**Publishing to production:**
```bash
gh auth switch --user oep-uark
git push oep main
gh auth switch --user roymckenzie4
```

To trigger a deploy manually: GitHub → Actions → Deploy → Run workflow.

## Project structure

```
src/
  components/
    theme.js                     # shared color and style constants
    utils.js                     # formatName(), makeLegend(), other shared helpers
    tooltip.js                   # shared tooltip helper (1D, 2D, targetMap modes)
    retention-rate-chart.js      # statewide retention rate line chart
    stacked-bar-chart.js         # reusable stacked bar chart (retention categories + exiter experience)
    change-from-baseline-chart.js  # change-from-baseline line charts (departures + stayers/movers)
    district-scatter-chart.js    # pre-pandemic vs. recent scatter plot, with download link
    district-map.js              # choropleth map for district explorer
    district-card.js             # detail card for district explorer
  data/
    labor-market-outcomes.csv.R      # statewide retention by category, all years
    exiter-experience.csv.R          # non-retiree exiters by years of experience, all years
    district-retention.csv.R         # per-district avg. retention, pre-pandemic vs. recent (outputs % not proportions)
    district-retention-2026.json.R   # per-district 2025-26 retention breakdown for map + card
    ar-school-districts.geojson      # static — cartographic boundary file from tigris
    educationdata_arkansas_2023.csv  # static — CCD crosswalk for county/locale metadata
    shortage-districts-2025-26.csv   # static — state-designated shortage district list
  index.md                           # the blog post page
.github/workflows/deploy.yml         # GitHub Actions deployment
observablehq.config.js
```

## Data downloads

The post includes two public data downloads:

- **District retention trends (scatter chart)**: pre-pandemic vs. recent average retention rate per district, with shortage district flag. Served directly from the `district-retention.csv` data loader output.
- **District retention 2025–26 (interactive tool)**: per-district breakdown of stayers, movers, switchers, exiters, and retirees. Generated client-side from the JSON data loader.
