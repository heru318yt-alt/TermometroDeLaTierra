import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { useLocation } from 'react-router'
import { isEpochUnlocked, useCompletedEpochs } from '../games/progress'
import { isWorldId, type WorldId } from '../games/worldLinks'
import { isSoundKind, type SoundKind } from './sfx'
import { setVictoryAudioState } from './victorySound'

type Scene = {
  name: string
  chord: readonly number[]
  brightness: number
  ambience: string
  ambientLevel: number
  /** Pista propia de la sección o del minijuego. Reemplaza el acorde sintetizado mientras suena. */
  track?: { file: string; gain: number }
}

type Buses = {
  master: GainNode
  music: GainNode
  effects: GainNode
}

type Voice = { oscillator: OscillatorNode; gain: GainNode }
type SoundSample = { buffer: AudioBuffer; gain: number }
type SoundBuffers = Partial<Record<SoundKind, SoundSample | null>>
type VoiceSlot = 'fanfare' | 'alert' | 'feedback' | 'ui'
export type PlayEffectOptions = { force?: boolean }

const emptySoundBuffers = (): SoundBuffers => ({})

/** Efectos de interfaz: se igualan a un RMS más alto para que se oigan sobre la música. */
const interfaceKinds = new Set<SoundKind>(['click', 'nav', 'open', 'map', 'date', 'timeline', 'info', 'toggle', 'event', 'adventure'])

/** Cada categoría usa un canal exclusivo para evitar que los sonidos se amontonen al dispararse rápido. */
const SLOT_BY_KIND: Record<SoundKind, VoiceSlot> = {
  victory: 'fanfare',
  win: 'fanfare',
  adventure: 'fanfare',
  alarm: 'alert',
  warn: 'alert',
  loss: 'alert',
  gain: 'feedback',
  combo: 'feedback',
  'fuel-carbon': 'feedback',
  'fuel-gas': 'feedback',
  launch: 'feedback',
  'launch-road': 'feedback',
  event: 'feedback',
  click: 'ui',
  nav: 'ui',
  open: 'ui',
  map: 'ui',
  date: 'ui',
  timeline: 'ui',
  info: 'ui',
  toggle: 'ui',
}

const HIGH_PRIORITY_KINDS = new Set<SoundKind>(['victory', 'win', 'adventure', 'alarm', 'loss', 'combo'])

const KIND_COOLDOWN_SEC: Partial<Record<SoundKind, number>> = {
  timeline: .095,
  click: .075,
  gain: .085,
  warn: .14,
}

/** Iguala el volumen percibido de cada archivo; los clics cortos necesitan más ganancia que una victoria. */
function sampleGain(buffer: AudioBuffer, kind: SoundKind) {
  let peak = 0
  let sum = 0
  let count = 0
  for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
    const data = buffer.getChannelData(channel)
    for (let i = 0; i < data.length; i += 4) {
      const value = Math.abs(data[i])
      if (value > peak) peak = value
      sum += data[i] * data[i]
      count++
    }
  }
  const rms = Math.sqrt(sum / Math.max(1, count))
  const targetRms = interfaceKinds.has(kind) ? .18 : .16
  const peakCap = interfaceKinds.has(kind) ? 1.2 : 1
  const byRms = rms > 0 ? targetRms / rms : 1
  const byPeak = peak > 0 ? peakCap / peak : 1
  return Math.min(byRms, byPeak)
}

/**
 * Efectos de sonido (carpeta «efectos de sonido Arq multi»): recortados,
 * con fundido de salida y volumen igualado por categoría. Si un archivo no
 * carga, playEffect usa el tono sintetizado equivalente.
 */
