import { historicalPeriods, type HistoryEvent } from '../history/catalog'

/**
 * Sede de cada acontecimiento documentado. Solo se ubican los que ocurrieron
 * en un lugar concreto; los hitos sin sede (entradas en vigor, informes, el
 * año más cálido) se muestran como acontecimientos globales.
 */
export interface Place { name: string; lat: number; lon: number }

const PLACES: Record<string, Place> = {
  'El primer Día de la Tierra': { name: 'Estados Unidos', lat: 38.9, lon: -77.0 },
  'Conferencia de Estocolmo': { name: 'Estocolmo', lat: 59.33, lon: 18.07 },
  'Primera Conferencia Mundial sobre el Clima': { name: 'Ginebra', lat: 46.2, lon: 6.15 },
  'Se crea el IPCC': { name: 'Ginebra (OMM)', lat: 46.2, lon: 6.15 },
  'La Convención sobre el Cambio Climático': { name: 'Río de Janeiro', lat: -22.9, lon: -43.2 },
  'Se adopta el Protocolo de Kioto': { name: 'Kioto', lat: 35.01, lon: 135.77 },
  'Se adopta el Acuerdo de París': { name: 'París', lat: 48.86, lon: 2.35 },
  'El IPCC publica el informe de 1,5 °C': { name: 'Incheon', lat: 37.46, lon: 126.7 },
  'Comienza el primer balance mundial': { name: 'Glasgow', lat: 55.86, lon: -4.25 },
  'Concluye el primer balance mundial': { name: 'Dubái', lat: 25.2, lon: 55.27 },
  'La conferencia climática llega a Belém': { name: 'Belém', lat: -1.46, lon: -48.5 },
}

export interface MapEvent extends HistoryEvent { id: string; place: Place | null; periodLabel: string }

export const mapEvents: MapEvent[] = historicalPeriods.flatMap(period => period.events.map(event => ({
  ...event, id: `${event.year}-${event.title}`, place: PLACES[event.title] ?? null, periodLabel: period.label,
})))

/** Proyección equirectangular del archivo de contornos (720 × 360). */
export const project = (p: Place) => ({ x: (p.lon + 180) * 2, y: (90 - p.lat) * 2 })
