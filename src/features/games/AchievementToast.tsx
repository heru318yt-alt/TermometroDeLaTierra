import { useNavigate } from 'react-router'
import { playSfx } from '../audio/sfx'
import { dismissAchievementToast, useAchievementToast, type AchievementId } from './achievements'
import './achievements.css'

/** Minimalist lineless Samurai Jack-inspired emblem per achievement topic. */
export function AchievementIcon({ kind }: { kind: AchievementId }) {
  if (kind === 'energia') {
    return <svg viewBox="0 0 40 40" aria-hidden="true">
      <rect width="40" height="40" rx="8" fill="#173a42" />
      <circle cx="29" cy="11" r="6" fill="#f3c46b" />
      <polygon points="10,34 18,34 15,15 13,15" fill="#e9e0c8" />
      <polygon points="14,15 11,4 17,11" fill="#f7f0dc" />
      <polygon points="14,15 24,20 15,21" fill="#f7f0dc" />
      <polygon points="14,15 4,20 13,13" fill="#f7f0dc" />
      <polygon points="24,22 33,19 29,28 24,29" fill="#e59856" />
    </svg>
  }
  if (kind === 'industria') {
    return <svg viewBox="0 0 40 40" aria-hidden="true">
      <rect width="40" height="40" rx="8" fill="#3a201d" />
      <path d="M5 24H35V30H30a5 5 0 0 0-10 0H18a5 5 0 0 0-10 0H5Z" fill="#d97b54" />
      <polygon points="11,17 29,17 26,22 14,22" fill="#f3e6ca" />
      <circle cx="15" cy="22" r="2.3" fill="#1a1615" />
      <circle cx="25" cy="22" r="2.3" fill="#1a1615" />
      <circle cx="28" cy="10" r="3" fill="#f3c46b" />
    </svg>
  }
  if (kind === 'transporte') {
    return <svg viewBox="0 0 40 40" aria-hidden="true">
      <rect width="40" height="40" rx="8" fill="#16353a" />
      <path d="M4 27Q14 23 24 27T36 25V36H4Z" fill="#4f8b92" />
      <polygon points="7,20 31,20 27,26 11,26" fill="#f3e8ce" />
      <rect x="11" y="13" width="8" height="7" fill="#e59856" />
      <rect x="21" y="10" width="6" height="10" fill="#7ec8b1" />
    </svg>
  }
  if (kind === 'bosques') {
    return <svg viewBox="0 0 40 40" aria-hidden="true">
      <rect width="40" height="40" rx="8" fill="#153526" />
      <circle cx="30" cy="10" r="4.5" fill="#f3c46b" />
      <polygon points="14,7 5,27 23,27" fill="#63b57d" />
      <polygon points="24,11 16,30 32,30" fill="#398a5b" />
      <rect x="12.5" y="27" width="3" height="7" fill="#f3e8ce" />
      <rect x="22.5" y="30" width="3" height="5" fill="#f3e8ce" />
    </svg>
  }
  if (kind === 'agricultura') {
    return <svg viewBox="0 0 40 40" aria-hidden="true">
      <rect width="40" height="40" rx="8" fill="#2d2614" />
      <circle cx="29" cy="10" r="5" fill="#f3c46b" />
      <path d="M4 22Q20 15 36 22V36H4Z" fill="#779e55" />
      <path d="M4 29Q20 24 36 29V36H4Z" fill="#d9aa4e" />
      <polygon points="10,22 22,22 22,15 16,10 10,15" fill="#f4ebd5" />
      <rect x="14" y="17" width="4" height="5" fill="#b75a3d" />
    </svg>
  }
  return <svg viewBox="0 0 40 40" aria-hidden="true">
    <rect width="40" height="40" rx="8" fill="#163e36" />
    <circle cx="20" cy="20" r="13" fill="#e5a958" />
    <path d="M13 22C13 15 18 11 27 11c0 8-4 13-14 13Z" fill="#163e36" />
    <polygon points="19,29 22,29 20.5,33" fill="#f7f0dc" />
  </svg>
}

export function AchievementToast() {
  const toast = useAchievementToast()
  const navigate = useNavigate()

  if (!toast) return null

  function openAchievements() {
    if (typeof document !== 'undefined' && document.fullscreenElement) {
      document.exitFullscreen?.().catch(() => {})
    }
    dismissAchievementToast()
    playSfx('nav')
    navigate('/logros')
  }

  return (
    <div className="ach-toast-wrap" role="status" aria-live="polite">
      <div className="ach-toast" style={{ '--ach-accent': toast.achievement.accent } as React.CSSProperties}>
        <button
          type="button"
          className="ach-toast-action"
          data-sfx="none"
          onClick={openAchievements}
        >
          <span className="ach-toast-icon">
            <AchievementIcon kind={toast.achievement.id} />
          </span>
          <span className="ach-toast-body">
            <span className="ach-toast-kicker">★ RETO COMPLETADO · LOGRO DESBLOQUEADO</span>
            <strong>{toast.achievement.title}</strong>
            <small>
              {toast.unlockedNext
                ? `Se abrió ${toast.unlockedNext}. Sigue jugando por un récord mayor.`
                : `${toast.achievement.gameTitle} · Sigue jugando por un récord mayor.`}
            </small>
            <span className="ach-toast-cta">Pulsa para ver logros →</span>
          </span>
        </button>
        <button
          type="button"
          className="ach-toast-close"
          data-sfx="click"
          aria-label="Cerrar notificación de logro"
          onClick={dismissAchievementToast}
        >
          ×
        </button>
      </div>
    </div>
  )
}
