# OEP Teacher Retention Overview 2025–26

**Live site**: https://roymckenzie4.github.io/oep-blog-retention-overview-2026/

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

Deployment is fully automated. Push to `main` and GitHub Actions builds and deploys to GitHub Pages. No manual build step needed.

To trigger a deploy manually: GitHub → Actions → Deploy → Run workflow.

## Project structure

```
src/
  components/
    tooltip.js              # shared tooltip helper (1D, 2D, targetMap modes)
    utils.js                # formatName() and other shared helpers
    retention-rate-chart.js
    retention-bar-chart.js
    change-from-baseline-chart.js
    district-scatter-chart.js
    district-map.js
    district-card.js
  data/
    labor-market-outcomes.csv.R     # statewide retention by category, all years
    district-retention.csv.R        # district-level retention, trough vs. recovery
    district-retention-2026.json.R  # district-level detail for 2025-26
    ar-school-districts.geojson     # static — cartographic boundary file from tigris
  index.md                          # the blog post page
.github/workflows/deploy.yml        # GitHub Actions deployment
observablehq.config.js
```
