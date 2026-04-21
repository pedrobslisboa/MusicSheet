export function Settings({ clef, level, solfejo, showPiano, onClef, onLevel, onSolfejo, onPiano, onReset }) {
  return (
    <div className="settings">
      <button
        className={`setting-btn${clef === 'treble' ? ' active' : ''}`}
        onClick={() => onClef('treble')}
      >
        Clave de Sol
      </button>
      <button
        className={`setting-btn${clef === 'bass' ? ' active' : ''}`}
        onClick={() => onClef('bass')}
      >
        Clave de Fá
      </button>
      <button
        className={`setting-btn${level === 'basic' ? ' active' : ''}`}
        onClick={() => onLevel('basic')}
      >
        Iniciante
      </button>
      <button
        className={`setting-btn${level === 'inter' ? ' active' : ''}`}
        onClick={() => onLevel('inter')}
      >
        Intermediário
      </button>
      <button
        className={`setting-btn${level === 'adv' ? ' active' : ''}`}
        onClick={() => onLevel('adv')}
      >
        Avançado
      </button>
      <button
        className={`setting-btn${solfejo ? ' active' : ''}`}
        onClick={onSolfejo}
      >
        🎼 {solfejo ? 'Solfejo: On' : 'Solfejo'}
      </button>
      <button className="setting-btn" onClick={onReset}>
        ↺ Reset Score
      </button>
      <button
        className={`setting-btn${showPiano ? ' active' : ''}`}
        onClick={onPiano}
      >
        🎹 {showPiano ? 'Piano: On' : 'Piano'}
      </button>
    </div>
  )
}
