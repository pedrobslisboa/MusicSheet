import { stepToY } from '../utils/noteUtils'

const STAFF_LINES = [0, 1, 2, 3, 4]

function getLedgerLines(ny, xMid = 240, halfW = 24) {
  const lines = []
  if (ny > 98) {
    for (let ly = 110; ly <= ny + 1; ly += 14) {
      lines.push({ y: ly })
    }
  }
  if (ny < 38) {
    for (let ly = 26; ly >= ny - 1; ly -= 14) {
      lines.push({ y: ly })
    }
  }
  return lines.map((l) => ({ ...l, x1: xMid - halfW, x2: xMid + halfW }))
}

function TrebleClef({ staffTop, lineGap }) {
  return (
    <text
      x={18}
      y={staffTop + 4.5 * lineGap + 2}
      fontSize="80px"
      fill="#5a5040"
      fontFamily="Georgia, serif"
      dominantBaseline="auto"
    >
      𝄞
    </text>
  )
}

function BassClef({ staffTop, lineGap }) {
  return (
    <text
      x={26}
      y={staffTop + 2.5 * lineGap + 2}
      fontSize="44px"
      fill="#5a5040"
      fontFamily="Georgia, serif"
    >
      𝄢
    </text>
  )
}

function NoteHead({ ny, animKey }) {
  const stemDir = ny < 68 ? -1 : 1
  const stemX = stemDir === 1 ? 247 : 233

  return (
    <g className="note-group" key={animKey}>
      <ellipse
        cx={240}
        cy={ny}
        rx={8}
        ry={6}
        className="note-head"
        transform={`rotate(-15, 240, ${ny})`}
      />
      <line
        x1={stemX} y1={ny}
        x2={stemX} y2={ny + stemDir * 40}
        className="note-stem"
      />
    </g>
  )
}

function TriadNotes({ triad, highlightIndex, clef, animKey }) {
  const notes = triad.notes
  const rootY = stepToY(notes[0].step, clef)
  const fifthY = stepToY(notes[2].step, clef)
  const avgStep = (notes[0].step + notes[2].step) / 2
  const stemDir = avgStep >= 6 ? -1 : 1
  const stemX = stemDir === 1 ? 247 : 233

  return (
    <g className="note-group" key={animKey}>
      {notes.map((note, i) => {
        const ny = stepToY(note.step, clef)
        const isHighlight = i === highlightIndex
        const color = isHighlight ? '#e8c97a' : '#c9a84c'
        const opacity = highlightIndex >= 0 && !isHighlight ? 0.35 : 1
        return (
          <ellipse
            key={i}
            cx={240}
            cy={ny}
            rx={8}
            ry={6}
            fill={color}
            opacity={opacity}
            transform={`rotate(-15, 240, ${ny})`}
          />
        )
      })}
      <line
        x1={stemX} y1={rootY}
        x2={stemX} y2={stemDir === 1 ? rootY + 40 : fifthY - 40}
        className="note-stem"
      />
    </g>
  )
}

export function Staff({ clef, note, triad, highlightIndex = -1, animKey }) {
  const staffTop = 40
  const lineGap = 14

  const noteForLedger = note ?? (triad ? triad.notes : null)
  const notes = triad ? triad.notes : note ? [note] : []
  const ledgerXHalf = triad ? 28 : 24

  const allLedgerLines = notes.flatMap((n) => {
    const ny = stepToY(n.step, clef)
    return getLedgerLines(ny, 240, ledgerXHalf)
  })

  // deduplicate ledger lines by y
  const seenY = new Set()
  const uniqueLedgers = allLedgerLines.filter((l) => {
    if (seenY.has(l.y)) return false
    seenY.add(l.y)
    return true
  })

  return (
    <div className="staff-container">
      <svg
        viewBox="0 0 420 160"
        width={420}
        height={160}
        className="staff-svg"
        overflow="visible"
      >
        {STAFF_LINES.map((i) => (
          <line
            key={i}
            x1={50} y1={staffTop + i * lineGap}
            x2={400} y2={staffTop + i * lineGap}
            className="staff-line"
          />
        ))}

        {clef === 'treble'
          ? <TrebleClef staffTop={staffTop} lineGap={lineGap} />
          : <BassClef staffTop={staffTop} lineGap={lineGap} />
        }

        {uniqueLedgers.map((l, i) => (
          <line key={i} x1={l.x1} y1={l.y} x2={l.x2} y2={l.y} className="ledger-line" />
        ))}

        {note && !triad && (
          <NoteHead ny={stepToY(note.step, clef)} animKey={animKey} />
        )}
        {triad && (
          <TriadNotes triad={triad} highlightIndex={highlightIndex} clef={clef} animKey={animKey} />
        )}
      </svg>
    </div>
  )
}
