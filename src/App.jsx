import { useGameState } from './hooks/useGameState'
import { Header } from './components/Header'
import { StatsBar } from './components/StatsBar'
import { WeightBar } from './components/WeightBar'
import { ProgressBar } from './components/ProgressBar'
import { GameCard } from './components/GameCard'
import { Streak } from './components/Streak'
import { Settings } from './components/Settings'
import { TimerSection } from './components/TimerSection'

export function App() {
  const { state: s, actions } = useGameState()

  return (
    <>
      <Header />

      <StatsBar correct={s.correct} total={s.total} />

      <WeightBar clef={s.clef} level={s.level} weights={s.weights} />

      <ProgressBar correct={s.correct} total={s.total} />

      <GameCard
        clef={s.clef}
        level={s.level}
        solfejo={s.solfejo}
        showPiano={s.showPiano}
        currentNote={s.currentNote}
        currentTriad={s.currentTriad}
        triadNoteIndex={s.triadNoteIndex}
        waiting={s.waiting}
        selectedAcc={s.selectedAcc}
        answeredNote={s.answeredNote}
        feedback={s.feedback}
        flashCard={s.flashCard}
        animKey={s.noteKey}
        timerPhase={s.timerPhase}
        timerDuration={s.timerDuration}
        timerEnd={s.timerEnd}
        timerCorrect={s.timerCorrect}
        timerCount={s.timerCount}
        timerResult={s.timerResult}
        countdownNum={s.countdownNum}
        actions={actions}
      />

      <Streak streak={s.streak} />

      <Settings
        clef={s.clef}
        level={s.level}
        solfejo={s.solfejo}
        showPiano={s.showPiano}
        onClef={actions.toggleClef}
        onLevel={actions.toggleLevel}
        onSolfejo={actions.toggleSolfejo}
        onPiano={actions.togglePiano}
        onReset={actions.resetScore}
      />

      <TimerSection
        timerDuration={s.timerDuration}
        timerPhase={s.timerPhase}
        onStart={actions.startTimerRound}
      />
    </>
  )
}
