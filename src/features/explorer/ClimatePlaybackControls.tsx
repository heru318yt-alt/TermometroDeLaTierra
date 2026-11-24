import { useExplorer } from './ExplorerContext'
export function ClimatePlaybackControls() {
  const { step, atStart, atEnd, playing, togglePlay, reset, speed, setSpeed, reducedMotion } = useExplorer()
  return <div className="playback-area">
    <div className="playback-controls" role="group" aria-label="Reproducción temporal">
      <button type="button" onClick={reset} disabled={atStart && !playing}>↶ Reiniciar</button>
      <button type="button" onClick={() => step(-1)} disabled={atStart} aria-label="Retroceder">←</button>
      <button type="button" className="play-button" onClick={togglePlay} disabled={reducedMotion} aria-pressed={playing}>{playing ? 'Ⅱ Pausar' : '▶ Reproducir'}</button>
      <button type="button" onClick={() => step(1)} disabled={atEnd} aria-label="Avanzar">→</button>
      <label>Velocidad<select value={speed} onChange={event => setSpeed(Number(event.target.value))}><option value={1400}>Lenta · 1,4 s</option><option value={700}>Normal · 0,7 s</option><option value={250}>Rápida · 0,25 s</option></select></label>
    </div>
    <p className="muted">{reducedMotion ? 'Movimiento reducido activado: utiliza los controles manuales. Reproducción automática y transiciones desactivadas.' : 'Un paso por mes o año, según la vista. Se detiene al final; reproducir desde el final inicia un nuevo recorrido.'}</p>
  </div>
}
