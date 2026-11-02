import { useEffect, useRef, useState } from 'react'
import { useAudio } from '../features/audio/AudioProvider'

export function AudioControls() {
  const { enabled, muted, music, effects, setEnabled, setMuted, setMusic, setEffects, playEffect } = useAudio()
  const [open, setOpen] = useState(false)
  const root = useRef<HTMLDivElement>(null)
  const trigger = useRef<HTMLButtonElement>(null)
  const status = !enabled ? 'Apagado' : muted ? 'Silenciado' : 'Activo'

  useEffect(() => {
    if (!open) return
    const close = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false)
    }
    const escape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { setOpen(false); trigger.current?.focus() }
    }
    document.addEventListener('pointerdown', close)
    document.addEventListener('keydown', escape)
    return () => {
      document.removeEventListener('pointerdown', close)
      document.removeEventListener('keydown', escape)
    }
  }, [open])

  return <div className="audio-dock" ref={root}>
    <button ref={trigger} type="button" className={`audio-trigger${enabled ? ' is-on' : ''}`} aria-expanded={open} aria-controls="audio-panel" onClick={() => setOpen(value => !value)}>
      <span className="audio-bars" aria-hidden="true"><i /><i /><i /></span>
      <span className="audio-label">Sonido</span>
      <small>{status}</small>
    </button>
    {open && <div id="audio-panel" className="audio-panel">
      <div className="audio-panel-head"><span>PAISAJE SONORO</span><span className="audio-status-dot" aria-hidden="true" /></div>
      <button type="button" className={`audio-power${enabled ? ' is-on' : ''}`} aria-pressed={enabled} onClick={() => setEnabled(!enabled)}>
        {enabled ? 'Desactivar audio' : 'Activar audio'}
      </button>
      <button type="button" className="audio-mute" aria-pressed={muted} disabled={!enabled} onClick={() => setMuted(!muted)}>
        {muted ? 'Quitar silencio' : 'Silenciar'}
      </button>
      <label className="audio-range">Música <output>{music}%</output>
        <input type="range" min="0" max="100" step="1" value={music} disabled={!enabled} onChange={event => setMusic(Number(event.target.value))} />
      </label>
      <label className="audio-range">Efectos <output>{effects}%</output>
        <input type="range" min="0" max="100" step="1" value={effects} disabled={!enabled} onChange={event => setEffects(Number(event.target.value))} />
      </label>
      <button type="button" className="audio-test" disabled={!enabled || muted} onClick={() => playEffect('confirm')}>Probar efecto</button>
      <p>Audio sintetizado en el navegador. Nunca se reproduce antes de activarlo.</p>
    </div>}
  </div>
}
