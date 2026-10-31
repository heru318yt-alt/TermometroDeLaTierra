/** All anomalies are degrees Celsius relative to 1951–1980. */
export interface ClimateYear {
  year: number
  /** January at index 0; exactly 12 entries, null means unavailable. */
  months: (number | null)[]
  /** Official J-D column; never reconstructed from rounded monthly values. */
  annual: number | null
}

export interface MonthDate { year: number; month: number }
export interface MonthlyRecord extends MonthDate { anomaly: number }
export interface TimeWindow { start: MonthDate; end: MonthDate }
export interface AverageResult {
  mean: number | null
  count: number
  expected: number
  complete: boolean
}

export interface ClimateDataset {
  schemaVersion: 1
  source: { name: string; url: string; referencePeriod: string; unit: string }
  downloadedAt: string
  sha256: string
  firstDate: string
  lastDate: string
  yearCount: number
  monthCount: number
  years: ClimateYear[]
}
