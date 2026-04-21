export function StatsBar({ correct, total }) {
  const pct = total > 0 ? Math.round((correct / total) * 100) + '%' : '—'

  return (
    <div className="stats-bar">
      <div className="stat">
        <div className="stat-value">{correct}</div>
        <div className="stat-label">Certas</div>
      </div>
      <div className="stat">
        <div className="stat-value">{total}</div>
        <div className="stat-label">Total</div>
      </div>
      <div className="stat">
        <div className="stat-value">{pct}</div>
        <div className="stat-label">Acerto</div>
      </div>
    </div>
  )
}
