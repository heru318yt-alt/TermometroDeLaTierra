import rawData from '../../data/gistemp.json'
import type { ClimateDataset } from './types'
import { getAnnualAnomaly, getFirstRecord, getLastRecord, getParisThresholds } from './math'

// Small local asset bundled by Vite. No requests to NASA from the browser.
const dataset = rawData as ClimateDataset

export function getClimateData(): ClimateDataset { return dataset }

export function getClimateSummary(data: ClimateDataset = dataset) {
  const latestComplete = [...data.years].reverse().find(row => getAnnualAnomaly(data.years, row.year) !== null)
  return {
    first: getFirstRecord(data.years),
    latest: getLastRecord(data.years),
    latestAnnual: latestComplete ? { year: latestComplete.year, anomaly: latestComplete.annual! } : null,
    thresholds: getParisThresholds(data.years),
    source: data.source,
    downloadedAt: data.downloadedAt,
  }
}
