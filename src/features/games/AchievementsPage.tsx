import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { PageIntro } from '../../components/PageIntro'
import { AchievementIcon } from './AchievementToast'
import { ProtectorCelebration } from './ProtectorCelebration'
import {
  ACHIEVEMENTS,
  getBestScore,
  isAchievementUnlocked,
  resetAchievements,
  syncAchievementsWithProgress,
  useUnlockedAchievements,
} from './achievements'
import { resetProgress, useCompletedEpochs } from './progress'
import { gameRoute } from './worldLinks'
import './achievements.css'

export function AchievementsPage() {
  const completed = useCompletedEpochs()
  const unlocks = useUnlockedAchievements()
  const [showCelebration, setShowCelebration] = useState(false)

  useEffect(() => {
    syncAchievementsWithProgress()
  }, [completed])

  const unlockedCount = ACHIEVEMENTS.filter(def => isAchievementUnlocked(def.id, unlocks, completed)).length
  const pct = Math.round((unlockedCount / ACHIEVEMENTS.length) * 100)
  const master = ACHIEVEMENTS.find(a => a.id === 'protector')!
  const masterUnlocked = isAchievementUnlocked('protector', unlocks, completed)
  const stageAchievements = ACHIEVEMENTS.filter(a => a.id !== 'protector')

  function handleRestart() {
    try { window.localStorage.removeItem('termometro:protector-celebrated:v1') } catch { /* ignore */ }
    resetProgress()
    resetAchievements()
    setShowCelebration(false)
  }

  return <div className="achievements-page">
    <PageIntro number="★" title="Logros del observatorio" eyebrow="COLECCIÓN DE RETOS Y RÉCORDS">
      Cada minijuego otorga un logro temático al superar su meta. En los desafíos arcade puedes seguir jugando sin interrupciones para romper tu puntaje máximo.
    </PageIntro>

    <section className="ach-summary" aria-label="Resumen de logros">
      <div className="ach-summary-meter">
        <div className="ach-summary-top">
          <span className="eyebrow">PROGRESO TOTAL</span>
          <strong>{unlockedCount} / {ACHIEVEMENTS.length}</strong>
        </div>
        <div
          className="ach-summary-bar"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={ACHIEVEMENTS.length}
          aria-valuenow={unlockedCount}
          aria-valuetext={`${unlockedCount} de ${ACHIEVEMENTS.length} logros desbloqueados`}
        >
          <i style={{ width: `${pct}%` }} />
        </div>
      </div>
      <div className="ach-summary-actions">
        <Link className="button" to="/minijuegos">
          Ir a los minijuegos
          <span aria-hidden="true">↗</span>
        </Link>
      </div>
    </section>

    <section className={`ach-master${masterUnlocked ? ' is-unlocked' : ''}`} aria-labelledby="ach-master-title">
      <div className="ach-master-badge">
        <AchievementIcon kind="protector" />
      </div>
      <div className="ach-master-copy">
        <span className={`ach-state-pill ${masterUnlocked ? 'is-ok' : 'is-pending'}`}>{masterUnlocked ? 'DESBLOQUEADO ✓' : `${completed.length} / 5 RETOS`}</span>
        <h2 id="ach-master-title">{master.title}</h2>
        <p>{master.description} <strong>Requisito:</strong> {master.criterion}</p>
      </div>
      {masterUnlocked
        ? <button type="button" className="button" onClick={() => setShowCelebration(true)}>Ver diploma y celebración<span aria-hidden="true">↗</span></button>
        : <Link className="button button-light" to="/minijuegos">Completar ruta<span aria-hidden="true">→</span></Link>}
    </section>

    <section className="ach-grid" aria-label="Logros por minijuego">
      {stageAchievements.map(ach => {
        const unlocked = isAchievementUnlocked(ach.id, unlocks, completed)
        const best = ach.worldId ? getBestScore(ach.worldId) : 0
        return <article
          key={ach.id}
          className={`ach-card ${unlocked ? 'is-unlocked' : 'is-locked'}`}
          style={{ '--ach-accent': ach.accent } as React.CSSProperties}
        >
          <header className="ach-card-head">
            <div className="ach-card-icon">
              <AchievementIcon kind={ach.id} />
            </div>
            <div>
              <div className="ach-card-meta">
                <span>{ach.order} · {ach.theme}</span>
                <span className={`ach-state-pill ${unlocked ? 'is-ok' : 'is-pending'}`}>
                  {unlocked ? 'DESBLOQUEADO ✓' : 'PENDIENTE'}
                </span>
              </div>
              <h3>{ach.title}</h3>
            </div>
          </header>

          <p className="ach-card-desc">{ach.description}</p>
          <p className="ach-card-rule"><strong>{ach.gameTitle}:</strong> {ach.criterion}</p>

          <footer className="ach-card-foot">
            <span className="ach-card-record">
              {best > 0 ? `Récord personal: ${best} pts` : 'Sin récord aún'}
            </span>
            {ach.worldId && (
              <Link className="ach-card-link" to={gameRoute(ach.worldId)}>
                {unlocked ? 'Superar récord ↗' : 'Jugar reto ↗'}
              </Link>
            )}
          </footer>
        </article>
      })}
    </section>

    <ProtectorCelebration
      open={showCelebration}
      onClose={() => setShowCelebration(false)}
      onRestart={handleRestart}
    />
  </div>
}
