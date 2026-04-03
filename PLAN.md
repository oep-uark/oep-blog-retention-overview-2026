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
- `src/components/tooltip.js` — `attachTooltip(chart, points, { x, y, format })`
- Wraps any Plot chart with a custom HTML tooltip: full formatting control including bold text
- Positions tooltip left/right of cursor depending on available space; flips above/below if
  `y` channel provided (useful for scatter plots)
- Works on mobile via pointer events
- Used by Chart 2; designed to be reused by the district explorer

---

## What's still needed

### Charts remaining (all have draft SVGs in `drafts/draft_plots/`)
- **Switcher/Exiter/Retired change from baseline** — line chart, `switcher_exiter_retired_change_from_base_plot_draft.svg`
- **Stayers/Movers change from baseline** — line chart, `stayers_movers_change_from_base_plot_draft.svg`
- **District scatter plot** — change in retention vs. level, with shortage area highlighting, `change_in_retention_plot_draft.svg`
- **District interactive explorer** — the centerpiece tool; needs its own data loader

### Infrastructure remaining
- GitHub Pages deploy not yet configured or tested
- WordPress iframe embed pattern not yet validated end-to-end

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
