export function TimerCountdown({ num }) {
  return (
    <div className="timer-countdown">
      <div className="countdown-label">prepare-se</div>
      <div className="countdown-num countdown-pop">
        {num === 0 ? 'GO!' : num}
      </div>
    </div>
  )
}
