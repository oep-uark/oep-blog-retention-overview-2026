import * as Plot from "npm:@observablehq/plot";
import { html } from "npm:htl";
import { CHART_STYLE } from "./theme.js";
import { makeLegend } from "./utils.js";

/**
 * Renders an interactive stacked bar chart with hover highlighting.
 *
 * DATA FORMAT
 * -----------
 * Your data must have exactly these three columns:
 *   schoolyear  - the x-axis label, e.g. "2024-25"
 *   category    - the name of each stack segment, must match a label in `categories`
 *   value       - the height of the segment as a percentage (0–100)
 *
 * CATEGORIES
 * ----------
 * An array of objects defining each stack segment, in bottom-to-top order:
 *   [
 *     { label: "Stayer",  color: "#053061", textColor: "white" },
 *     { label: "Exiter",  color: "#B2182B", textColor: "white" },
 *     ...
 *   ]
 *   - label:     must match a value in your data's `category` column
 *   - color:     fill color for the segment
 *   - textColor: color of the percentage label printed inside the bar ("white" or "black")
 *
 * EXAMPLE USAGE
 * -------------
 *   const MY_CATEGORIES = [
 *     { label: "Group A", color: "#2166AC", textColor: "white" },
 *     { label: "Group B", color: "#92C5DE", textColor: "black" },
 *   ];
 *   display(stackedBarChart(myData, MY_CATEGORIES, { width }));
 *
 * @param {Array}  data         - Rows of { schoolyear, category, value }
 * @param {Array}  categories   - [{ label, color, textColor }] in bottom-to-top order
 * @param {Object} options
 *   @param {number} [options.width=640]    - Chart width in px (pass Observable's `width`)
 *   @param {number} [options.height]       - Chart height in px. Defaults to width × 0.55.
 *   @param {string} [options.yLabel="% of Prior-Year Teachers"] - Y-axis label
 *   @param {string} [options.caption]      - Optional note rendered beneath the legend in small gray text.
 */
export function stackedBarChart(data, categories, { width = 640, height, yLabel = "% of Prior-Year Teachers", caption } = {}) {
  const textColorMap = Object.fromEntries(categories.map((c) => [c.label, c.textColor ?? "white"]));

  const chart = Plot.plot({
    width,
    height: height ?? Math.round(width * 0.55),
    marginLeft: 60,
    marginBottom: width < 600 ? 60 : 40,
    style: CHART_STYLE,
    x: { label: null, type: "band", tickSize: 0, tickRotate: width < 600 ? -30 : 0, domain: [...new Set(data.map((d) => d.schoolyear))] },
    y: {
      label: yLabel,
      labelAnchor: "center",
      anchor: "left",
      labelArrow: "none",
      domain: [0, 100],
      ticks: [0, 25, 50, 75, 100],
      tickFormat: (d) => d + "%",
    },
    color: {
      domain: categories.map((c) => c.label),
      range: categories.map((c) => c.color),
    },
    marks: [
      Plot.barY(data, {
        x: "schoolyear",
        y: "value",
        fill: "category",
        order: categories.map((c) => c.label),
        title: (d) => d.category,
      }),
      Plot.text(
        data,
        Plot.stackY({
          x: "schoolyear",
          y: "value",
          z: "category",
          order: categories.map((c) => c.label),
          text: (d) => `${(+d.value).toFixed(1)}`,
          fontSize: 12,
          fill: (d) => textColorMap[d.category] ?? "white",
          title: (d) => d.category,
        }),
      ),
    ],
  });

  // Extract Plot's internal <title> elements and convert to data-category attributes.
  // This lets the CSS hover effect below target specific segments by category name.
  for (const el of chart.querySelectorAll("rect, text")) {
    const titleEl = el.querySelector("title");
    if (titleEl) {
      el.dataset.category = titleEl.textContent;
      titleEl.remove();
    }
  }

  // A <style> element whose content is swapped on hover to fade non-hovered segments.
  // Scoped to this chart's container via a unique ID so other charts' legends are unaffected.
  const uid = `sbc-${Math.random().toString(36).slice(2, 8)}`;
  const fadeStyle = html`<style></style>`;

  function highlight(category) {
    fadeStyle.textContent = category
      ? `
        #${uid} svg rect[data-category]:not([data-category="${category}"]) { opacity: 0.15; transition: opacity 0.2s; }
        #${uid} svg text[data-category]:not([data-category="${category}"]) { opacity: 0.15; transition: opacity 0.2s; }
        #${uid} div[data-category]:not([data-category="${category}"]) { opacity: 0.4; transition: opacity 0.2s; }
        #${uid} div[data-category="${category}"] span { font-weight: 700; }
      `
      : "";
  }

  chart.addEventListener("mouseover", (e) => {
    highlight(e.target.closest("[data-category]")?.dataset.category ?? null);
  });
  chart.addEventListener("mouseleave", () => highlight(null));

  const legendEl = makeLegend(
    categories.map(({ label, color }) => ({ label, color })),
    { onHover: highlight },
  );

  const captionEl = caption
    ? html`<p style="margin: 6px 0 0; font-size: 12px; color: #888; font-style: italic;">${caption}</p>`
    : null;

  return html`<div id="${uid}" style="display: flex; flex-direction: column;">
    ${fadeStyle}${chart}${legendEl}${captionEl}
  </div>`;
}
