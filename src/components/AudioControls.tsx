import { useEffect, useRef, useState } from 'react'
import { useAudio } from '../features/audio/AudioProvider'

type ChannelProps = {
  label: string
  description: string
  enabled: boolean
  volume: number
  onToggle: () => void
  onVolume: (value: number) => void
  onCommit?: () => void
  disabled: boolean
}

function SpeakerIcon({ muted, on }: { muted: boolean; on: boolean }) {
  return <svg viewBox="0 0 24 24" aria-hidden="true" className="speaker-icon">
    <path d="M4 9.3h3.2L12 5.1v13.8l-4.8-4.2H4z" fill="currentColor" />
    {muted ? <path d="m16 9 5 6m0-6-5 6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /> : <>
      <path d="M15.4 9.1a4.2 4.2 0 0 1 0 5.8M18.2 6.7a7.5 7.5 0 0 1 0 10.6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" opacity={on ? 1 : .38} />
    </>}
  </svg>
}

function Channel({ label, description, enabled, volume, onToggle, onVolume, onCommit, disabled }: ChannelProps) {
  return <div className={`audio-channel${enabled ? ' is-on' : ''}`}>
    <div className="audio-channel-head">
      <div><strong>{label}</strong><small>{description}</small></div>
      <button type="button" role="switch" aria-checked={enabled} className="audio-switch" onClick={onToggle} disabled={disabled}>
        {enabled ? 'Sí' : 'No'}
      </button>
    </div>
    <label className="audio-range">Volumen <output>{volume}%</output>
      <input
        type="range"
        min="0"
        max="100"
        step="1"
        value={volume}
        disabled={disabled}
        onChange={event => onVolume(Number(event.target.value))}
        onPointerUp={() => onCommit?.()}
        onKeyUp={event => {
          if (event.key.startsWith('Arrow') || event.key === 'Home' || event.key === 'End' || event.key.startsWith('Page')) onCommit?.()
        }}
        aria-label={`Volumen de ${label.toLowerCase()}`}
      />
    </label>
  </div>
}

export function AudioControls() {
  const {
    enabled, muted, music, effects, ambient, musicOn, effectsOn, ambientOn,
    setEnabled, setMuted, setMusic, setEffects, setAmbient,
    setMusicOn, setEffectsOn, setAmbientOn, playEffect,
  } = useAudio()
  const [open, setOpen] = useState(false)
  const [testing, setTesting] = useState(false)
  const root = useRef<HTMLDivElement>(null)
  const trigger = useRef<HTMLButtonElement>(null)
  const testTimer = useRef<number | null>(null)
  const status = !enabled ? 'Apagado' : muted ? 'Silenciado' : 'Activo'
  const canTestEffect = enabled && !muted && effectsOn && effects > 0

  useEffect(() => () => {
    if (testTimer.current !== null) window.clearTimeout(testTimer.current)
  }, [])

  useEffect(() => {
    if (!open) return
    const close = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false)
    }
    const escape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { setOpen(false); playEffect('click', { force: true }); trigger.current?.focus() }
    }
    document.addEventListener('pointerdown', close)
    document.addEventListener('keydown', escape)
    return () => {
      document.removeEventListener('pointerdown', close)
      document.removeEventListener('keydown', escape)
    }
  }, [open, playEffect])

  function handleTestEffect() {
    if (!canTestEffect) return
    playEffect('adventure', { force: true })
    setTesting(true)
    if (testTimer.current !== null) window.clearTimeout(testTimer.current)
    testTimer.current = window.setTimeout(() => {
      setTesting(false)
      testTimer.current = null
    }, 550)
  }

  return <div className="audio-dock" ref={root}>
    <button ref={trigger} type="button" className={`audio-trigger${enabled ? ' is-on' : ''}${muted ? ' is-muted' : ''}`} aria-expanded={open} aria-controls="audio-panel" aria-label={`Sonido: ${status}`} onClick={() => { setOpen(value => !value); playEffect('open', { force: true }) }}>
      <SpeakerIcon muted={muted} on={enabled && !muted} />
      <span className="audio-label">Sonido</span>
      <small>{status}</small>
    </button>
    {open && <div id="audio-panel" className="audio-panel" role="region" aria-label="Configuración de sonido">
      <div className="audio-panel-head"><span>PAISAJE SONORO</span><span className={`audio-status-dot${enabled && !muted ? ' is-live' : ''}`} aria-hidden="true" /></div>
      <div className="audio-master">
        <button type="button" className={`audio-power${enabled ? ' is-on' : ''}`} aria-pressed={enabled} onClick={() => setEnabled(!enabled)}>
          {enabled ? 'Desactivar audio' : 'Activar audio'}
        </button>
        <button type="button" className="audio-mute" aria-pressed={muted} disabled={!enabled} onClick={() => { const next = !muted; setMuted(next); if (!next) playEffect('toggle', { force: true }) }}>
          {muted ? 'Quitar silencio' : 'Silenciar todo'}
        </button>
      </div>
      <div className="audio-channels">
        <Channel label="Música" description="Pista de cada sección · pista propia en los minijuegos" enabled={musicOn} volume={music} onToggle={() => { setMusicOn(!musicOn); playEffect('toggle', { force: true }) }} onVolume={setMusic} onCommit={() => playEffect('click', { force: true })} disabled={!enabled} />
        <Channel label="Efectos" description="Sonidos distintos para cada acción" enabled={effectsOn} volume={effects} onToggle={() => { const next = !effectsOn; setEffectsOn(next); if (next) playEffect('toggle', { force: true }) }} onVolume={setEffects} onCommit={() => playEffect('click', { force: true })} disabled={!enabled} />
        <Channel label="Ambiente" description="Grabación propia de cada mundo" enabled={ambientOn} volume={ambient} onToggle={() => { setAmbientOn(!ambientOn); playEffect('toggle', { force: true }) }} onVolume={setAmbient} onCommit={() => playEffect('click', { force: true })} disabled={!enabled} />
      </div>
      <button
        type="button"
        className={`audio-test${testing ? ' is-testing' : ''}`}
        disabled={!canTestEffect}
        title={canTestEffect ? 'Reproducir efecto de prueba' : !enabled ? 'Activa el audio primero' : muted ? 'Quita el silencio para probar' : 'Activa y sube el volumen de Efectos para probar'}
        onClick={handleTestEffect}
      >
        {testing ? 'Reproduciendo efecto…' : 'Probar un efecto'}
      </button>
      <p className="audio-note">Cada sección reproduce su propia pista y cada mundo de los minijuegos, la suya; mientras juegas, la pista de la sección se detiene. Los sonidos están incluidos en la página y solo se reproducen al activar el audio.</p>
    </div>}
  </div>
}
