export function TimerStartPrompt({ duration, onBegin }) {
  return (
    <div className="timer-start-prompt">
      <div className="tsp-duration">{duration}s</div>
      <div className="tsp-label">acerte o máximo de notas</div>
      <button className="tsp-btn" onClick={onBegin}>▶ Iniciar</button>
    </div>
  )
}
