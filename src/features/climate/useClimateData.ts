import { useMemo } from 'react'
import { getClimateData, getClimateSummary } from './service'

/** Synchronous local dataset; no network/loading state is needed. */
export function useClimateData() {
  return useMemo(() => ({ data: getClimateData(), summary: getClimateSummary() }), [])
}
