export function ProgressBar({ correct, total }) {
  const pct = total > 0 ? (correct / total) * 100 : 0

  return (
    <div className="progress-bar-wrap">
      <div className="progress-bar" style={{ width: `${pct}%` }} />
    </div>
  )
}
