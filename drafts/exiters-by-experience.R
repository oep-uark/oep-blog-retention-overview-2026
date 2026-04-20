library(data.table)
library(dplyr)
library(tidyr)
library(stringr)
library(purrr)
library(ggplot2)

# --- Configuration ---
# When running locally, this should point to Box/OneDrive copy.
# TODO: Update this path to wherever the data lives in your environment.
# OPEN QUESTION: how to set this with environment variable? Or do we need to?
data_path <- Sys.getenv(
  "TEACHER_LM_DATA",
  unset = "/Users/roymckenzie/Library/CloudStorage/Box-Box/0 - Arkansas Projects/Projects/Teacher Pipeline/Teacher Retention/0_data/Classroom and Inclusion SPED Teachers/teacher_workforce_transitions_classroom and inclusion SPED_12-18-25.csv" # nolint
)

# ----- Load and prep data ------
teacher_lm <- fread(
  data_path,
  colClasses = "character",
  na.strings = c("", "NA")
) |>
  janitor::clean_names() |>
  mutate(fiscal_year = as.integer(fiscal_year))

# ----- create exiter subset ------

exiters <- teacher_lm %>%
  filter(lf_exiter_not_retired == 1) %>%
  mutate(
    service_numeric = as.numeric(serviceyears),
    exp_numeric = as.numeric(totalyearsofexperience_corrected)
  )

# ----- calculate experience breakdown -----
exiter_experience_breakdown <- exiters %>%
  mutate(
    exp_category = case_when(
      exp_numeric >= 0 & exp_numeric <= 3 ~ "0-3 years",
      exp_numeric >= 4 & exp_numeric <= 10 ~ "4-10 years",
      exp_numeric >= 11 & exp_numeric <= 20 ~ "11-20 years",
      exp_numeric > 20 ~ "20+ years",
      TRUE ~ NA_character_
    )
  ) %>%
  # Remove missing experience
  filter(!is.na(exp_category)) %>%
  # Count exit/switch observations by year and experience
  group_by(fiscal_year, lf_outcome, exp_category) %>%
  summarise(count = n(), .groups = "drop") %>%
  # Convert to percentages within year × outcome
  group_by(fiscal_year, lf_outcome) %>%
  mutate(
    total = sum(count),
    percentage = count / total,
    schoolyear = paste0(fiscal_year - 1, "-", fiscal_year)
  ) %>%
  ungroup() %>%
  # Factor ordering and labels
  mutate(
    exp_category = factor(
      exp_category,
      levels = c("0-3 years", "4-10 years", "11-20 years", "20+ years")
    ),
    label = paste0(sprintf("%.1f", percentage * 100)),
    schoolyear = factor(schoolyear)
  )

ggplot(
  exiter_experience_breakdown,
  aes(x = schoolyear, y = percentage, fill = exp_category)
) +
  geom_col() +
  geom_text(
    aes(label = ifelse(percentage > 0.02, label, "")),
    position = position_stack(vjust = 0.5),
    size = 4.5,
    color = "black"
  ) +
  scale_y_continuous(labels = scales::percent) +
  scale_fill_brewer(palette = "Blues") +
  labs(
    x = NULL,
    y = NULL,
    fill = "Years of Experience",
    title = NULL
  ) +
  theme_minimal(base_size = 16) +
  theme(
    panel.grid.minor = element_blank(),
    legend.position = "right",
    legend.key = element_blank(),
    axis.text = element_text(color = "grey40"),
    axis.text.x = element_text(angle = 45, hjust = 1)
  )

ggplot(
  exiter_experience_breakdown,
  aes(x = schoolyear, y = count, fill = exp_category)
) +
  geom_col() +
  geom_text(
    aes(label = ifelse(percentage > 0.02, count, "")),
    position = position_stack(vjust = 0.5),
    size = 4.5,
    color = "black"
  ) +
  scale_y_continuous(labels = scales::percent) +
  scale_fill_brewer(palette = "Blues") +
  labs(
    x = NULL,
    y = NULL,
    fill = "Years of Experience",
    title = NULL
  ) +
  theme_minimal(base_size = 16) +
  theme(
    panel.grid.minor = element_blank(),
    legend.position = "right",
    legend.key = element_blank(),
    axis.text = element_text(color = "grey40"),
    axis.text.x = element_text(angle = 45, hjust = 1)
  )
