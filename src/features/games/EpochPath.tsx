import { Link } from 'react-router'
import { gameEpochs } from './epochs'
import { isEpochUnlocked, useCompletedEpochs } from './progress'
import { gameRoute, type WorldId } from './worldLinks'

type Props = {
  /** Selected world, if any. */
  current?: WorldId | null
  /** When provided the rail works as a local selector; otherwise each stage is a route. */
  onSelect?: (id: WorldId) => void
  label?: string
}

export function EpochPath({ current = null, onSelect, label = 'Ruta de las cinco etapas' }: Props) {
  const completed = useCompletedEpochs()

  return <ol className="epoch-path" aria-label={label}>
    {gameEpochs.map(epoch => {
      const isDone = completed.includes(epoch.id)
      const isOpen = isEpochUnlocked(epoch.id, completed)
      const state = isDone ? 'Completada' : isOpen ? 'Disponible' : 'Bloqueada'
      const statusText = isDone ? 'Completada' : isOpen ? 'Disponible' : 'Se abre al completar la etapa anterior'
      const isCurrent = current === epoch.id
      const card = <>
        <span className="epoch-card-top">
          <span className="epoch-card-number">{String(epoch.index + 1).padStart(2, '0')}</span>
          <span className="epoch-card-range">{epoch.range}</span>
        </span>
        <strong>{epoch.title}</strong>
        <span className="epoch-card-focus">{epoch.focus}</span>
        <span className="epoch-card-state" data-state={isDone ? 'done' : isOpen ? 'open' : 'locked'}>
          <span className="epoch-state-dot" aria-hidden="true" />{state}
        </span>
      </>

      return <li key={epoch.id} className={`epoch-card${isDone ? ' is-completed' : ''}${isOpen ? '' : ' is-locked'}${isCurrent ? ' is-current' : ''}`}>
        {onSelect
          ? <button type="button" className="epoch-card-action" data-sfx={isOpen ? 'open' : 'click'} aria-current={isCurrent ? 'step' : undefined} aria-label={`${epoch.range}. ${epoch.title}. ${statusText}.`} onClick={() => onSelect(epoch.id)}>{card}</button>
          : <Link to={gameRoute(epoch.id)} className="epoch-card-action" data-sfx={isOpen ? 'open' : 'click'} aria-current={isCurrent ? 'step' : undefined} aria-label={`${epoch.range}. ${epoch.title}. ${statusText}.`}>{card}</Link>}
      </li>
    })}
  </ol>
}
