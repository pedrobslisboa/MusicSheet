const DURATIONS = [30, 60, 90]

export function TimerSection({ timerDuration, timerPhase, onStart }) {
  return (
    <div className="timer-bar">
      <span className="weight-label">⏱ Modo Timer · acerte o máximo no tempo</span>
      <div className="timer-goals">
        {DURATIONS.map((d) => (
          <button
            key={d}
            className={`setting-btn${timerPhase !== 'idle' && timerDuration === d ? ' active' : ''}`}
            onClick={() => onStart(d)}
          >
            {d}s
          </button>
        ))}
      </div>
    </div>
  )
}
