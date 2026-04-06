// OEP visual brand constants.
// Import these in chart components instead of hardcoding values.
// Covers chart infrastructure — typography, gridlines, annotation lines.
// Data series colors are post-specific and stay in each chart.

export const FONT = "Overpass, sans-serif";

// Spread into Plot.plot({ style: ... }) for consistent chart typography
export const CHART_STYLE = {
  fontFamily: FONT,
  fontSize: "14px",
};

// Gridlines — light, subordinate to data
export const GRID_COLOR = "#ddd";
export const GRID_STROKE_WIDTH = 1;

// Reference lines and annotations (pre-pandemic averages, state averages, etc.)
export const ANNOTATION_COLOR = "#B84A00";