const soundFiles: Partial<Record<SoundKind, string>> = {
  click: 'ui-click.mp3', nav: 'ui-nav.mp3', open: 'ui-open.mp3', map: 'ui-map.mp3', date: 'ui-date.mp3',
  timeline: 'ui-timeline.mp3', info: 'ui-info.mp3', adventure: 'ui-adventure.mp3',
  toggle: 'ui-timeline.mp3', event: 'ui-info.mp3',
  gain: 'game-gain.mp3', loss: 'game-loss.mp3', combo: 'game-combo.mp3', warn: 'game-warn.mp3', win: 'game-win.mp3',
  victory: 'game-victory.mp3', alarm: 'game-alarm.mp3', 'fuel-carbon': 'game-carbon.mp3', 'fuel-gas': 'game-gas.mp3',
  launch: 'game-launch.mp3', 'launch-road': 'game-launch-road.mp3',
}

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
  playEffect: (kind?: SoundKind, options?: PlayEffectOptions) => void
}

const AudioSettingsContext = createContext<AudioContextValue | null>(null)

const scenes: Record<string, Scene> = {
  home: { name: 'Puerto de observación', chord: [110, 164.81, 220, 329.63], brightness: 760, ambience: 'ambience-wind-birds.ogg', ambientLevel: .92, track: { file: 'section-inicio.mp3', gain: .6 } },
  explorer: { name: 'Mesa de observación', chord: [103.83, 155.56, 207.65, 311.13], brightness: 680, ambience: 'ambience-wind-birds.ogg', ambientLevel: .72, track: { file: 'section-explorador.mp3', gain: .58 } },
  timeline: { name: 'Sala de instrumentos', chord: [98, 146.83, 196, 293.66], brightness: 610, ambience: 'ambience-wind-birds.ogg', ambientLevel: .48, track: { file: 'section-linea-del-tiempo.mp3', gain: .6 } },
  history: { name: 'Bitácora', chord: [103.83, 155.56, 207.65, 311.13], brightness: 560, ambience: 'ambience-wind-birds.ogg', ambientLevel: .42, track: { file: 'section-historia.mp3', gain: .6 } },
  factors: { name: 'Cuaderno de campo', chord: [116.54, 174.61, 233.08, 349.23], brightness: 820, ambience: 'ambience-wind-birds.ogg', ambientLevel: .8, track: { file: 'section-factores.mp3', gain: .6 } },
  games: { name: 'Atlas de aventuras', chord: [130.81, 196, 261.63, 392], brightness: 900, ambience: 'ambience-wind-birds.ogg', ambientLevel: .78, track: { file: 'section-minijuegos.mp3', gain: .62 } },
  energy: { name: 'Viento en el parque energético', chord: [130.81, 196, 261.63, 392], brightness: 960, ambience: 'ambience-wind-birds.ogg', ambientLevel: .86, track: { file: 'music-manten-la-red.mp3', gain: .91 } },
  industry: { name: 'Pulso de la fábrica circular', chord: [82.41, 123.47, 164.81, 246.94], brightness: 360, ambience: 'ambience-industrial.mp3', ambientLevel: .7, track: { file: 'music-puente-de-materiales.mp3', gain: .8 } },
  transport: { name: 'Aire de la ciudad', chord: [110, 164.81, 220, 293.66], brightness: 570, ambience: 'ambience-city.ogg', ambientLevel: .64, track: { file: 'music-carga-entre-ciudades.mp3', gain: .77 } },
  forest: { name: 'Viento entre los bosques', chord: [130.81, 196, 261.63, 392], brightness: 1120, ambience: 'ambience-forest.mp3', ambientLevel: .84, track: { file: 'music-guardabosques.mp3', gain: 1 } },
  agriculture: { name: 'Mañana en el campo', chord: [123.47, 185, 246.94, 329.63], brightness: 860, ambience: 'ambience-farm.ogg', ambientLevel: .76, track: { file: 'music-finca-equilibrada.mp3', gain: .81 } },
  sources: { name: 'Archivo y método', chord: [98, 146.83, 220, 293.66], brightness: 520, ambience: 'ambience-wind-birds.ogg', ambientLevel: .42, track: { file: 'section-fuentes.mp3', gain: .6 } },
  about: { name: 'Nota de proyecto', chord: [110, 164.81, 233.08, 329.63], brightness: 700, ambience: 'ambience-wind-birds.ogg', ambientLevel: .56 },
}

