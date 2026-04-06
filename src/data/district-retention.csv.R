# district-retention.csv.R
# Observable Framework data loader
#
# Computes district-level teacher retention rates. One row per district with
# trough-period (2022-23) vs. recent-period (2024-26) averages. Includes GEOID
# and district attributes so the output serves both the scatter plot and the
# eventual map tool (join on geoid to Census geometry in the browser).
#
# Output columns:
#   districtlea            - ADE LEA code (string, e.g. "0101000")
#   geoid                  - NCES GEOID for joining with Census geometry
#   district_name          - District name (from CCD crosswalk)
#   county_name            - County name
#   urban_centric_locale   - NCES locale code
#   avg_retention_trough   - Mean retention rate 2022-23 (proportion 0-1)
#   avg_retention_recent   - Mean retention rate 2024-26 (proportion 0-1)
#   n_teachers_trough      - Mean teacher headcount 2022-23
#   n_teachers_recent      - Mean teacher headcount 2024-26
#   shortage_status        - "Shortage" or "Not Shortage"

library(data.table)
library(dplyr)
library(tidyr)
library(purrr)
library(janitor)
library(readr)
library(sf)

# --- Configuration ---
data_path <- Sys.getenv(
  "TEACHER_LM_DATA",
  unset = "/Users/roymckenzie/Library/CloudStorage/Box-Box/0 - Arkansas Projects/Projects/Teacher Pipeline/Teacher Retention/0_data/Classroom and Inclusion SPED Teachers/teacher_workforce_transitions_classroom and inclusion SPED_12-18-25.csv" # nolint
)


# --- Load and prep data ---
teacher_lm <- fread(
  data_path,
  colClasses = "character",
  na.strings = c("", "NA")
) |>
  janitor::clean_names() |>
  mutate(fiscal_year = as.integer(fiscal_year))

# --- Compute district-level retention rates by year ---
calculate_retention_rates <- function(year, teacher_lm) {
  teachers_year_before <- teacher_lm |>
    filter(teacher == TRUE, fiscal_year == year - 1) |>
    select(research_id, districtlea_before = districtlea)

  teachers_year <- teacher_lm |>
    filter(fiscal_year == year) |>
    left_join(teachers_year_before, by = "research_id")

  teachers_year |>
    filter(lf_outcome != "New") |>
    group_by(districtlea_before) |>
    summarise(
      teachers_before = n(),
      stayers = sum(
        lf_outcome == "Stayer" |
          (lf_outcome == "Mover" & lf_mover_same_district == 1),
        na.rm = TRUE
      ),
      movers_out = sum(
        lf_outcome == "Mover" & lf_mover_new_district == 1,
        na.rm = TRUE
      ),
      switchers = sum(lf_outcome == "Switcher", na.rm = TRUE),
      exiters = sum(
        lf_outcome == "Exiter" & lf_exiter_not_retired == 1,
        na.rm = TRUE
      ),
      retirements = sum(
        lf_outcome == "Exiter" & lf_exiter_retired == 1,
        na.rm = TRUE
      ),
      .groups = "drop"
    ) |>
    mutate(
      fiscal_year = year,
      n_retained = teachers_before - exiters - retirements - movers_out - switchers, # nolint: line_length_linter.
      retention_rate = n_retained / teachers_before
    ) |>
    rename(districtlea = districtlea_before)
}

years <- c(2022, 2023, 2024, 2025, 2026)

district_retention_all <- map(years, ~ calculate_retention_rates(.x, teacher_lm)) |>
  list_rbind()

# --- Aggregate into trough (2022-23) vs. recent (2024-26) periods ---
# Drop districts missing data in any of the five years
district_scatter <- district_retention_all |>
  group_by(districtlea) |>
  filter(n() == 5) |>
  ungroup() |>
  mutate(
    period = if_else(fiscal_year %in% c(2022, 2023), "trough", "recent")
  ) |>
  group_by(districtlea, period) |>
  summarise(
    avg_retention = mean(retention_rate),
    n_teachers_avg = mean(teachers_before),
    .groups = "drop"
  ) |>
  pivot_wider(
    names_from  = period,
    values_from = c(avg_retention, n_teachers_avg)
  ) |>
  mutate(districtlea_num = as.numeric(districtlea))

# --- Tag shortage districts ---
# Districts identified as Tier I Geographic Shortage Areas in 2021-22 or 2022-23
shortage_districts <- c(
  5201000, 4702000, 4801000, 5204000, 4802000, 1305000,
  201000, 5106000, 901000, 101000, 2104000, 1802000,
  7001000, 2002000, 6201000, 203000, 5403000, 601000,
  2903000, 7003000, 5440700, 3704000, 3904000, 1804000,
  5604000, 5404000, 2105000, 2203000, 6002000, 4713000,
  407000, 3505000, 4003000, 104000, 4605000, 5605000,
  602000, 3509000, 4701000, 3201000, 3212000, 3502000,
  3306000, 6004000, 506000
)

district_scatter <- district_scatter |>
  mutate(
    shortage_status = if_else(
      districtlea_num %in% shortage_districts,
      "Shortage",
      "Not Shortage"
    )
  )

# --- Load CCD crosswalk for county/locale metadata only ---
# educationdata_arkansas_2023.csv is a static file in src/data/,
# copied from drafts/raw_data/. leaid read as character to preserve leading zeros.
cxwalk <- read_csv(
  "src/data/educationdata_arkansas_2023.csv",
  col_types = cols(leaid = col_character()),
  show_col_types = FALSE
) |>
  select(
    geoid             = leaid,
    district_lea      = state_leaid,
    urban_centric_locale,
    county_name
  ) |>
  mutate(
    district_lea = as.numeric(gsub("AR-", "", district_lea))
  )

# --- Load GeoJSON for correctly-cased district names and GEOID filter ---
# Excludes charters, coops, and career centers that appear in the retention data
# but don't have geographic boundaries in the Census shapefile.
geojson_names <- sf::read_sf("src/data/ar-school-districts.geojson") |>
  sf::st_drop_geometry() |>
  select(geoid = GEOID, district_name = NAME)

# --- Join crosswalk and write output ---
output <- district_scatter |>
  left_join(cxwalk, by = c("districtlea_num" = "district_lea")) |>
  inner_join(geojson_names, by = "geoid") |>
  select(
    districtlea,
    geoid,
    district_name,
    county_name,
    urban_centric_locale,
    avg_retention_trough,
    avg_retention_recent,
    n_teachers_trough = n_teachers_avg_trough,
    n_teachers_recent = n_teachers_avg_recent,
    shortage_status
  )

write.csv(output, stdout(), row.names = FALSE)
