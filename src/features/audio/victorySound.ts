let sharedContext: AudioContext | null = null
let providerActive = false
let audioBlocked = false
type ActiveNode = { osc: OscillatorNode; gain: GainNode }
const activeNodes = new Set<ActiveNode>()

/**
 * Sincroniza el estado del panel de audio con las fanfarrias de victoria
 * para evitar duplicar con AudioProvider y respetar el canal de efectos.
 */
export function setVictoryAudioState(active: boolean, blocked: boolean) {
  providerActive = active
  audioBlocked = blocked
  if (active) stopVictoryFanfare()
}

/** Detiene cualquier fanfarria sintetizada activa antes de lanzar otra nueva. */
export function stopVictoryFanfare() {
  const ctx = sharedContext
  const nodes = [...activeNodes]
  activeNodes.clear()
  for (const node of nodes) {
    try {
      if (ctx) {
        const now = ctx.currentTime
        node.gain.gain.cancelScheduledValues?.(now)
        node.gain.gain.setValueAtTime(0.0001, now)
      }
    } catch { /* sin AudioContext activo */ }
    try { node.osc.stop() } catch { /* ya detenido */ }
    try { node.osc.disconnect() } catch { /* ya desconectado */ }
    try { node.gain.disconnect() } catch { /* ya desconectado */ }
  }
}

function shouldMuteVictory(): boolean {
  // Cuando AudioProvider está activo, la victoria ya suena por el bus de efectos.
  if (providerActive || audioBlocked) return true
  try {
    return window.localStorage.getItem('tt-effects-on') === 'false' || window.localStorage.getItem('tt-effects') === '0'
  } catch {
    return false
  }
}

function getContext(): AudioContext | null {
  if (typeof window === 'undefined') return null
  const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (!Ctor) return null
  try {
    if (!sharedContext || sharedContext.state === 'closed') {
      sharedContext = new Ctor()
    }
    if (sharedContext.state === 'suspended') {
      sharedContext.resume().catch(() => {})
    }
    return sharedContext
  } catch {
    return null
  }
}

function playTone(
  ctx: AudioContext,
  frequency: number,
  startOffset: number,
  duration: number,
  peak: number,
  type: OscillatorType,
) {
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  const entry: ActiveNode = { osc, gain }
  activeNodes.add(entry)
  const start = ctx.currentTime + startOffset
  osc.type = type
  osc.frequency.setValueAtTime(frequency, start)
  gain.gain.setValueAtTime(0.0001, start)
  gain.gain.exponentialRampToValueAtTime(peak, start + 0.018)
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration)
  osc.connect(gain)
  gain.connect(ctx.destination)
  osc.start(start)
  osc.stop(start + duration + 0.025)
  osc.addEventListener?.('ended', () => {
    activeNodes.delete(entry)
    try {
      osc.disconnect()
      gain.disconnect()
    } catch {
      /* ya desconectado */
    }
  })
}

/**
 * Fanfarria limpia sintetizada vía Web Audio API. No depende de archivos externos
 * y tolera entornos sin AudioContext o bloqueos de reproducción automática.
 */
export function playVictoryFanfare(grand = false) {
  if (shouldMuteVictory()) return
  const ctx = getContext()
  if (!ctx) return
  stopVictoryFanfare()

  const trigger = () => {
    if (shouldMuteVictory()) return
    try {
      if (grand) {
        const melody = [523.25, 659.25, 783.99, 880, 1046.5, 1318.5]
        melody.forEach((freq, idx) => {
          const at = idx * 0.1
          const dur = idx === melody.length - 1 ? 0.56 : 0.24
          playTone(ctx, freq, at, dur, 0.11, 'triangle')
          playTone(ctx, freq * 0.5, at, dur * 0.9, 0.055, 'sine')
        })
        // Acorde final cálido (C5 - E5 - G5)
        ;[523.25, 659.25, 783.99].forEach(freq => {
          playTone(ctx, freq, 0.54, 0.58, 0.045, 'sine')
        })
        return
      }
      const notes = [523.25, 659.25, 783.99, 1046.5]
      notes.forEach((freq, idx) => {
        const at = idx * 0.085
        const dur = idx === notes.length - 1 ? 0.36 : 0.18
        playTone(ctx, freq, at, dur, 0.1, 'triangle')
        playTone(ctx, freq * 1.5, at + 0.01, dur * 0.7, 0.035, 'sine')
      })
    } catch {
      /* entorno bloqueado */
    }
  }

  if (ctx.state === 'suspended') {
    ctx.resume().then(trigger).catch(() => {})
  } else {
    trigger()
  }
}
