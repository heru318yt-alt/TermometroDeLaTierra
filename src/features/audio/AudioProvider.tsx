import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { useLocation } from 'react-router'
import { isSoundKind, type SoundKind } from './sfx'

type Scene = {
  name: string
  chord: readonly number[]
  brightness: number
  ambientFrequency: number
  ambientLevel: number
}

type Buses = {
  master: GainNode
  music: GainNode
  effects: GainNode
  ambient: GainNode
}

type Voice = { oscillator: OscillatorNode; gain: GainNode }

type AudioContextValue = {
  enabled: boolean
  muted: boolean
  music: number
  effects: number
  ambient: number
  musicOn: boolean
  effectsOn: boolean
  ambientOn: boolean
  setEnabled: (value: boolean) => void
  setMuted: (value: boolean) => void
  setMusic: (value: number) => void
  setEffects: (value: number) => void
  setAmbient: (value: number) => void
  setMusicOn: (value: boolean) => void
  setEffectsOn: (value: boolean) => void
  setAmbientOn: (value: boolean) => void
  playEffect: (kind?: SoundKind) => void
}

const AudioSettingsContext = createContext<AudioContextValue | null>(null)

const scenes: Record<string, Scene> = {
  home: { name: 'Puerto de observación', chord: [110, 164.81, 220, 329.63], brightness: 760, ambientFrequency: 620, ambientLevel: .9 },
  explorer: { name: 'Mesa de observación', chord: [103.83, 155.56, 207.65, 311.13], brightness: 680, ambientFrequency: 720, ambientLevel: .72 },
  timeline: { name: 'Sala de instrumentos', chord: [98, 146.83, 196, 293.66], brightness: 610, ambientFrequency: 470, ambientLevel: .48 },
  history: { name: 'Bitácora', chord: [103.83, 155.56, 207.65, 311.13], brightness: 560, ambientFrequency: 390, ambientLevel: .42 },
  factors: { name: 'Cuaderno de campo', chord: [116.54, 174.61, 233.08, 349.23], brightness: 820, ambientFrequency: 980, ambientLevel: .8 },
  games: { name: 'Atlas de aventuras', chord: [130.81, 196, 261.63, 392], brightness: 900, ambientFrequency: 920, ambientLevel: .78 },
  energy: { name: 'Viento en el parque energético', chord: [130.81, 196, 261.63, 392], brightness: 960, ambientFrequency: 1320, ambientLevel: .86 },
  industry: { name: 'Pulso de la fábrica circular', chord: [82.41, 123.47, 164.81, 246.94], brightness: 360, ambientFrequency: 210, ambientLevel: .44 },
  transport: { name: 'Aire de la ciudad', chord: [110, 164.81, 220, 293.66], brightness: 570, ambientFrequency: 690, ambientLevel: .72 },
  forest: { name: 'Viento entre los bosques', chord: [130.81, 196, 261.63, 392], brightness: 1120, ambientFrequency: 1600, ambientLevel: .9 },
  agriculture: { name: 'Brisa del campo', chord: [123.47, 185, 246.94, 329.63], brightness: 860, ambientFrequency: 1180, ambientLevel: .86 },
  sources: { name: 'Archivo y método', chord: [98, 146.83, 220, 293.66], brightness: 520, ambientFrequency: 400, ambientLevel: .42 },
  about: { name: 'Nota de proyecto', chord: [110, 164.81, 233.08, 329.63], brightness: 700, ambientFrequency: 560, ambientLevel: .56 },
}

const worldScenes: Record<string, Scene> = {
  energia: scenes.energy,
  industria: scenes.industry,
  transporte: scenes.transport,
  bosques: scenes.forest,
  agricultura: scenes.agriculture,
}

function sceneForPath(pathname: string, search = ''): Scene {
  if (pathname.startsWith('/explorador')) return scenes.explorer
  if (pathname.startsWith('/linea-del-tiempo')) return scenes.timeline
  if (pathname.startsWith('/historia')) return scenes.history
  if (pathname.startsWith('/factores')) return scenes.factors
  if (pathname.startsWith('/minijuegos')) {
    const world = new URLSearchParams(search).get('world')
    return (world && worldScenes[world]) || scenes.games
  }
  if (pathname.startsWith('/fuentes')) return scenes.sources
  if (pathname.startsWith('/acerca')) return scenes.about
  return scenes.home
}

