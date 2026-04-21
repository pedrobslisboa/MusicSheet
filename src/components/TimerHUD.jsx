import { useState, useEffect } from 'react'

export function TimerHUD({ timerEnd, timerDuration, timerCorrect, timerCount }) {
  const [, tick] = useState(0)

  useEffect(() => {
    const id = setInterval(() => tick((n) => n + 1), 100)
    return () => clearInterval(id)
  }, [])

  const remaining = Math.max(0, (timerEnd - Date.now()) / 1000)
  const pct = (timerDuration - remaining) / timerDuration
  const isLow = remaining <= 10
  const barColor = isLow
    ? 'linear-gradient(90deg, #c45f4a, #e07060)'
    : 'linear-gradient(90deg, var(--accent), var(--accent2))'

  return (
    <div className="timer-hud">
      <span className="timer-elapsed">{Math.ceil(remaining)}s</span>
      <div className="timer-prog-wrap">
        <div
          className="timer-prog-fill"
          style={{ width: `${pct * 100}%`, background: barColor }}
        />
      </div>
      <span className="timer-remaining">
        {timerCorrect} certas · {timerCount} total
      </span>
    </div>
  )
}
