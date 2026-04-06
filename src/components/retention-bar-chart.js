import * as Plot from "npm:@observablehq/plot";
import { html } from "npm:htl";
import { CHART_STYLE } from "./theme.js";
import { makeLegend } from "./utils.js";

const categories = [
  { key: "stayer", label: "Stayer" },
  { key: "mover_same", label: "Mover - Same District" },
  { key: "mover_new", label: "Mover - New District" },
  { key: "switcher", label: "Switcher" },
  { key: "exiter", label: "Exiter" },
  { key: "retired", label: "Retired" },
];

const colorScale = {
  domain: categories.map((c) => c.label),
  range: ["#053061", "#2166AC", "#92C5DE", "#F4A582", "#B2182B", "#67001F"],
};

export function retentionBarChart(data, { width = 640 } = {}) {
  const chart = Plot.plot({
    width,
    height: Math.round(width * 0.55),
    marginLeft: 60,
    marginBottom: width < 600 ? 60 : 40,
    style: CHART_STYLE,
    x: { label: null, type: "band", tickSize: 0, tickRotate: width < 600 ? -30 : 0 },
    y: {
      label: "% of Prior-Year Teachers",
      labelAnchor: "center",
      anchor: "left",
      labelArrow: "none",
      domain: [0, 100],
      ticks: [0, 25, 50, 75, 100],
      tickFormat: (d) => d + "%",
    },
    color: colorScale,
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
          fill: (d) =>
            d.category === "Switcher" || d.category === "Mover - New District"
              ? "black"
              : "white",
          title: (d) => d.category,
        }),
      ),
    ],
  });

  for (const el of chart.querySelectorAll("rect, text")) {
    const titleEl = el.querySelector("title");
    if (titleEl) {
      el.dataset.category = titleEl.textContent;
      titleEl.remove();
    }
  }

  const fadeStyle = html`<style></style>`;

  function highlight(category) {
    fadeStyle.textContent = category
      ? `
      svg rect[data-category]:not([data-category="${category}"]) { opacity: 0.15; transition: opacity 0.2s; }
      svg text[data-category]:not([data-category="${category}"]) { opacity: 0.15; transition: opacity 0.2s; }
      div[data-category]:not([data-category="${category}"]) { opacity: 0.4; transition: opacity 0.2s; }
      div[data-category="${category}"] span { font-weight: 700; }
    `
      : "";
  }

  chart.addEventListener("mouseover", (e) => {
    highlight(e.target.closest("[data-category]")?.dataset.category ?? null);
  });
  chart.addEventListener("mouseleave", () => highlight(null));

  const legendEl = makeLegend(
    colorScale.domain.map((label, i) => ({ label, color: colorScale.range[i] })),
    { onHover: highlight },
  );

  return html`<div style="display:flex; flex-direction:column;">
    ${fadeStyle} ${chart} ${legendEl}
  </div>`;
}
