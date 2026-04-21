export function TimerResult({ result, timerDuration, onRepeat, onFreeMode }) {
  if (!result) return null
  return (
    <div className="timer-result">
      <div className="res-medal">{result.medal}</div>
      <div className="res-grid">
        <div className="res-item">
          <div className="res-val">{result.duration}s</div>
          <div className="res-lbl">Duração</div>
        </div>
        <div className="res-item">
          <div className="res-val">{result.correct} certas</div>
          <div className="res-lbl">Acertos</div>
        </div>
        <div className="res-item">
          <div className="res-val">{result.pct}%</div>
          <div className="res-lbl">Precisão</div>
        </div>
        <div className="res-item">
          <div className="res-val">{result.speed} n/min</div>
          <div className="res-lbl">Velocidade</div>
        </div>
      </div>
      <div className="res-actions">
        <button className="res-btn primary" onClick={onRepeat}>↺ Repetir</button>
        <button className="res-btn" onClick={onFreeMode}>← Modo livre</button>
      </div>
    </div>
  )
}
