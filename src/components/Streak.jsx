export function Streak({ streak }) {
  return (
    <div className="streak">
      <span className="streak-fire">🔥</span>
      <span>Sequência:</span>
      <span className="streak-val">{streak}</span>
    </div>
  )
}
