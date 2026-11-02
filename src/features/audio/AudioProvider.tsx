import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'

type AudioContextValue = {
  enabled: boolean
  muted: boolean
  music: number
  effects: number
  setEnabled: (value: boolean) => void
  setMuted: (value: boolean) => void
  setMusic: (value: number) => void
  setEffects: (value: number) => void
  playEffect: (kind?: 'soft' | 'confirm') => void
}

const AudioSettingsContext = createContext<AudioContextValue | null>(null)

function readPreference(key: string, fallback: number) {
  try {
    const stored = window.localStorage.getItem(key)
    if (stored === null || stored.trim() === '') return fallback
    const value = Number(stored)
    return Number.isFinite(value) ? Math.min(100, Math.max(0, value)) : fallback
  } catch {
    return fallback
  }
}

/**
 * Small, intentionally subtle Web Audio layer. Nothing is created until the
 * visitor enables sound, so the page never autoplays. The ambient bed is
 * generated locally; there are no audio files or third-party requests.
 */
export function AudioProvider({ children }: { children: ReactNode }) {
  const contextRef = useRef<AudioContext | null>(null)
  const masterRef = useRef<GainNode | null>(null)
  const musicRef = useRef<GainNode | null>(null)
  const effectsRef = useRef<GainNode | null>(null)
  const oscillatorsRef = useRef<OscillatorNode[]>([])
  const [enabled, setEnabledState] = useState(false)
  const [muted, setMutedState] = useState(false)
  const [music, setMusicState] = useState(() => readPreference('tt-music', 34))
  const [effects, setEffectsState] = useState(() => readPreference('tt-effects', 52))

  const stopAmbient = useCallback(() => {
    for (const oscillator of oscillatorsRef.current) {
      try { oscillator.stop() } catch { /* already stopped */ }
    }
    oscillatorsRef.current = []
    contextRef.current?.close().catch(() => {})
    contextRef.current = null
    masterRef.current = null
    musicRef.current = null
    effectsRef.current = null
  }, [])

  const startAmbient = useCallback(() => {
    const AudioCtor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!AudioCtor) return
    if (contextRef.current) return
    const context = new AudioCtor()
    const master = context.createGain()
    const musicGain = context.createGain()
    const effectsGain = context.createGain()
    const filter = context.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.value = 620
    filter.Q.value = .4
    master.gain.value = muted ? 0 : .9
    musicGain.gain.value = music / 100 * .085
    effectsGain.gain.value = effects / 100 * .3
    musicGain.connect(filter)
    filter.connect(master)
    effectsGain.connect(master)
    master.connect(context.destination)
    contextRef.current = context
    masterRef.current = master
    musicRef.current = musicGain
    effectsRef.current = effectsGain
    const frequencies = [110, 164.81, 220, 329.63]
    frequencies.forEach((frequency, index) => {
      const oscillator = context.createOscillator()
      const voice = context.createGain()
      oscillator.type = index % 2 === 0 ? 'sine' : 'triangle'
      oscillator.frequency.value = frequency
      voice.gain.value = index === 0 ? .7 : .18 / (index + 1)
      oscillator.connect(voice)
      voice.connect(musicGain)
      oscillator.start()
      oscillatorsRef.current.push(oscillator)
    })
    context.resume().catch(() => {})
  }, [music, muted])

  useEffect(() => {
    if (!contextRef.current) return
    const master = masterRef.current
    if (master) master.gain.setTargetAtTime(muted ? 0 : .9, contextRef.current.currentTime, .05)
  }, [muted])

  useEffect(() => {
    const context = contextRef.current
    if (!context) return
    musicRef.current?.gain.setTargetAtTime(music / 100 * .085, context.currentTime, .05)
  }, [music])

  useEffect(() => {
    const context = contextRef.current
    if (!context) return
    effectsRef.current?.gain.setTargetAtTime(effects / 100 * .3, context.currentTime, .05)
  }, [effects])

  useEffect(() => {
    try {
      window.localStorage.setItem('tt-music', String(music))
      window.localStorage.setItem('tt-effects', String(effects))
    } catch { /* storage may be unavailable */ }
  }, [music, effects])

  useEffect(() => () => stopAmbient(), [stopAmbient])

  const setEnabled = useCallback((value: boolean) => {
    if (value) startAmbient()
    else stopAmbient()
    setEnabledState(value)
  }, [startAmbient, stopAmbient])

  const playEffect = useCallback((kind: 'soft' | 'confirm' = 'soft') => {
    const context = contextRef.current
    const target = effectsRef.current
    if (!context || !target || !enabled || muted || effects === 0) return
    const oscillator = context.createOscillator()
    const envelope = context.createGain()
    const now = context.currentTime
    oscillator.type = 'sine'
    oscillator.frequency.setValueAtTime(kind === 'confirm' ? 523.25 : 392, now)
    oscillator.frequency.exponentialRampToValueAtTime(kind === 'confirm' ? 659.25 : 293.66, now + .09)
    envelope.gain.setValueAtTime(.0001, now)
    envelope.gain.exponentialRampToValueAtTime(.16, now + .012)
    envelope.gain.exponentialRampToValueAtTime(.0001, now + .18)
    oscillator.connect(envelope)
    envelope.connect(target)
    oscillator.start(now)
    oscillator.stop(now + .2)
  }, [effects, enabled, muted])

  const value = useMemo<AudioContextValue>(() => ({
    enabled,
    muted,
    music,
    effects,
    setEnabled: value => setEnabled(value),
    setMuted: setMutedState,
    setMusic: setMusicState,
    setEffects: setEffectsState,
    playEffect,
  }), [effects, enabled, music, muted, playEffect, setEnabled])

  return <AudioSettingsContext.Provider value={value}>{children}</AudioSettingsContext.Provider>
}

export function useAudio() {
  const value = useContext(AudioSettingsContext)
  if (!value) throw new Error('useAudio requiere AudioProvider.')
  return value
}
