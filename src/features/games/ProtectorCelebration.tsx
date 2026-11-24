import { useEffect, useRef } from 'react'
import { Link } from 'react-router'
import { playSfx } from '../audio/sfx'
import { playVictoryFanfare } from '../audio/victorySound'
import { gameEpochs } from './epochs'
import './protector.css'

type Props = {
  open: boolean
  onClose: () => void
  onRestart: () => void
}

const CONFETTI_COLORS = ['#b96d3a', '#e5a958', '#5e7a50', '#5a8891', '#9f4735', '#8fd4be']

const CONFETTI_PIECES = Array.from({ length: 30 }, (_, i) => ({
  id: i,
  x: `${((i * 37) % 94) + 3}%`,
  w: `${7 + (i % 4) * 2}px`,
  h: `${10 + (i % 5) * 3}px`,
  r: i % 3 === 0 ? '99px' : '2px',
  c: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
  d: `${3.3 + (i % 5) * 0.45}s`,
  delay: `${(i % 7) * 0.22}s`,
  drift: `${(i % 2 === 0 ? 1 : -1) * (18 + (i % 4) * 14)}px`,
  spin: `${(i % 2 === 0 ? 1 : -1) * (280 + i * 24)}deg`,
}))

export function ProtectorCelebration({ open, onClose, onRestart }: Props) {
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const cardRef = useRef<HTMLElement>(null)
  const previousFocusRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (!open) return
    previousFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
    if (typeof document !== 'undefined' && document.fullscreenElement) {
      document.exitFullscreen?.().catch(() => {})
    }
    playSfx('victory')
    playVictoryFanfare(true)

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const focusRaf = window.requestAnimationFrame(() => closeButtonRef.current?.focus())

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        playSfx('click')
        onClose()
        return
      }
      if (event.key === 'Tab' && cardRef.current) {
        const focusables = cardRef.current.querySelectorAll<HTMLElement>(
          'button:not(:disabled), a[href], input:not(:disabled), select:not(:disabled), [tabindex]:not([tabindex="-1"])',
        )
        if (!focusables.length) return
        const first = focusables[0]
        const last = focusables[focusables.length - 1]
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault()
          last.focus()
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault()
          first.focus()
        }
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => {
      window.cancelAnimationFrame(focusRaf)
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', onKeyDown)
      const prev = previousFocusRef.current
      if (prev && prev.isConnected) window.requestAnimationFrame(() => prev.focus())
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className="protector-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="protector-title"
      onClick={event => {
        if (event.target === event.currentTarget) {
          playSfx('click')
          onClose()
        }
      }}
    >
      <div className="protector-confetti" aria-hidden="true">
        {CONFETTI_PIECES.map(piece => (
          <span
            key={piece.id}
            className="protector-piece"
            style={{
              '--x': piece.x,
              '--w': piece.w,
              '--h': piece.h,
              '--r': piece.r,
              '--c': piece.c,
              '--d': piece.d,
              '--delay': piece.delay,
              '--drift': piece.drift,
              '--spin': piece.spin,
            } as React.CSSProperties}
          />
        ))}
      </div>

      <article ref={cardRef} className="protector-card">
        <span className="protector-tape protector-tape-a" aria-hidden="true" />
        <span className="protector-tape protector-tape-b" aria-hidden="true" />

        <header className="protector-head">
          <div className="protector-seal" aria-hidden="true">
            <svg viewBox="0 0 48 48">
              <circle cx="24" cy="24" r="18" />
              <path d="M16 25.5C16 18 22 13 31 13c0 9-5 15-15 15Z" />
              <path d="M16 28l9-9" />
              <path d="M18 35l6-3 6 3" />
            </svg>
          </div>
          <div>
            <p className="protector-kicker">TÍTULO OFICIAL · 5 DE 5 RETOS COMPLETADOS</p>
            <h2 id="protector-title">Protector Ambiental</h2>
            <p className="protector-lead">
              Completaste las cinco decisiones de la bitácora climática: de equilibrar la red eléctrica hasta adaptar el uso del suelo y cuidar los bosques.
            </p>
          </div>
        </header>

        <ul className="protector-list" aria-label="Resumen de los cinco retos completados">
          {gameEpochs.map((epoch, idx) => (
            <li key={epoch.id}>
              <span className="protector-num">{String(idx + 1).padStart(2, '0')}</span>
              <div className="protector-item-copy">
                <span>{epoch.range} · {epoch.theme}</span>
                <strong>{epoch.title}</strong>
              </div>
              <span className="protector-check" aria-label="Completado">✓</span>
            </li>
          ))}
        </ul>

        <p className="protector-note">
          Ningún factor actúa aislado: energía, materiales, movilidad, bosques y suelos comparten una misma atmósfera. Puedes repetir cualquier etapa o volver a explorar los registros reales de NASA GISTEMP.
        </p>

        <div className="protector-actions">
          <button
            ref={closeButtonRef}
            type="button"
            className="button"
            onClick={onClose}
          >
            Seguir explorando
            <span aria-hidden="true">↗</span>
          </button>
          <Link className="protector-secondary" to="/logros" onClick={onClose}>
            Ver mis logros →
          </Link>
          <Link className="protector-secondary" to="/explorador" onClick={onClose}>
            Abrir Explorador climático ↗
          </Link>
          <button
            type="button"
            className="protector-reset"
            data-sfx="loss"
            onClick={onRestart}
          >
            Reiniciar recorrido
          </button>
        </div>
      </article>
    </div>
  )
}
