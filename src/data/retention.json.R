library(jsonlite)

# Dummy retention data — replace with real data loader later
# Each row is one school year. Values are percentages (sum to 100).

retention <- data.frame(
  year = c("2014-15", "2015-16", "2016-17", "2017-18", "2018-19",
           "2019-20", "2020-21", "2021-22", "2022-23", "2023-24",
           "2024-25", "2025-26"),
  stayer      = c(79.0, 79.2, 79.1, 79.3, 79.5, 79.6, 78.0, 76.4, 74.2, 75.8, 76.5, 77.1),
  mover_same  = c( 5.7,  5.6,  5.5,  5.4,  5.4,  5.3,  5.8,  6.9,  5.7,  5.5,  5.4,  5.3),
  mover_new   = c( 4.2,  4.3,  4.4,  4.3,  4.4,  4.5,  4.8,  5.3,  6.7,  5.2,  5.0,  4.9),
  switcher    = c( 3.0,  3.1,  3.0,  3.0,  3.0,  3.0,  3.5,  4.2,  4.3,  3.8,  3.6,  3.5),
  exiter      = c( 4.6,  4.5,  4.5,  4.6,  4.5,  5.0,  5.4,  4.6,  6.4,  6.9,  6.7,  6.4),
  retired     = c( 3.5,  3.3,  3.5,  3.4,  3.2,  2.5,  2.5,  2.5,  2.7,  2.8,  2.8,  2.7)
)

cat(toJSON(retention, dataframe = "rows", pretty = FALSE))
