# Teacher Retention in Arkansas

```js
const retention = FileAttachment("data/retention.json").json();
```

```js
const categories = [
  { key: "stayer",     label: "Stayer" },
  { key: "mover_same", label: "Mover – Same District" },
  { key: "mover_new",  label: "Mover – New District" },
  { key: "switcher",   label: "Switcher" },
  { key: "exiter",     label: "Exiter" },
  { key: "retired",    label: "Retired" },
];

// Reshape wide → long: one row per (year, category)
const long = retention.flatMap(d =>
  categories.map(cat => ({
    year:     d.year,
    category: cat.label,
    value:    d[cat.key],
  }))
);

display(Plot.plot({
  width: 700,
  height: 400,
  marginLeft: 60,
  marginBottom: 50,
  x: { label: null, tickRotate: -35, type: "band" },
  y: { label: "Share of Teachers (%)", domain: [0, 100] },
  color: {
    domain: categories.map(c => c.label),
    scheme: "tableau10",
    legend: true,
  },
  marks: [
    Plot.barY(long, {
      x: "year",
      y: "value",
      fill: "category",
      order: categories.map(c => c.label),
      tip: true,
    }),
  ],
}));
```
