export const worldIds = ['energia', 'industria', 'transporte', 'bosques', 'agricultura'] as const

export type WorldId = typeof worldIds[number]

const worldIdSet = new Set<string>(worldIds)

export function isWorldId(value: string | null): value is WorldId {
  return value !== null && worldIdSet.has(value)
}

/** SPA route for one of the five worlds, relative to the Router basename. */
export function gameRoute(world: WorldId): string {
  return `/minijuegos?world=${world}`
}

/** Public href with BASE_URL for native SVG <a> elements. */
export function gameHref(world: WorldId): string {
  return `${import.meta.env.BASE_URL}minijuegos?world=${world}`
}