const worldScenes: Record<string, Scene> = {
  energia: scenes.energy,
  industria: scenes.industry,
  transporte: scenes.transport,
  bosques: scenes.forest,
  agricultura: scenes.agriculture,
}

function sceneForPath(pathname: string, search = '', completed: readonly WorldId[] = []): Scene {
  if (pathname.startsWith('/explorador')) return scenes.explorer
  if (pathname.startsWith('/linea-del-tiempo')) return scenes.timeline
  if (pathname.startsWith('/historia')) return scenes.history
  if (pathname.startsWith('/factores')) return scenes.factors
  if (pathname.startsWith('/minijuegos')) {
    const world = new URLSearchParams(search).get('world')
    return world && isWorldId(world) && isEpochUnlocked(world, completed)
      ? (worldScenes[world] || scenes.games)
      : scenes.games
  }
  if (pathname.startsWith('/fuentes')) return scenes.sources
  if (pathname.startsWith('/acerca')) return scenes.about
  return scenes.home
}

const audioUrl = (file: string) => new URL(`${import.meta.env.BASE_URL}audio/${file}`, window.location.origin).href
const voiceLevel = (index: number) => index === 0 ? .6 : .18 / index
/** Volumen de la pista: sigue el control de Música (escala de 0 a 1 con margen para no tapar los efectos). */
const trackVolume = (scene: Scene, music: number, musicOn: boolean, muted: boolean) =>
  !scene.track || muted || !musicOn ? 0 : Math.min(1, music / 100 * .9 * scene.track.gain)

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
  const completed = useCompletedEpochs()
  const contextRef = useRef<AudioContext | null>(null)
  const busesRef = useRef<Buses | null>(null)
  const voicesRef = useRef<Voice[]>([])
  const ambientAudioRef = useRef<HTMLAudioElement | null>(null)
  const musicAudioRef = useRef<HTMLAudioElement | null>(null)
  const soundBuffersRef = useRef<SoundBuffers>(emptySoundBuffers())
  const soundBuffersLoadingRef = useRef(false)
  const musicLfoRef = useRef<OscillatorNode | null>(null)
  const musicFilterRef = useRef<BiquadFilterNode | null>(null)
  const activeVoicesRef = useRef<Partial<Record<VoiceSlot, () => void>>>({})
  const lastEffectRef = useRef(-1)
  const lastKindTimeRef = useRef<Partial<Record<SoundKind, number>>>({})
  const sceneRef = useRef<Scene>(sceneForPath(location.pathname, location.search, completed))

  const [enabled, setEnabledState] = useState(false)
  const [muted, setMutedState] = useState(false)
  const [music, setMusicState] = useState(() => readNumber('tt-music', 34))
  const [effects, setEffectsState] = useState(() => readNumber('tt-effects', 52))
  const [ambient, setAmbientState] = useState(() => readNumber('tt-ambient', 28))
  const [musicOn, setMusicOnState] = useState(() => readFlag('tt-music-on', true))
  const [effectsOn, setEffectsOnState] = useState(() => readFlag('tt-effects-on', true))
  const [ambientOn, setAmbientOnState] = useState(() => readFlag('tt-ambient-on', true))

  const settingsRef = useRef({ enabled, muted, music, effects, ambient, musicOn, effectsOn, ambientOn })
  settingsRef.current = { enabled, muted, music, effects, ambient, musicOn, effectsOn, ambientOn }

  const setMuted = useCallback((value: boolean) => { settingsRef.current.muted = value; setMutedState(value) }, [])
  const setMusic = useCallback((value: number) => { settingsRef.current.music = value; setMusicState(value) }, [])
  const setEffects = useCallback((value: number) => { settingsRef.current.effects = value; setEffectsState(value) }, [])
  const setAmbient = useCallback((value: number) => { settingsRef.current.ambient = value; setAmbientState(value) }, [])
  const setMusicOn = useCallback((value: boolean) => { settingsRef.current.musicOn = value; setMusicOnState(value) }, [])
  const setEffectsOn = useCallback((value: boolean) => { settingsRef.current.effectsOn = value; setEffectsOnState(value) }, [])
  const setAmbientOn = useCallback((value: boolean) => { settingsRef.current.ambientOn = value; setAmbientOnState(value) }, [])

  const stopSlot = useCallback((slot: VoiceSlot) => {
    const stop = activeVoicesRef.current[slot]
    if (!stop) return
    delete activeVoicesRef.current[slot]
    try { stop() } catch { /* already stopped */ }
  }, [])

  const stopAllEffectVoices = useCallback(() => {
    ;(Object.keys(activeVoicesRef.current) as VoiceSlot[]).forEach(slot => stopSlot(slot))
  }, [stopSlot])

  const stopAudio = useCallback(() => {
    stopAllEffectVoices()
    for (const voice of voicesRef.current) {
      try { voice.oscillator.stop() } catch { /* already stopped */ }
    }
    voicesRef.current = []
    ambientAudioRef.current?.pause()
    ambientAudioRef.current?.removeAttribute('src')
    ambientAudioRef.current?.load()
    ambientAudioRef.current = null
    musicAudioRef.current?.pause()
    musicAudioRef.current?.removeAttribute('src')
    musicAudioRef.current?.load()
    musicAudioRef.current = null
    soundBuffersRef.current = emptySoundBuffers()
    soundBuffersLoadingRef.current = false
    try { musicLfoRef.current?.stop() } catch { /* already stopped */ }
    musicLfoRef.current = null
    musicFilterRef.current = null
    lastEffectRef.current = -1
    lastKindTimeRef.current = {}
    contextRef.current?.close().catch(() => {})
    contextRef.current = null
    busesRef.current = null
  }, [stopAllEffectVoices])

  const startAudio = useCallback(() => {
    if (contextRef.current) return
    const AudioCtor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!AudioCtor) return
    const s = settingsRef.current
    const context = new AudioCtor()
    const master = context.createGain()
    const musicBus = context.createGain()
    const effectsBus = context.createGain()
    const musicFilter = context.createBiquadFilter()

    musicFilter.type = 'lowpass'
    musicFilter.frequency.value = sceneRef.current.brightness
    musicFilter.Q.value = .35
    master.gain.value = s.muted ? 0 : .86
    musicBus.gain.value = s.musicOn ? s.music / 100 * .095 : 0
    effectsBus.gain.value = s.effectsOn ? s.effects / 100 * .78 : 0

    musicBus.connect(musicFilter)
    musicFilter.connect(master)
    effectsBus.connect(master)
    master.connect(context.destination)

    contextRef.current = context
    busesRef.current = { master, music: musicBus, effects: effectsBus }
    musicFilterRef.current = musicFilter

    const soundBase = `${import.meta.env.BASE_URL}audio/`
    const soundUrl = (file: string) => new URL(`${soundBase}${file}`, window.location.origin).href
    const ambientAudio = new Audio()
    ambientAudio.loop = true
    ambientAudio.preload = 'none'
    ambientAudio.src = soundUrl(sceneRef.current.ambience)
    const ambientVol = s.muted || !s.ambientOn ? 0 : Math.min(1, s.ambient / 100 * .78 * sceneRef.current.ambientLevel)
    ambientAudio.volume = ambientVol
    ambientAudio.muted = ambientVol === 0
    ambientAudioRef.current = ambientAudio
    if (ambientVol > 0) ambientAudio.play().catch(() => {})

    const musicAudio = new Audio()
    musicAudio.loop = true
    musicAudio.preload = 'auto'
    musicAudioRef.current = musicAudio
    const track = sceneRef.current.track
    if (track) {
      musicAudio.src = soundUrl(track.file)
      const trackVol = trackVolume(sceneRef.current, s.music, s.musicOn, s.muted)
      musicAudio.volume = trackVol
      musicAudio.muted = trackVol === 0
      if (trackVol > 0) musicAudio.play().catch(() => {})
    }

    if (!soundBuffersLoadingRef.current) {
      soundBuffersLoadingRef.current = true
      const targetBuffers = soundBuffersRef.current
      const loadBuffer = async (file: string) => {
        const response = await fetch(soundUrl(file))
        if (!response.ok) throw new Error(`No se pudo cargar ${file}`)
        return context.decodeAudioData(await response.arrayBuffer())
      }
      Promise.allSettled(Object.entries(soundFiles).map(async ([kind, file]) => {
        const buffer = await loadBuffer(file as string)
        if (contextRef.current !== context) return
        targetBuffers[kind as SoundKind] = {
          buffer,
          gain: sampleGain(buffer, kind as SoundKind),
        }
      }))
        .catch(() => {})
        .finally(() => {
          if (contextRef.current === context) soundBuffersLoadingRef.current = false
        })
    }

    const chord = sceneRef.current.chord
    chord.forEach((frequency, index) => {
      const oscillator = context.createOscillator()
      const voiceGain = context.createGain()
      oscillator.type = index % 2 === 0 ? 'sine' : 'triangle'
      oscillator.frequency.value = frequency
      oscillator.detune.value = index === 0 ? -3 : index * 2
      voiceGain.gain.value = sceneRef.current.track ? 0 : voiceLevel(index)
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

    context.resume().catch(() => {})
  }, [])

  useEffect(() => {
    if (!contextRef.current) return
    if (muted) stopAllEffectVoices()
    busesRef.current?.master.gain.setTargetAtTime(muted ? 0 : .86, contextRef.current.currentTime, .045)
  }, [muted, stopAllEffectVoices])

  useEffect(() => {
    const context = contextRef.current
    if (!context) return
    busesRef.current?.music.gain.setTargetAtTime(musicOn ? music / 100 * .095 : 0, context.currentTime, .06)
  }, [music, musicOn])

  useEffect(() => {
    const audio = musicAudioRef.current
    if (!audio) return
    const vol = trackVolume(sceneRef.current, music, musicOn, muted)
    audio.volume = vol
    audio.muted = vol === 0
    if (vol === 0) audio.pause()
    else if (sceneRef.current.track && !document.hidden) audio.play().catch(() => {})
  }, [music, musicOn, muted])

  useEffect(() => {
    const context = contextRef.current
    if (!context) return
    if (!effectsOn || effects === 0) stopAllEffectVoices()
    busesRef.current?.effects.gain.setTargetAtTime(effectsOn ? effects / 100 * .78 : 0, context.currentTime, .04)
  }, [effects, effectsOn, stopAllEffectVoices])

  useEffect(() => {
    const audio = ambientAudioRef.current
    if (!audio) return
    const vol = muted || !ambientOn ? 0 : Math.min(1, ambient / 100 * .78 * sceneRef.current.ambientLevel)
    audio.volume = vol
    audio.muted = vol === 0
    if (vol === 0) audio.pause()
    else if (!document.hidden) audio.play().catch(() => {})
  }, [ambient, ambientOn, muted])

  useEffect(() => {
    setVictoryAudioState(enabled, muted || !effectsOn || effects === 0)
  }, [enabled, muted, effectsOn, effects])

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

  const playEffect = useCallback((kind: SoundKind = 'click', options?: PlayEffectOptions) => {
    const context = contextRef.current
    const bus = busesRef.current?.effects
    const s = settingsRef.current
    if (!context || !bus || !s.enabled || s.muted || !s.effectsOn || s.effects === 0) return

    const dispatch = () => {
      if (contextRef.current !== context) return
      const cur = settingsRef.current
      if (!cur.enabled || cur.muted || !cur.effectsOn || cur.effects === 0) return

      const now = context.currentTime
      if (!options?.force) {
        const lastSame = lastKindTimeRef.current[kind]
        const cooldown = KIND_COOLDOWN_SEC[kind] ?? .055
        if (lastSame !== undefined && now - lastSame < cooldown) return
        if (!HIGH_PRIORITY_KINDS.has(kind) && lastEffectRef.current >= 0 && now - lastEffectRef.current < .025) return
      }
      lastEffectRef.current = now
      lastKindTimeRef.current[kind] = now

      const slot = SLOT_BY_KIND[kind]
      stopSlot(slot)
      if (slot === 'fanfare') {
        stopSlot('alert')
        stopSlot('feedback')
      }

      const stopCallbacks: Array<() => void> = []

      const sample = soundBuffersRef.current[kind]
      if (sample) {
        const source = context.createBufferSource()
        const output = context.createGain()
        source.buffer = sample.buffer
        output.gain.value = (kind === 'adventure' || kind === 'victory' ? .92 : .84) * sample.gain
        source.connect(output)
        output.connect(bus)

        const slotStop = () => {
          try { output.gain.setValueAtTime(.0001, context.currentTime) } catch { /* ignore */ }
          try { source.stop() } catch { /* already stopped */ }
          try { source.disconnect() } catch { /* ignore */ }
          try { output.disconnect() } catch { /* ignore */ }
        }
        activeVoicesRef.current[slot] = slotStop
        source.addEventListener?.('ended', () => {
          if (activeVoicesRef.current[slot] === slotStop) delete activeVoicesRef.current[slot]
          try { source.disconnect() } catch { /* ignore */ }
          try { output.disconnect() } catch { /* ignore */ }
        })
        source.start(now)
        return
      }

      let remaining = 0
      const slotStop = () => {
        stopCallbacks.splice(0).forEach(fn => {
          try { fn() } catch { /* already stopped */ }
        })
      }
      activeVoicesRef.current[slot] = slotStop

      const tone = (frequency: number, endFrequency: number, duration: number, type: OscillatorType = 'sine', delay = 0, level = .16) => {
        const oscillator = context.createOscillator()
        const envelope = context.createGain()
        const start = now + delay
        remaining++
        oscillator.type = type
        oscillator.frequency.setValueAtTime(frequency, start)
        oscillator.frequency.exponentialRampToValueAtTime(Math.max(30, endFrequency), start + duration)
        envelope.gain.setValueAtTime(.0001, start)
        envelope.gain.exponentialRampToValueAtTime(level, start + .012)
        envelope.gain.exponentialRampToValueAtTime(.0001, start + duration)
        oscillator.connect(envelope)
        envelope.connect(bus)
        stopCallbacks.push(() => {
          try { envelope.gain.setValueAtTime(.0001, context.currentTime) } catch { /* ignore */ }
          try { oscillator.stop() } catch { /* already stopped */ }
          try { oscillator.disconnect() } catch { /* ignore */ }
          try { envelope.disconnect() } catch { /* ignore */ }
        })
        oscillator.addEventListener?.('ended', () => {
          remaining--
          if (remaining <= 0 && activeVoicesRef.current[slot] === slotStop) {
            delete activeVoicesRef.current[slot]
          }
          try { oscillator.disconnect() } catch { /* ignore */ }
          try { envelope.disconnect() } catch { /* ignore */ }
        })
        oscillator.start(start)
        oscillator.stop(start + duration + .02)
      }

      if (kind === 'nav') {
        tone(330, 392, .16, 'sine', 0, .15)
        tone(440, 523.25, .18, 'sine', .07, .12)
        return
      }
      if (kind === 'open') {
        tone(196, 262, .3, 'sine', 0, .18)
        tone(293.66, 392, .34, 'triangle', .03, .1)
        return
      }
      if (kind === 'map') {
        tone(138, 98, .24, 'sine', 0, .2)
        tone(220, 174.61, .2, 'triangle', .025, .09)
        return
      }
      if (kind === 'date') {
        tone(659.25, 880, .12, 'triangle', 0, .15)
        tone(987.77, 1174.66, .1, 'sine', .06, .08)
        return
      }
      if (kind === 'timeline') {
        tone(523.25, 392, .13, 'triangle', 0, .13)
        return
      }
      if (kind === 'info') {
        tone(783.99, 783.99, .22, 'sine', 0, .14)
        tone(1174.66, 1046.5, .24, 'sine', .03, .08)
        return
      }
      if (kind === 'adventure') {
        ;[392, 523.25, 659.25, 783.99].forEach((frequency, index) => tone(frequency, frequency * 1.01, .24, 'triangle', index * .085, .24))
        return
      }
      if (kind === 'gain') {
        tone(660, 990, .1, 'triangle', 0, .14)
        tone(990, 1320, .08, 'sine', .04, .09)
        return
      }
      if (kind === 'loss') {
        tone(240, 140, .2, 'sawtooth', 0, .08)
        tone(180, 110, .22, 'triangle', .02, .12)
        return
      }
      if (kind === 'combo') {
        ;[523.25, 659.25, 783.99, 1046.5].forEach((frequency, index) => tone(frequency, frequency * 1.02, .12, 'square', index * .05, .06))
        return
      }
      if (kind === 'warn') {
        tone(880, 880, .07, 'square', 0, .06)
        tone(880, 880, .07, 'square', .12, .05)
        return
      }
      if (kind === 'win' || kind === 'victory') {
        ;[392, 523.25, 659.25, 783.99, 1046.5].forEach((frequency, index) => tone(frequency, frequency, .32, 'triangle', index * .085, .15))
        return
      }
      if (kind === 'toggle') {
        tone(620, 880, .07, 'triangle', 0, .2)
        tone(880, 740, .09, 'sine', .06, .14)
        return
      }
      if (kind === 'event') {
        ;[783.99, 1174.66].forEach((frequency, index) => tone(frequency, frequency, .55, 'sine', index * .07, .15))
        return
      }
      tone(420, 300, .09, 'triangle', 0, .14)
    }

    if (context.state === 'suspended') {
      context.resume().then(() => dispatch()).catch(() => {})
      return
    }
    dispatch()
  }, [stopSlot])

  const setEnabled = useCallback((value: boolean) => {
    settingsRef.current.enabled = value
    if (value) {
      startAudio()
      setEnabledState(true)
      playEffect('open', { force: true })
    } else {
      stopAudio()
      setEnabledState(false)
    }
  }, [playEffect, startAudio, stopAudio])

  useEffect(() => {
    const onSfx = (event: Event) => {
      const kind = (event as CustomEvent<unknown>).detail
      if (isSoundKind(kind)) playEffect(kind)
    }
    const onClick = (event: MouseEvent) => {
      const target = event.target as Element | null
      const control = target?.closest('button, a, summary, [role="button"], [role="tab"], [role="radio"], [data-sfx]') as HTMLElement | null
      if (!control || control.closest('.audio-dock') || (control as HTMLButtonElement).disabled) return
      // Evita duplicar sonido con onChange cuando el clic activa un select, radio o selector de mes.
      if (control.tagName === 'SELECT' || (control instanceof HTMLInputElement && (control.type === 'radio' || control.type === 'month'))) return
      const requested = control.getAttribute('data-sfx')
      if (requested === 'none') return
      const role = control.getAttribute('role')
      playEffect(
        isSoundKind(requested)
          ? requested
          : control.tagName === 'A'
            ? 'nav'
            : control.tagName === 'SUMMARY'
              ? 'open'
              : role === 'tab' || role === 'radio'
                ? 'toggle'
                : 'click'
      )
    }
    // Los desplegables, selectores de fecha y radios nativos suenan al confirmar el cambio.
    const onChange = (event: Event) => {
      const control = event.target as HTMLInputElement | HTMLSelectElement | null
      if (!control || control.closest('.audio-dock') || control.getAttribute('data-sfx') === 'none') return
      if (control.tagName === 'SELECT' || control.type === 'month') {
        playEffect('timeline')
      } else if (control.type === 'radio') {
        playEffect('toggle')
      }
    }
    window.addEventListener('tt:sfx', onSfx)
    document.addEventListener('click', onClick)
    document.addEventListener('change', onChange)
    return () => {
      window.removeEventListener('tt:sfx', onSfx)
      document.removeEventListener('click', onClick)
      document.removeEventListener('change', onChange)
    }
  }, [playEffect])

  useEffect(() => {
    sceneRef.current = sceneForPath(location.pathname, location.search, completed)
    const context = contextRef.current
    const voices = voicesRef.current
    if (!context || !voices.length) return
    const s = settingsRef.current
    const chord = sceneRef.current.chord
    const track = sceneRef.current.track
    voices.forEach((voice, index) => {
      if (chord[index]) voice.oscillator.frequency.setTargetAtTime(chord[index], context.currentTime, .35)
      // Con pista propia, el acorde sintetizado se desvanece para no superponerse.
      voice.gain.gain.setTargetAtTime(track ? 0 : voiceLevel(index), context.currentTime, .4)
    })
    const musicAudio = musicAudioRef.current
    if (musicAudio) {
      if (track) {
        const source = audioUrl(track.file)
        const vol = trackVolume(sceneRef.current, s.music, s.musicOn, s.muted)
        if (musicAudio.src !== source) { musicAudio.src = source; musicAudio.currentTime = 0; musicAudio.load() }
        musicAudio.volume = vol
        musicAudio.muted = vol === 0
        if (vol > 0 && !document.hidden) musicAudio.play().catch(() => {})
        else musicAudio.pause()
      } else {
        musicAudio.pause()
      }
    }
    musicFilterRef.current?.frequency.setTargetAtTime(sceneRef.current.brightness, context.currentTime, .5)
    const ambientAudio = ambientAudioRef.current
    if (ambientAudio) {
      const source = new URL(`${import.meta.env.BASE_URL}audio/${sceneRef.current.ambience}`, window.location.origin).href
      const vol = s.muted || !s.ambientOn ? 0 : Math.min(1, s.ambient / 100 * .78 * sceneRef.current.ambientLevel)
      if (ambientAudio.src !== source) {
        ambientAudio.src = source
        ambientAudio.load()
      }
      ambientAudio.volume = vol
      ambientAudio.muted = vol === 0
      if (vol > 0 && !document.hidden) ambientAudio.play().catch(() => {})
      else ambientAudio.pause()
    }
  }, [location.pathname, location.search, completed])

  useEffect(() => {
    const onVisibility = () => {
      const context = contextRef.current
      if (!context) return
      const s = settingsRef.current
      if (document.hidden) {
        context.suspend().catch(() => {})
        ambientAudioRef.current?.pause()
        musicAudioRef.current?.pause()
      } else {
        context.resume().catch(() => {})
        if (ambientAudioRef.current && s.ambientOn && s.ambient > 0 && !s.muted) ambientAudioRef.current.play().catch(() => {})
        if (musicAudioRef.current && sceneRef.current.track && s.musicOn && s.music > 0 && !s.muted) musicAudioRef.current.play().catch(() => {})
      }
    }
    document.addEventListener('visibilitychange', onVisibility)
    return () => document.removeEventListener('visibilitychange', onVisibility)
  }, [])

  useEffect(() => () => stopAudio(), [stopAudio])

  const value = useMemo<AudioContextValue>(() => ({
    enabled, muted, music, effects, ambient, musicOn, effectsOn, ambientOn,
    setEnabled,
    setMuted,
    setMusic,
    setEffects,
    setAmbient,
    setMusicOn,
    setEffectsOn,
    setAmbientOn,
    playEffect,
  }), [ambient, ambientOn, effects, effectsOn, enabled, music, musicOn, muted, playEffect, setAmbient, setAmbientOn, setEffects, setEffectsOn, setEnabled, setMusic, setMusicOn, setMuted])

  return <AudioSettingsContext.Provider value={value}>{children}</AudioSettingsContext.Provider>
}

export function useAudio() {
  const value = useContext(AudioSettingsContext)
  if (!value) throw new Error('useAudio requiere AudioProvider.')
  return value
}
