/**
 * Sonificación directa de la anomalía climática mediante Web Audio API.
 * Mapea el intervalo [-1 °C, +2 °C] a [220 Hz, 660 Hz] de forma lineal y limpia,
 * sin dependencias externas y tolerante a entornos sin AudioContext.
 */

let toneContext: AudioContext | null = null
let activeStop: (() => void) | null = null

export const MIN_SONIFY_TEMP = -1
export const MAX_SONIFY_TEMP = 2
export const MIN_SONIFY_HZ = 220
export const MAX_SONIFY_HZ = 660

export function anomalyToFrequency(anomaly: number): number {
  const clamped = Math.max(MIN_SONIFY_TEMP, Math.min(MAX_SONIFY_TEMP, anomaly))
  const ratio = (clamped - MIN_SONIFY_TEMP) / (MAX_SONIFY_TEMP - MIN_SONIFY_TEMP)
  return Math.round(MIN_SONIFY_HZ + ratio * (MAX_SONIFY_HZ - MIN_SONIFY_HZ))
}

export function stopAnomalyTone() {
  if (!activeStop) return
  const stop = activeStop
  activeStop = null
  try {
    stop()
  } catch {
    /* tono ya detenido */
  }
}

export function playAnomalyTone(anomaly: number): boolean {
  if (typeof window === 'undefined' || !Number.isFinite(anomaly)) return false
  const AudioCtor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (!AudioCtor) return false

  stopAnomalyTone()

  try {
    if (!toneContext || toneContext.state === 'closed') {
      toneContext = new AudioCtor()
    }
    const ctx = toneContext
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {})
    }

    const baseFreq = anomalyToFrequency(anomaly)
    const now = ctx.currentTime
    const duration = 0.42

    const master = ctx.createGain()
    const osc = ctx.createOscillator()
    const overtone = ctx.createOscillator()
    const overtoneGain = ctx.createGain()

    osc.type = 'triangle'
    osc.frequency.setValueAtTime(baseFreq, now)
    overtone.type = 'sine'
    overtone.frequency.setValueAtTime(baseFreq * 2, now)
    overtoneGain.gain.setValueAtTime(0.22, now)

    master.gain.setValueAtTime(0.0001, now)
    master.gain.exponentialRampToValueAtTime(0.14, now + 0.025)
    master.gain.exponentialRampToValueAtTime(0.0001, now + duration)

    osc.connect(master)
    overtone.connect(overtoneGain)
    overtoneGain.connect(master)
    master.connect(ctx.destination)

    let stopped = false
    const cleanup = () => {
      if (stopped) return
      stopped = true
      if (activeStop === cleanup) activeStop = null
      try { master.gain.cancelScheduledValues?.(ctx.currentTime) } catch { /* ignore */ }
      try { master.gain.setValueAtTime(0.0001, ctx.currentTime) } catch { /* ignore */ }
      try { osc.stop() } catch { /* ignore */ }
      try { overtone.stop() } catch { /* ignore */ }
      try { osc.disconnect() } catch { /* ignore */ }
      try { overtone.disconnect() } catch { /* ignore */ }
      try { overtoneGain.disconnect() } catch { /* ignore */ }
      try { master.disconnect() } catch { /* ignore */ }
    }
    activeStop = cleanup

    osc.addEventListener?.('ended', cleanup)
    osc.start(now)
    overtone.start(now)
    osc.stop(now + duration + 0.02)
    overtone.stop(now + duration + 0.02)
    return true
  } catch {
    return false
  }
}
