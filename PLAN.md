# Post 1: Retention Overview — Build Plan

## What's done

### Infrastructure
- Observable Framework initialized with `theme: "air"`, Roboto font via Google Fonts
- R data loader pattern working: `src/data/labor-market-outcomes.csv.R` reads real Arkansas
  teacher workforce transitions data from Box, computes retention percentages, outputs CSV
- Dev server running; GitHub Pages deploy not yet configured
- Component pattern established: JS modules in `src/components/`, imported into markdown pages.
  `FileAttachment` stays in the markdown; chart logic lives in components.

### Prose
- Full blog narrative written for all sections: retention rate overview, exits vs. retirements,
  stayers/movers, district-level patterns, conclusion.

### Chart 1: Stacked bar — retention categories over time
- `src/components/retention-bar-chart.js`
- 100% stacked bar chart, 2014-15 through 2025-26, six categories
- Custom color scale matching Josh's published report
- Right-side vertical legend (custom HTML — Plot.legend() can't do vertical layout natively)
- Hover-to-highlight interaction: hovering a bar segment or legend item fades all other
  categories. Uses Plot's `title` channel for element indexing + a dynamic CSS `<style>` block.

### Chart 2: Retention rate line chart
- `src/components/retention-rate-chart.js`
- Computed from the same data loader as Chart 1 (no separate loader needed)
- Two-era split (pre/post pandemic) using `z: "era"` to create a gap in the line
- Dashed reference line at pre-pandemic average with annotation
- Subtle era labels pinned to a fixed y position, manually placed over each segment
- Custom HTML tooltip via shared helper (see below)

### Reusable tooltip helper
- `src/components/tooltip.js` — `attachTooltip(chart, points, opts)`
- Three modes:
  - **1D** (`x` only): snaps to nearest point along x axis — good for line charts
  - **2D** (`x` + `y`): Euclidean distance with `maxDist` cutoff — good for scatter plots
  - **targetMap** (`targetMap: Map<SVGElement, datum>`): exact hit-test via `event.target` —
    good for choropleth maps; tooltip follows cursor, always shows correct district
- `hideOnBackground: true` suppresses tooltip when hovering SVG margin/whitespace
- Fixed `width: 200px` with text wrapping (not `white-space: nowrap`)
- Used by all charts

### Charts 3 & 4: Change-from-baseline line charts
- `src/components/change-from-baseline-chart.js` — single reusable component used for both charts
- Renders a multi-line chart of pp change from a pre-computed baseline
- **Deliberately decoupled from baseline logic**: the component is a pure renderer; callers
  pass in already-transformed `{ x, category, change }` data. The baseline computation
  (which years are "pre-pandemic", how to collapse them) lives in the page, not the component.
- `categories` arg (`[{ label, color }]`) drives color scale, line order, and direct end-of-line labels
- Tooltip snaps to x positions and shows all categories for that year in a single multi-row tooltip,
  sorted by each category's final-year value (top-to-bottom visual order)
- `options` arg supports `yDomain`, `yLabel`, `width` overrides
- Page-level transformation helper `computeBaselineDeltas()` defined once in `index.md`,
  called twice with different category lists for each chart

### Chart 5: District retention scatter plot
- `src/components/district-scatter-chart.js`
- X axis: avg. retention in trough years (2021-22, 2022-23); Y axis: avg. retention in
  recovery years (2023-24 to 2025-26)
- Dashed diagonal parity line — districts above improved, below declined
- Dashed horizontal state average line with annotation
- Geographic Shortage Area districts highlighted in red; others in gray
- Hover highlight (gold stroke, larger dot) via `Plot.pointer`; tooltip via `attachTooltip`
  showing district name, both period rates, and signed pp change
- Separate data loader: `src/data/district-retention.csv.R`
- Intercepts `pointerdown` in capture phase to suppress Plot's click-to-stick behavior

### Chart 6: District interactive explorer (map + card)
- `src/components/district-map.js` + `src/components/district-card.js`
- Choropleth map: 7-color discrete threshold scale, two-pass `Plot.geo()` rendering
  (fill pass + stroke pass) to prevent neighbor fills from clipping hover/selection borders
- Click a district → card updates with name, teacher counts, dot grid, and narrative breakdown
- Dot grid: ≤100 teachers shows exact count; >100 scales to 100 with largest-remainder rounding.
  Always 20 dots per row. Built with `d3.create("svg")` (htl blocks innerHTML SVG injection).
- Tooltip uses `targetMap` mode — exact hit-test via `event.target`, cursor-aligned positioning.
  `hideOnBackground: true` suppresses tooltip over map margins.
- District names come from GeoJSON `NAME` field (correctly cased). `formatName()` in
  `src/components/utils.js` strips suffix variants ("School District", "School Dist.", "Schools").
- Data loader: `src/data/district-retention-2026.json.R`
- GeoJSON simplified via `tigris::school_districts(state = "AR", cb = TRUE)` — cartographic
  boundary file (~500 KB vs 11 MB TIGER/Line); regenerate by running the tigris script once.

---

## What's still needed

### Infrastructure remaining

### Infrastructure remaining
- GitHub Pages deploy not yet configured or tested
- WordPress iframe embed pattern not yet validated end-to-end

### Content remaining
- Remove the placeholder draft SVG image (`![test](images/draft_plots/...)`) from index.md
  once the scatter chart is confirmed working in production

---

## What we've learned about Observable Framework

### What it's genuinely good at
- **Data loader pattern** is excellent. R scripts output JSON/CSV to stdout at build time;
  the browser never sees raw data or R code. This is the main reason to choose it over Svelte.
- **Reactive runtime** makes click/hover interactions that update displays clean to wire up,
  as long as you're working within Plot's built-in interaction model.
- **Plot** gets you 80% of the way to a publication-quality chart quickly. Good for exploration
  and for charts that don't need pixel-perfect custom layout.
- **Component modules** (`src/components/*.js`) keep markdown pages clean and make chart
  logic reusable across pages.

### Geo / choropleth maps
- **Two-pass `Plot.geo()` rendering** is required to prevent neighbor district fills from
  clipping hover/selection borders. First mark: fills only (`stroke: "none"`). Second mark:
  strokes only (`fill: "transparent"`, `pointer-events: all`). Stroke paths are at indices
  `n..2n-1` in `querySelectorAll("path")` results (after filtering out `<defs>`).
- **Tooltip on geo charts**: `chart.scale("x")` doesn't exist on choropleth maps. Do NOT
  use the centroid-proximity approach — it picks the wrong district near borders. Use the
  `targetMap` mode in `attachTooltip` instead: build a `Map<SVGElement, datum>` from stroke
  paths and pass it as `targetMap`. Perfectly accurate, cursor-aligned.
- **GeoJSON file size matters**: Census TIGER/Line files (~11 MB) cause 3-4 second load times.
  Use `tigris::school_districts(state = "AR", cb = TRUE)` for the pre-simplified cartographic
  boundary file (~500 KB). Regenerate by running the script once; commit the result as a
  static file (no build-time data loader needed).
- **htl blocks SVG string injection**: `${{ innerHTML: svgString }}` is sanitized for XSS.
  Build SVG DOM elements with `d3.create("svg")` and embed the node directly in htl templates.
- **District names**: use the GeoJSON `NAME` field, not the CCD crosswalk (`lea_name`).
  The crosswalk stores names in ALL CAPS; the GeoJSON has correct mixed-case (preserving
  proper nouns like "McGehee", "DeWitt"). Join on `GEOID`/`geoid`.

### Where it fights you
- **Plot.tip doesn't support rich text.** SVG can't bold text inline; `Plot.tip`'s `title`
  channel is plain text only. Solution: `src/components/tooltip.js` — custom HTML div,
  positioned via `chart.scale("x")`. Written once, reused everywhere.
- **Axis label font size** cannot be set via Plot options. The rotated y-axis label renders
  smaller than tick labels regardless of the chart's `fontSize`. Workaround: remove the label
  and rely on prose, or manually place a `Plot.text` mark.
- **Grid line opacity** can be silently reduced by the air theme. Fix: always set
  `strokeOpacity: 1` explicitly on `Plot.gridY`.
- **Ordinal x scales** should have `type: "point"` set explicitly to suppress a noisy
  console warning about date-like strings.
- **Plot's legend** has no vertical layout option. We had to build a custom HTML legend.
  This is a real gap and means the legend is outside Plot's rendering, requiring manual
  coordination for interactions.
- **Custom hover interactions on Plot charts** require stepping outside Plot entirely.
  Plot 0.6 does not use D3's traditional `__data__` binding, so you cannot read datum
  from DOM elements in event handlers. Our working solution uses Plot's `title` channel
  to index elements, then a dynamic CSS `<style>` block to drive visual state.
- **Plot vs. raw D3**: for charts requiring very precise layout control, dropping down to
  raw D3 may be less painful than fighting Plot's constraints.
- **Margin sizing for rotated tick labels** requires trial and error. `marginBottom` needs
  to be large enough to accommodate the downward extent of long rotated labels (e.g.,
  "Pre-pandemic avg." at -35° needs ~100px). `marginLeft` needs room for both tick labels
  and the rotated y-axis label — 75px works; 100px is too wide.
- **Component/page responsibility split**: for reusable chart components, keep data
  transformations in the page (visible, inspectable, easy to adapt) and keep components
  as pure renderers. The change-from-baseline chart is the clearest example of this pattern.

### The honest trade-off vs. Svelte
Svelte/LayerCake gives more layout control but requires building axis components from scratch.
Observable gives faster chart authoring and the data loader pattern, but custom interactions
require non-idiomatic workarounds. For OEP's use case (R analysts publishing interactive
work), Observable's data loader convenience likely wins — but expect to write some custom
JavaScript for anything beyond Plot's built-in interactions. The tooltip helper is the main
example: hard to build once, trivial to reuse.

---

## Open questions

- **OEP brand colors**: not yet defined for the web. Currently using Josh's ColorBrewer
  palette from the print report. Needs a decision before anything ships.

- **Accessibility**: SVG charts have no screen-reader support. Known gap, worth addressing
  before public launch but not blocking development.

- **Responsiveness**: charts currently have fixed widths. Observable's built-in `width`
  reactive variable can make them responsive, but the custom legend layout complicates this.
  Needs a solution before WordPress embed is finalized.
