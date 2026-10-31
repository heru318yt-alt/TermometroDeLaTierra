import type { ClimateDataset, ClimateYear } from './types.ts'
import { getAvailableRecords, getParisThresholds } from './math.ts'

export const NASA_CSV_URL = 'https://data.giss.nasa.gov/gistemp/tabledata_v4/GLB.Ts+dSST.csv'
const columns = 'Year,Jan,Feb,Mar,Apr,May,Jun,Jul,Aug,Sep,Oct,Nov,Dec,J-D,D-N,DJF,MAM,JJA,SON'

/** Deliberately strict parser for NASA's unquoted, numeric global CSV format. */
export function parseGistempCsv(csv: string): ClimateYear[] {
  const lines = csv.replace(/^\uFEFF/, '').trim().split(/\r?\n/).map(line => line.trim())
  if (lines[0] !== 'Land-Ocean: Global Means' || lines[1]?.split(',').map(value => value.trim()).join(',') !== columns) {
    throw new Error('CSV NASA inválido: título o columnas no reconocidos.')
  }
  if (lines.length < 3) throw new Error('CSV NASA vacío.')
  return lines.slice(2).map((line, index) => {
    const cells = line.split(',').map(value => value.trim())
    if (cells.length !== 19 || !/^\d{4}$/.test(cells[0])) throw new Error(`Fila ${index + 3}: estructura inválida.`)
    const year = Number(cells[0])
    if (year !== 1880 + index) throw new Error(`Año ${year}: se requieren años consecutivos desde 1880, sin duplicados.`)
    const values = cells.slice(1).map(value => {
      if (value === '***') return null
      if (!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(value) || !Number.isFinite(Number(value))) {
        throw new Error(`Año ${year}: valor inválido «${value}».`)
      }
      return Number(value)
    })
    const months = values.slice(0, 12)
    const annual = values[12]
    if (annual !== null && months.some(value => value === null)) {
      throw new Error(`Año ${year}: J-D presente con meses faltantes.`)
    }
    return { year, months, annual }
  })
}

export function createDataset(csv: string, downloadedAt: string, sha256: string): ClimateDataset {
  const years = parseGistempCsv(csv)
  const records = getAvailableRecords(years)
  if (!records.length || !getParisThresholds(years).baseline.complete) {
    throw new Error('Serie insuficiente: se requieren los 21 años completos de 1880–1900.')
  }
  if (!Number.isFinite(Date.parse(downloadedAt)) || !/^[a-f0-9]{64}$/.test(sha256)) throw new Error('Metadatos inválidos.')
  const date = (record: { year: number; month: number }) => `${record.year}-${String(record.month).padStart(2, '0')}`
  return {
    schemaVersion: 1,
    source: { name: 'NASA GISTEMP v4', url: NASA_CSV_URL, referencePeriod: '1951–1980', unit: '°C' },
    downloadedAt, sha256,
    firstDate: date(records[0]), lastDate: date(records.at(-1)!),
    yearCount: years.length, monthCount: records.length, years,
  }
}

/** Allow official revisions, but reject truncated downloads or loss of valid history. */
export function assertHistoryPreserved(previous: ClimateDataset, next: ClimateDataset): void {
  for (const row of previous.years) {
    const replacement = next.years.find(candidate => candidate.year === row.year)
    if (!replacement || row.months.some((value, index) => value !== null && replacement.months[index] == null) ||
        (row.annual !== null && replacement.annual === null)) {
      throw new Error(`La descarga elimina registros válidos de ${row.year}; se conserva el archivo anterior.`)
    }
  }
}
