export const TERMINAL_VALUE_METHODS = {
  PERPETUITY_GROWTH: 'PGM',
  EXIT_MULTIPLE: 'EMM',
} as const

export const EXIT_MULTIPLE_METRICS = [
  { value: 'EBITDA', label: 'LTM EBITDA' },
  { value: 'EBIT', label: 'LTM EBIT' },
  { value: 'Revenue', label: 'LTM Revenue' },
] as const

export const UnitOption = [
  { value: 1, label: 'Dollars' },
  { value: 1000, label: 'Thousands' },
  { value: 1000000, label: 'Millions' },
  { value: 1000000000, label: 'Billions' },
] as const
