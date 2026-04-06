import { html } from "npm:htl";
import { FONT } from "./theme.js";

// Strips common "School District" suffix variants (e.g. "School Dist.", "Sch. Dist.")
// Names come from the GeoJSON NAME field which already has correct capitalization.
export function formatName(str) {
  return str.replace(/\s+Sch(ool)?\.*\s+Dist(rict)?\.?\s*$/i, "").replace(/\s+Schools\s*$/i, "");
}

/**
 * Renders a horizontal legend row beneath a chart.
 *
 * @param {Array}  items            - [{ label, color }] in display order
 * @param {Object} opts
 *   @param {string}   [opts.type="swatch"] - "swatch" (14×14px square) or "line" (24×3px segment)
 *   @param {Function} [opts.onHover]       - Called with (label) on hover, (null) on leave.
 *                                            Enables coordinated chart highlighting.
 */
export function makeLegend(items, { type = "swatch", onHover = null } = {}) {
  return html`<div style="
    padding: 8px 0 4px;
    font-family: ${FONT};
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 8px 20px;
    user-select: none;
  ">${items.map(({ label, color }) => html`<div
    data-category="${label}"
    style="display: flex; align-items: center; gap: ${type === "line" ? "8px" : "7px"}; cursor: default;"
    onmouseover=${() => onHover?.(label)}
    onmouseout=${() => onHover?.(null)}
  >${type === "line"
    ? html`<div style="width: 24px; height: 3px; background: ${color}; border-radius: 2px; flex-shrink: 0;"></div>`
    : html`<div style="width: 14px; height: 14px; background: ${color}; border-radius: 2px; flex-shrink: 0;"></div>`
  }<span style="font-size: 13px; color: #222;">${label}</span></div>`)}</div>`;
}
