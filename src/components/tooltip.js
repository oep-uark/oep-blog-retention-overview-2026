import { html } from "npm:htl";

/**
 * Attaches a custom HTML tooltip to an Observable Plot chart.
 *
 * @param {SVGElement} chart  - The Plot SVG element
 * @param {Array}      points - The data array used to build the chart
 * @param {Object}     opts
 *   @param {string}   opts.x      - Field name for the x channel (used to find nearest point)
 *   @param {string}   [opts.y]    - Field name for the y channel (tooltip follows point vertically if provided)
 *   @param {Function} opts.format - (datum) => HTML string for tooltip content
 *
 * @returns {HTMLElement} A container wrapping the chart and tooltip, ready to display()
 *
 * Usage:
 *   return attachTooltip(chart, points, {
 *     x: "schoolyear",
 *     format: (d) => `<strong>${d.schoolyear}</strong><br>Retention Rate: ${d.pct.toFixed(1)}%`,
 *   });
 */
export function attachTooltip(chart, points, { x, y = null, format }) {
  const xScale = chart.scale("x");
  const yScale = y ? chart.scale("y") : null;

  // Pre-compute pixel positions for each data point
  const positioned = points.map((d) => ({
    datum: d,
    px: xScale.apply(d[x]),
    py: yScale ? yScale.apply(d[y]) : null,
  }));

  function findNearest(mouseX) {
    return positioned.reduce((prev, curr) =>
      Math.abs(curr.px - mouseX) < Math.abs(prev.px - mouseX) ? curr : prev
    );
  }

  const tip = html`<div style="
    position: absolute;
    background: white;
    border: 1px solid #ddd;
    border-radius: 4px;
    padding: 8px 12px;
    font-family: 'Roboto', sans-serif;
    font-size: 13px;
    line-height: 1.6;
    white-space: nowrap;
    pointer-events: none;
    box-shadow: 0 2px 8px rgba(0,0,0,0.12);
    display: none;
  "></div>`;

  // Container gives the tooltip its absolute-positioning context
  const container = html`<div style="position: relative; display: inline-block;">
    ${chart}${tip}
  </div>`;

  chart.addEventListener("pointermove", (event) => {
    // clientX → chart-relative X avoids issues with child element offsets
    const mouseX = event.clientX - chart.getBoundingClientRect().left;
    const { datum, px, py } = findNearest(mouseX);

    tip.innerHTML = format(datum);
    tip.style.display = "block";

    // Horizontal: default right of cursor, flip left if near right edge
    const chartWidth = chart.offsetWidth;
    const tipWidth = tip.offsetWidth;
    let left = px + 14;
    if (left + tipWidth > chartWidth - 12) left = px - tipWidth - 14;
    tip.style.left = `${left}px`;

    // Vertical: above data point if y provided, else fixed near top of chart
    if (py !== null) {
      let top = py - tip.offsetHeight - 10;
      if (top < 8) top = py + 10; // flip below if it would clip the top edge
      tip.style.top = `${top}px`;
    } else {
      tip.style.top = "28px";
    }
  });

  chart.addEventListener("pointerleave", () => {
    tip.style.display = "none";
  });

  return container;
}
