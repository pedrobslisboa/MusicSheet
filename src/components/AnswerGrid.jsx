import { noteName, triadKey, getUniqueTriads } from '../utils/noteUtils'
import { TREBLE_TRIADS, BASS_TRIADS } from '../data/triads'

const NOTE_LETTERS = ['C', 'D', 'E', 'F', 'G', 'A', 'B']

export function AnswerGrid({ level, clef, solfejo, waiting, answeredNote, currentNote, currentTriad, onAnswer }) {
  if (level === 'adv') {
    const triads = clef === 'treble' ? TREBLE_TRIADS : BASS_TRIADS
    const unique = getUniqueTriads(triads)
    const correctKey = currentTriad ? triadKey(currentTriad) : null

    return (
      <div className="answer-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
        {unique.map((t) => {
          const key = triadKey(t)
          const isCorrect = waiting && key === correctKey
          const isWrong = waiting && key === answeredNote && key !== correctKey
          return (
            <button
              key={key}
              className={`answer-btn chord-btn${isCorrect ? ' correct' : ''}${isWrong ? ' wrong' : ''}`}
              disabled={waiting}
              onClick={() => onAnswer(key)}
            >
              {t.label}
            </button>
          )
        })}
      </div>
    )
  }

  const correctLetter = currentNote?.name ?? null

  return (
    <div className="answer-grid">
      {NOTE_LETTERS.map((letter) => {
        const isCorrect = waiting && letter === correctLetter
        const isWrong = waiting && letter === answeredNote && letter !== correctLetter
        return (
          <button
            key={letter}
            className={`answer-btn${solfejo ? ' solfejo' : ''}${isCorrect ? ' correct' : ''}${isWrong ? ' wrong' : ''}`}
            disabled={waiting}
            onClick={() => onAnswer(letter)}
          >
            {noteName(letter, solfejo)}
          </button>
        )
      })}
    </div>
  )
}
