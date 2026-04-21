export function AccidentalRow({ selectedAcc, onToggle }) {
  return (
    <div className="accidental-row">
      <button
        className={`acc-btn${selectedAcc === 'b' ? ' active' : ''}`}
        onClick={() => onToggle('b')}
      >
        ♭ Bemol
      </button>
      <button
        className={`acc-btn${selectedAcc === '' ? ' active' : ''}`}
        onClick={() => onToggle('')}
      >
        ♮ Natural
      </button>
      <button
        className={`acc-btn${selectedAcc === '#' ? ' active' : ''}`}
        onClick={() => onToggle('#')}
      >
        ♯ Sustenido
      </button>
    </div>
  )
}
