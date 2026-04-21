import { getPool, getWeight, getWeightDotColor } from '../utils/noteUtils'

export function WeightBar({ clef, level, weights }) {
  const pool = getPool(clef, level)

  return (
    <div className="weight-bar">
      <span className="weight-label">Domínio por nota</span>
      <div className="weight-hints">
        {pool.map((item, i) => {
          const note = item.notes ? item.notes[0] : item
          const w = getWeight(note, weights)
          const color = getWeightDotColor(w)
          const label = item.notes
            ? item.label
            : `${note.name}${note.acc === '#' ? '♯' : note.acc === 'b' ? '♭' : ''} · peso ${w.toFixed(1)}`
          return (
            <span
              key={i}
              className="w-dot"
              style={{ background: color }}
              title={label}
            />
          )
        })}
      </div>
      <span className="weight-legend">
        <span style={{ color: 'var(--correct)' }}>●</span> dominada{'   '}
        <span style={{ color: 'var(--wrong)' }}>●</span> precisa praticar
      </span>
    </div>
  )
}
