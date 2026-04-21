import { WHITE_PATTERN, BLACK_OFFSETS, noteToMidi } from '../utils/noteUtils'

export function Piano({ clef, currentNote, waiting, onAnswer }) {
  const startOctave = clef === 'treble' ? 4 : 2
  const endOctave = startOctave + 1
  const totalWhite = 14
  const viewW = totalWhite * 26
  const ww = viewW / totalWhite
  const wh = 80
  const bw = ww * 0.6
  const bh = wh * 0.62

  const targetMidi = currentNote
    ? noteToMidi(currentNote.name, currentNote.acc, currentNote.octave)
    : null

  const whiteKeys = []
  let wIdx = 0
  for (let oct = startOctave; oct <= endOctave; oct++) {
    for (const name of WHITE_PATTERN) {
      const midi = noteToMidi(name, '', oct)
      const isTarget = waiting && midi === targetMidi
      whiteKeys.push({
        x: wIdx * ww,
        midi,
        name,
        oct,
        fill: isTarget
          ? (targetMidi === noteToMidi(currentNote.name, currentNote.acc, currentNote.octave) ? '#e8c97a' : '#e8e0d0')
          : '#e8e0d0',
      })
      wIdx++
    }
  }

  const blackKeys = []
  for (let oct = startOctave; oct <= endOctave; oct++) {
    for (const [key, offset] of Object.entries(BLACK_OFFSETS)) {
      const kName = key[0]
      const midi = noteToMidi(kName, '#', oct)
      const x = ((oct - startOctave) * 7 + offset) * ww
      blackKeys.push({ x, midi, name: kName, acc: '#', oct, fill: '#1a1510' })
    }
  }

  const handleWhiteClick = (name, oct) => {
    if (!waiting) onAnswer(name, '', oct)
  }

  const handleBlackClick = (name, oct, e) => {
    e.stopPropagation()
    if (!waiting) onAnswer(name, '#', oct)
  }

  return (
    <div className="piano-wrap">
      <svg
        viewBox={`0 0 ${viewW} ${wh}`}
        width="100%"
        preserveAspectRatio="xMidYMid meet"
      >
        {whiteKeys.map((k, i) => (
          <rect
            key={i}
            x={k.x + 0.8}
            y={0}
            width={ww - 1.6}
            height={wh}
            rx={2}
            fill={k.fill}
            stroke="#3a3228"
            strokeWidth={1}
            style={{ cursor: waiting ? 'default' : 'pointer' }}
            onClick={() => handleWhiteClick(k.name, k.oct)}
          />
        ))}
        {blackKeys.map((k, i) => (
          <rect
            key={i}
            x={k.x}
            y={0}
            width={bw}
            height={bh}
            rx={2}
            fill={k.fill}
            stroke="#0a0806"
            strokeWidth={1}
            style={{ cursor: waiting ? 'default' : 'pointer' }}
            onClick={(e) => handleBlackClick(k.name, k.oct, e)}
          />
        ))}
      </svg>
    </div>
  )
}
