// Shared editorial catalog. Historical descriptions have not yet been documented.
export const historicalPeriods = [
  { start: 1970, end: 1979 }, { start: 1980, end: 1989 },
  { start: 1990, end: 1999 }, { start: 2000, end: 2009 },
  { start: 2010, end: 2019 }, { start: 2020, end: 2025 },
].map(period => ({
  ...period,
  name: `Período ${period.start}–${period.end}`,
  label: `${period.start}–${period.end}`,
  description: 'Contenido histórico pendiente de documentación y fuentes. No se atribuyen causas a partir de la anomalía observada.',
}))
export const periods = historicalPeriods.map(period => period.label)
