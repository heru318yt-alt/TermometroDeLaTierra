export type SoundKind = 'click' | 'nav' | 'open' | 'map' | 'date' | 'timeline' | 'info' | 'adventure'
  | 'gain' | 'loss' | 'combo' | 'warn' | 'win' | 'victory' | 'alarm'
  | 'fuel-carbon' | 'fuel-gas' | 'launch' | 'launch-road'

const validKinds = new Set<SoundKind>(['click', 'nav', 'open', 'map', 'date', 'timeline', 'info', 'adventure', 'gain', 'loss', 'combo', 'warn', 'win', 'victory', 'alarm', 'fuel-carbon', 'fuel-gas', 'launch', 'launch-road'])

export function isSoundKind(value: unknown): value is SoundKind {
  return typeof value === 'string' && validKinds.has(value as SoundKind)
}

/**
 * Components can request a short interface sound without depending on the
 * audio context. AudioProvider listens for this event and ignores it until the
 * visitor has activated sound.
 */
export function playSfx(kind: SoundKind) {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent<SoundKind>('tt:sfx', { detail: kind }))
}
