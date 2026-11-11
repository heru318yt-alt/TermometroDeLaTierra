export const worldIds = ['energia', 'industria', 'transporte', 'bosques', 'agricultura'] as const

export type WorldId = typeof worldIds[number]

const worldIdSet = new Set<string>(worldIds)

export function isWorldId(value: string | null): value is WorldId {
  return value !== null && worldIdSet.has(value)
}

/** SPA route for one of the five worlds, used by links and deep links. */
export function gameRoute(world: WorldId): string {
  return `${import.meta.env.BASE_URL}minijuegos?world=${world}`
}

export function unityWorldUrl(world: string, returnToAtlas = false): string {
  const path = `${import.meta.env.BASE_URL}unity-minijuegos/index.html`
  const url = new URL(path, window.location.origin)
  url.searchParams.set('world', world)
  if (returnToAtlas) {
    url.searchParams.set('return', new URL(`${import.meta.env.BASE_URL}minijuegos#mundos`, window.location.origin).href)
  }
  return `${url.pathname}${url.search}`
}
