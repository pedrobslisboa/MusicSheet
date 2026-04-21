import { Staff } from './Staff'
import { Piano } from './Piano'
import { AnswerGrid } from './AnswerGrid'
import { AccidentalRow } from './AccidentalRow'
import { Feedback } from './Feedback'
import { TimerHUD } from './TimerHUD'
import { TimerCountdown } from './TimerCountdown'
import { TimerStartPrompt } from './TimerStartPrompt'
import { TimerResult } from './TimerResult'

export function GameCard({
  clef, level, solfejo, showPiano,
  currentNote, currentTriad, triadNoteIndex,
  waiting, selectedAcc, answeredNote,
  feedback, flashCard, animKey,
  timerPhase, timerDuration, timerEnd,
  timerCorrect, timerCount, timerResult,
  countdownNum,
  actions,
}) {
  const cardClass = [
    'card',
    flashCard === 'correct' ? 'flash-correct' : '',
    flashCard === 'wrong' ? 'flash-wrong' : '',
  ].filter(Boolean).join(' ')

  const isRunning = timerPhase === 'running'
  const isIdle = timerPhase === 'idle'
  const showGameArea = isIdle || isRunning

  const showPianoInput = showPiano && showGameArea && currentNote
  const showAnswerGrid = showGameArea && !showPiano
  const showAccidentals = level === 'inter' && showGameArea

  return (
    <div className={cardClass}>
      <span className="clef-label">
        {clef === 'treble' ? 'Clave de Sol' : 'Clave de Fá'}
      </span>

      {timerPhase === 'countdown' && <TimerCountdown num={countdownNum} />}

      {timerPhase === 'prompt' && (
        <TimerStartPrompt
          duration={timerDuration}
          onBegin={actions.beginTimerRound}
        />
      )}

      {isRunning && (
        <TimerHUD
          timerEnd={timerEnd}
          timerDuration={timerDuration}
          timerCorrect={timerCorrect}
          timerCount={timerCount}
        />
      )}

      {showGameArea && (
        <Staff
          clef={clef}
          note={currentTriad ? null : currentNote}
          triad={currentTriad ?? null}
          highlightIndex={currentTriad && level === 'inter' ? triadNoteIndex : -1}
          animKey={animKey}
        />
      )}

      {showGameArea && <Feedback msg={feedback.msg} type={feedback.type} />}

      {showPianoInput && (
        <Piano
          clef={clef}
          currentNote={currentNote}
          waiting={waiting}
          onAnswer={actions.submitPianoAnswer}
        />
      )}

      {showAccidentals && (
        <AccidentalRow
          selectedAcc={selectedAcc}
          onToggle={actions.toggleAcc}
        />
      )}

      {showAnswerGrid && (
        <AnswerGrid
          level={level}
          clef={clef}
          solfejo={solfejo}
          waiting={waiting}
          answeredNote={answeredNote}
          currentNote={currentNote}
          currentTriad={currentTriad}
          onAnswer={actions.submitAnswer}
        />
      )}


      {timerPhase === 'result' && (
        <TimerResult
          result={timerResult}
          onRepeat={() => actions.startTimerRound(timerDuration)}
          onFreeMode={actions.stopTimerMode}
        />
      )}
    </div>
  )
}
