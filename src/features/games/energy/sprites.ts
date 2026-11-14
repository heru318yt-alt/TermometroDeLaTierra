import type { ResourceKind } from './engine'

/** Letra corta que se dibuja sobre cada recurso para no depender solo del color. */
export const GLYPH: Record<ResourceKind, string> = { carbon: 'C', gas: 'G', renewable: 'R', storage: 'A' }