function readNumber(key: string, fallback: number) {
  try {
    const stored = window.localStorage.getItem(key)
    if (stored === null || stored.trim() === '') return fallback
    const value = Number(stored)
    return Number.isFinite(value) ? Math.min(100, Math.max(0, value)) : fallback
  } catch {
    return fallback
  }
}

function readFlag(key: string, fallback: boolean) {
  try {
    const stored = window.localStorage.getItem(key)
    return stored === null ? fallback : stored === 'true'
  } catch {
    return fallback
  }
}

/**
 * A restrained, fully local soundscape. The audio context is created only after
 * the visitor turns sound on, so nothing autoplays. Music, ambient texture and
 * interface effects use separate buses and independent controls.
 */
export function AudioProvider({ children }: { children: ReactNode }) {
  const location = useLocation()
  const contextRef = useRef<AudioContext | null>(null)
  const busesRef = useRef<Buses | null>(null)
  const voicesRef = useRef<Voice[]>([])
  const ambientSourceRef = useRef<AudioBufferSourceNode | null>(null)
  const musicLfoRef = useRef<OscillatorNode | null>(null)
  const musicFilterRef = useRef<BiquadFilterNode | null>(null)
  const ambientFilterRef = useRef<BiquadFilterNode | null>(null)
  const lastEffectRef = useRef(0)
  const sceneRef = useRef<Scene>(sceneForPath(location.pathname, location.search))

  const [enabled, setEnabledState] = useState(false)
  const [muted, setMutedState] = useState(false)
  const [music, setMusicState] = useState(() => readNumber('tt-music', 34))
  const [effects, setEffectsState] = useState(() => readNumber('tt-effects', 52))
  const [ambient, setAmbientState] = useState(() => readNumber('tt-ambient', 28))
  const [musicOn, setMusicOnState] = useState(() => readFlag('tt-music-on', true))
  const [effectsOn, setEffectsOnState] = useState(() => readFlag('tt-effects-on', true))
  const [ambientOn, setAmbientOnState] = useState(() => readFlag('tt-ambient-on', true))

  const stopAudio = useCallback(() => {
    for (const voice of voicesRef.current) {
      try { voice.oscillator.stop() } catch { /* already stopped */ }
    }
    voicesRef.current = []
    try { ambientSourceRef.current?.stop() } catch { /* already stopped */ }
    ambientSourceRef.current = null
    try { musicLfoRef.current?.stop() } catch { /* already stopped */ }
    musicLfoRef.current = null
    musicFilterRef.current = null
    ambientFilterRef.current = null
    contextRef.current?.close().catch(() => {})
    contextRef.current = null
    busesRef.current = null
  }, [])

  const startAudio = useCallback(() => {
    if (contextRef.current) return
    const AudioCtor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!AudioCtor) return
    const context = new AudioCtor()
    const master = context.createGain()
    const musicBus = context.createGain()
    const effectsBus = context.createGain()
    const ambientBus = context.createGain()
    const musicFilter = context.createBiquadFilter()
    const ambientFilter = context.createBiquadFilter()

    musicFilter.type = 'lowpass'
    musicFilter.frequency.value = sceneRef.current.brightness
    musicFilter.Q.value = .35
    ambientFilter.type = 'lowpass'
    ambientFilter.frequency.value = sceneRef.current.ambientFrequency
    ambientFilter.Q.value = .3
    master.gain.value = muted ? 0 : .86
    musicBus.gain.value = musicOn ? music / 100 * .095 : 0
    effectsBus.gain.value = effectsOn ? effects / 100 * .3 : 0
    ambientBus.gain.value = ambientOn ? ambient / 100 * .13 * sceneRef.current.ambientLevel : 0

    musicBus.connect(musicFilter)
    musicFilter.connect(master)
    ambientBus.connect(ambientFilter)
    ambientFilter.connect(master)
    effectsBus.connect(master)
    master.connect(context.destination)

    contextRef.current = context
    busesRef.current = { master, music: musicBus, effects: effectsBus, ambient: ambientBus }
    musicFilterRef.current = musicFilter
    ambientFilterRef.current = ambientFilter

    const chord = sceneRef.current.chord
    chord.forEach((frequency, index) => {
      const oscillator = context.createOscillator()
      const voiceGain = context.createGain()
      oscillator.type = index % 2 === 0 ? 'sine' : 'triangle'
      oscillator.frequency.value = frequency
      oscillator.detune.value = index === 0 ? -3 : index * 2
      voiceGain.gain.value = index === 0 ? .6 : .18 / index
      oscillator.connect(voiceGain)
      voiceGain.connect(musicBus)
      oscillator.start()
      voicesRef.current.push({ oscillator, gain: voiceGain })
    })

    const lfo = context.createOscillator()
    const lfoDepth = context.createGain()
    lfo.type = 'sine'
    lfo.frequency.value = .055
    lfoDepth.gain.value = .018
    lfo.connect(lfoDepth)
    lfoDepth.connect(musicBus.gain)
    lfo.start()
    musicLfoRef.current = lfo

    const noiseBuffer = context.createBuffer(1, context.sampleRate * 2.4, context.sampleRate)
    const data = noiseBuffer.getChannelData(0)
    let brown = 0
    for (let index = 0; index < data.length; index++) {
      const white = Math.random() * 2 - 1
      brown = (brown + .018 * white) / 1.018
      data[index] = brown * 3.2
    }
    const ambientSource = context.createBufferSource()
    ambientSource.buffer = noiseBuffer
    ambientSource.loop = true
    ambientSource.connect(ambientFilter)
    ambientSource.start()
    ambientSourceRef.current = ambientSource

    context.resume().catch(() => {})
  }, [ambient, ambientOn, effects, effectsOn, music, musicOn, muted])

  const setEnabled = useCallback((value: boolean) => {
    if (value) startAudio()
    else stopAudio()
    setEnabledState(value)
  }, [startAudio, stopAudio])

  useEffect(() => {
    if (!contextRef.current) return
    busesRef.current?.master.gain.setTargetAtTime(muted ? 0 : .86, contextRef.current.currentTime, .045)
  }, [muted])

  useEffect(() => {
    const context = contextRef.current
    if (!context) return
    busesRef.current?.music.gain.setTargetAtTime(musicOn ? music / 100 * .095 : 0, context.currentTime, .06)
  }, [music, musicOn])

  useEffect(() => {
    const context = contextRef.current
    if (!context) return
    busesRef.current?.effects.gain.setTargetAtTime(effectsOn ? effects / 100 * .3 : 0, context.currentTime, .04)
  }, [effects, effectsOn])

  useEffect(() => {
    const context = contextRef.current
    if (!context) return
    busesRef.current?.ambient.gain.setTargetAtTime(ambientOn ? ambient / 100 * .13 * sceneRef.current.ambientLevel : 0, context.currentTime, .08)
  }, [ambient, ambientOn])

  useEffect(() => {
    try {
      window.localStorage.setItem('tt-music', String(music))
      window.localStorage.setItem('tt-effects', String(effects))
      window.localStorage.setItem('tt-ambient', String(ambient))
      window.localStorage.setItem('tt-music-on', String(musicOn))
      window.localStorage.setItem('tt-effects-on', String(effectsOn))
      window.localStorage.setItem('tt-ambient-on', String(ambientOn))
    } catch { /* storage may be unavailable */ }
  }, [ambient, ambientOn, effects, effectsOn, music, musicOn])

  const playEffect = useCallback((kind: SoundKind = 'click') => {
    const context = contextRef.current
    const bus = busesRef.current?.effects
    if (!context || !bus || !enabled || muted || !effectsOn || effects === 0) return

    const now = context.currentTime
    if (now - lastEffectRef.current < .028) return
    lastEffectRef.current = now

    const tone = (frequency: number, endFrequency: number, duration: number, type: OscillatorType = 'sine', delay = 0, level = .16) => {
      const oscillator = context.createOscillator()
      const envelope = context.createGain()
      const start = now + delay
      oscillator.type = type
      oscillator.frequency.setValueAtTime(frequency, start)
      oscillator.frequency.exponentialRampToValueAtTime(Math.max(30, endFrequency), start + duration)
      envelope.gain.setValueAtTime(.0001, start)
      envelope.gain.exponentialRampToValueAtTime(level, start + .012)
      envelope.gain.exponentialRampToValueAtTime(.0001, start + duration)
      oscillator.connect(envelope)
      envelope.connect(bus)
      oscillator.start(start)
      oscillator.stop(start + duration + .02)
      oscillator.addEventListener('ended', () => { oscillator.disconnect(); envelope.disconnect() })
    }

    if (kind === 'nav') {
      tone(330, 392, .16, 'sine', 0, .12)
      tone(440, 523.25, .18, 'sine', .07, .09)
      return
    }
    if (kind === 'open') {
      tone(196, 262, .3, 'sine', 0, .13)
      tone(293.66, 392, .34, 'triangle', .03, .07)
      return
    }
    if (kind === 'map') {
      tone(138, 98, .24, 'sine', 0, .17)
      tone(220, 174.61, .2, 'triangle', .025, .06)
      return
    }
    if (kind === 'date') {
      tone(659.25, 880, .12, 'triangle', 0, .12)
      tone(987.77, 1174.66, .1, 'sine', .06, .05)
      return
    }
    if (kind === 'timeline') {
      tone(523.25, 392, .13, 'triangle', 0, .1)
      return
    }
    if (kind === 'info') {
      tone(783.99, 783.99, .22, 'sine', 0, .1)
      tone(1174.66, 1046.5, .24, 'sine', .03, .045)
      return
    }
    if (kind === 'adventure') {
      ;[392, 523.25, 659.25, 783.99].forEach((frequency, index) => tone(frequency, frequency * 1.01, .22, 'triangle', index * .085, .1))
      return
    }
    tone(420, 300, .09, 'triangle', 0, .1)
  }, [effects, effectsOn, enabled, muted])

  useEffect(() => {
    const onSfx = (event: Event) => {
      const kind = (event as CustomEvent<unknown>).detail
      if (isSoundKind(kind)) playEffect(kind)
    }
    const onClick = (event: MouseEvent) => {
      const target = event.target as Element | null
      const control = target?.closest('button, a, summary, [data-sfx]') as HTMLElement | null
      if (!control || control.closest('.audio-dock')) return
      const requested = control.getAttribute('data-sfx')
      playEffect(isSoundKind(requested) ? requested : control.tagName === 'A' ? 'nav' : control.tagName === 'SUMMARY' ? 'open' : 'click')
    }
    window.addEventListener('tt:sfx', onSfx)
    document.addEventListener('click', onClick)
    return () => {
      window.removeEventListener('tt:sfx', onSfx)
      document.removeEventListener('click', onClick)
    }
  }, [playEffect])

  useEffect(() => {
    sceneRef.current = sceneForPath(location.pathname, location.search)
    const context = contextRef.current
    const voices = voicesRef.current
    if (!context || !voices.length) return
    const chord = sceneRef.current.chord
    voices.forEach((voice, index) => {
      if (chord[index]) voice.oscillator.frequency.setTargetAtTime(chord[index], context.currentTime, .35)
    })
    musicFilterRef.current?.frequency.setTargetAtTime(sceneRef.current.brightness, context.currentTime, .5)
    ambientFilterRef.current?.frequency.setTargetAtTime(sceneRef.current.ambientFrequency, context.currentTime, .8)
    busesRef.current?.ambient.gain.setTargetAtTime(ambientOn ? ambient / 100 * .13 * sceneRef.current.ambientLevel : 0, context.currentTime, .8)
  }, [ambient, ambientOn, location.pathname, location.search])

  useEffect(() => {
    const onVisibility = () => {
      const context = contextRef.current
      if (!context) return
      if (document.hidden) context.suspend().catch(() => {})
      else context.resume().catch(() => {})
    }
    document.addEventListener('visibilitychange', onVisibility)
    return () => document.removeEventListener('visibilitychange', onVisibility)
  }, [])

  useEffect(() => () => stopAudio(), [stopAudio])

  const value = useMemo<AudioContextValue>(() => ({
    enabled, muted, music, effects, ambient, musicOn, effectsOn, ambientOn,
    setEnabled,
    setMuted: setMutedState,
    setMusic: setMusicState,
    setEffects: setEffectsState,
    setAmbient: setAmbientState,
    setMusicOn: setMusicOnState,
    setEffectsOn: setEffectsOnState,
    setAmbientOn: setAmbientOnState,
    playEffect,
  }), [ambient, ambientOn, effects, effectsOn, enabled, music, musicOn, muted, playEffect, setEnabled])

  return <AudioSettingsContext.Provider value={value}>{children}</AudioSettingsContext.Provider>
}

export function useAudio() {
  const value = useContext(AudioSettingsContext)
  if (!value) throw new Error('useAudio requiere AudioProvider.')
  return value
}
