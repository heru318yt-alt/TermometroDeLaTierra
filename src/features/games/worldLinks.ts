const worldIds = new Set(['energia', 'industria', 'transporte', 'bosques', 'agricultura'])

export function isWorldId(value: string | null): value is string {
  return value !== null && worldIds.has(value)
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
