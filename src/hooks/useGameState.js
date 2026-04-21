import { useState, useEffect, useRef, useCallback } from 'react'
import {
  noteKey, triadKey, getPool, isTriadMode,
  weightedRandom, updateWeight, getMedal, noteName,
} from '../utils/noteUtils'

const INITIAL_STATE = {
  clef: 'treble',
  level: 'basic',
  correct: 0,
  total: 0,
  streak: 0,
  currentNote: null,
  waiting: false,
  selectedAcc: '',
  weights: {},
  solfejo: false,
  showPiano: false,
  currentTriad: null,
  triadNoteIndex: 0,
  flashCard: null,
  feedback: { msg: '', type: '' },
  answeredNote: null,
  noteKey: 0,
  timerMode: false,
  timerDuration: 30,
  timerCount: 0,
  timerCorrect: 0,
  timerEnd: null,
  timerPhase: 'idle',
  countdownNum: 3,
  timerResult: null,
}

// Pure function — no side effects, just computes next note fields from state
function computeNext(s) {
  if (isTriadMode(s.level)) {
    const pool = getPool(s.clef, s.level)
    let triad, tries = 0
    do {
      triad = weightedRandom(pool, s.weights)
      tries++
    } while (tries < 10 && s.currentTriad && triadKey(triad) === triadKey(s.currentTriad))
    const feedbackMsg = s.level === 'inter' ? 'Identifique a nota 1 de 3' : ''
    const feedbackType = s.level === 'inter' ? 'hint' : ''
    return {
      currentTriad: triad,
      triadNoteIndex: 0,
      currentNote: triad.notes[0],
      feedback: { msg: feedbackMsg, type: feedbackType },
    }
  } else {
    const pool = getPool(s.clef, s.level)
    let note, tries = 0
    do {
      note = weightedRandom(pool, s.weights)
      tries++
    } while (tries < 10 && s.currentNote && noteKey(note) === noteKey(s.currentNote))
    return { currentNote: note, currentTriad: null, feedback: { msg: '', type: '' } }
  }
}

function accLabel(acc) {
  return acc === '#' ? '♯' : acc === 'b' ? '♭' : ''
}

export function useGameState() {
  const [state, setState] = useState(INITIAL_STATE)
  const timerTimeoutRef = useRef(null)
  const countdownTimeoutRef = useRef(null)

  // ── Advance to next note ───────────────────────────────────────────────────
  // Clean: setState updater is pure, computeNext does the calculation

  const advanceNote = useCallback(() => {
    setState((s) => ({
      ...s,
      ...computeNext(s),
      waiting: false,
      flashCard: null,
      selectedAcc: '',
      answeredNote: null,
      noteKey: s.noteKey + 1,
    }))
  }, [])

  // ── Answer submission ──────────────────────────────────────────────────────

  const submitAnswer = useCallback((name) => {
    setState((s) => {
      if (s.waiting) return s

      if (s.level === 'adv') {
        const ct = s.currentTriad
        const correct = name === triadKey(ct)
        const newWeights = updateWeight(ct.notes[0], correct, s.weights)
        const feedback = correct
          ? { msg: '✓ Correto!', type: 'correct' }
          : { msg: `✗ Era ${ct.label}`, type: 'wrong' }
        return {
          ...s,
          total: s.total + 1,
          correct: correct ? s.correct + 1 : s.correct,
          streak: correct ? s.streak + 1 : 0,
          weights: newWeights,
          waiting: true,
          flashCard: correct ? 'correct' : 'wrong',
          feedback,
          answeredNote: name,
          timerCount: s.timerMode ? s.timerCount + 1 : s.timerCount,
          timerCorrect: s.timerMode && correct ? s.timerCorrect + 1 : s.timerCorrect,
        }
      }

      if (s.level === 'inter') {
        const ct = s.currentTriad
        const targetNote = ct.notes[s.triadNoteIndex]
        const correct = name === targetNote.name && s.selectedAcc === targetNote.acc
        const newWeights = updateWeight(targetNote, correct, s.weights)
        const al = accLabel(targetNote.acc)

        if (correct && s.triadNoteIndex < 2) {
          const nextIdx = s.triadNoteIndex + 1
          return {
            ...s,
            total: s.total + 1,
            correct: s.correct + 1,
            streak: s.streak + 1,
            weights: newWeights,
            waiting: true,
            flashCard: 'correct',
            feedback: { msg: `✓ Nota ${s.triadNoteIndex + 1}! Agora a nota ${nextIdx + 1} de 3`, type: 'correct' },
            answeredNote: name,
            // triadNoteIndex advances in the timeout below, not here
            timerCount: s.timerMode ? s.timerCount + 1 : s.timerCount,
            timerCorrect: s.timerMode ? s.timerCorrect + 1 : s.timerCorrect,
            _pendingTriadIdx: nextIdx,
          }
        }

        const feedback = correct
          ? { msg: '✓ Tríade completa!', type: 'correct' }
          : { msg: `✗ Era ${noteName(targetNote.name, s.solfejo)}${al}`, type: 'wrong' }
        return {
          ...s,
          total: s.total + 1,
          correct: correct ? s.correct + 1 : s.correct,
          streak: correct ? s.streak + 1 : 0,
          weights: newWeights,
          waiting: true,
          flashCard: correct ? 'correct' : 'wrong',
          feedback,
          answeredNote: name,
          timerCount: s.timerMode ? s.timerCount + 1 : s.timerCount,
          timerCorrect: s.timerMode && correct ? s.timerCorrect + 1 : s.timerCorrect,
        }
      }

      // Basic mode
      const cn = s.currentNote
      const correct = name === cn.name && s.selectedAcc === cn.acc
      const newWeights = updateWeight(cn, correct, s.weights)
      const al = accLabel(cn.acc)
      const feedback = correct
        ? { msg: '✓ Correto!', type: 'correct' }
        : { msg: `✗ Era ${noteName(cn.name, s.solfejo)}${al}`, type: 'wrong' }
      return {
        ...s,
        total: s.total + 1,
        correct: correct ? s.correct + 1 : s.correct,
        streak: correct ? s.streak + 1 : 0,
        weights: newWeights,
        waiting: true,
        flashCard: correct ? 'correct' : 'wrong',
        feedback,
        answeredNote: name,
        timerCount: s.timerMode ? s.timerCount + 1 : s.timerCount,
        timerCorrect: s.timerMode && correct ? s.timerCorrect + 1 : s.timerCorrect,
      }
    })
  }, [])

  // ── Piano answer ──────────────────────────────────────────────────────────

  const submitPianoAnswer = useCallback((name, acc, oct) => {
    setState((s) => {
      if (s.waiting) return s
      const cn = s.currentNote
      const correct = name === cn.name && acc === cn.acc
      const newWeights = updateWeight(cn, correct, s.weights)
      const al = accLabel(cn.acc)
      const feedback = correct
        ? { msg: '✓ Correto!', type: 'correct' }
        : { msg: `✗ Era ${noteName(cn.name, s.solfejo)}${al}`, type: 'wrong' }
      return {
        ...s,
        total: s.total + 1,
        correct: correct ? s.correct + 1 : s.correct,
        streak: correct ? s.streak + 1 : 0,
        weights: newWeights,
        waiting: true,
        flashCard: correct ? 'correct' : 'wrong',
        feedback,
        answeredNote: name,
        timerCount: s.timerMode ? s.timerCount + 1 : s.timerCount,
        timerCorrect: s.timerMode && correct ? s.timerCorrect + 1 : s.timerCorrect,
      }
    })
  }, [])

  // ── Settings ───────────────────────────────────────────────────────────────

  const toggleClef = useCallback((clef) => {
    setState((s) => ({ ...s, clef }))
    setTimeout(advanceNote, 0)
  }, [advanceNote])

  const toggleLevel = useCallback((level) => {
    setState((s) => ({ ...s, level, selectedAcc: '' }))
    setTimeout(advanceNote, 0)
  }, [advanceNote])

  const toggleSolfejo = useCallback(() => {
    setState((s) => ({ ...s, solfejo: !s.solfejo }))
  }, [])

  const togglePiano = useCallback(() => {
    setState((s) => ({ ...s, showPiano: !s.showPiano }))
  }, [])

  const toggleAcc = useCallback((acc) => {
    setState((s) => ({ ...s, selectedAcc: acc }))
  }, [])

  const resetScore = useCallback(() => {
    setState((s) => ({ ...s, correct: 0, total: 0, streak: 0, weights: {} }))
  }, [])

  // ── Timer ─────────────────────────────────────────────────────────────────

  const finishTimerRound = useCallback(() => {
    clearTimeout(timerTimeoutRef.current)
    setState((s) => {
      const pct = s.timerCount > 0 ? Math.round(s.timerCorrect / s.timerCount * 100) : 0
      const speed = (s.timerCorrect / s.timerDuration * 60).toFixed(1)
      return {
        ...s,
        timerMode: false,
        timerPhase: 'result',
        timerResult: {
          duration: s.timerDuration,
          correct: s.timerCorrect,
          pct,
          speed,
          medal: getMedal(s.timerCorrect),
        },
      }
    })
  }, [])

  const startTimerRound = useCallback((duration) => {
    clearTimeout(timerTimeoutRef.current)
    clearTimeout(countdownTimeoutRef.current)
    setState((s) => ({
      ...s,
      timerMode: false,
      timerDuration: duration,
      timerPhase: 'prompt',
      timerResult: null,
    }))
  }, [])

  const beginTimerRound = useCallback(() => {
    setState((s) => ({ ...s, timerPhase: 'countdown', countdownNum: 3 }))

    let current = 3
    const tick = () => {
      current--
      if (current < 0) {
        setState((s) => ({ ...s, countdownNum: 0 }))
        countdownTimeoutRef.current = setTimeout(() => {
          let duration = 30
          setState((s) => {
            duration = s.timerDuration
            return {
              ...s,
              timerMode: true,
              timerCount: 0,
              timerCorrect: 0,
              timerEnd: Date.now() + s.timerDuration * 1000,
              timerPhase: 'running',
            }
          })
          clearTimeout(timerTimeoutRef.current)
          timerTimeoutRef.current = setTimeout(finishTimerRound, duration * 1000)
          advanceNote()
        }, 600)
        return
      }
      setState((s) => ({ ...s, countdownNum: current }))
      countdownTimeoutRef.current = setTimeout(tick, 900)
    }
    countdownTimeoutRef.current = setTimeout(tick, 900)
  }, [advanceNote, finishTimerRound])

  const stopTimerMode = useCallback(() => {
    clearTimeout(timerTimeoutRef.current)
    clearTimeout(countdownTimeoutRef.current)
    setState((s) => ({ ...s, timerMode: false, timerPhase: 'idle', timerResult: null }))
    advanceNote()
  }, [advanceNote])

  // ── Side effects triggered by waiting state ───────────────────────────────
  // All "advance after delay" logic lives here, outside of setState callbacks

  useEffect(() => {
    if (!state.waiting) return

    // Inter mode: mid-triad advance (triad not yet complete)
    if (state._pendingTriadIdx !== undefined) {
      const nextIdx = state._pendingTriadIdx
      const ct = state.currentTriad
      const id = setTimeout(() => {
        setState((s) => ({
          ...s,
          triadNoteIndex: nextIdx,
          currentNote: ct.notes[nextIdx],
          waiting: false,
          selectedAcc: '',
          flashCard: null,
          feedback: { msg: `Identifique a nota ${nextIdx + 1} de 3`, type: 'hint' },
          noteKey: s.noteKey + 1,
          answeredNote: null,
          _pendingTriadIdx: undefined,
        }))
      }, 700)
      return () => clearTimeout(id)
    }

    // All other waiting states: advance to next note after 900ms
    const id = setTimeout(advanceNote, 900)
    return () => clearTimeout(id)
  }, [state.waiting, state.noteKey]) // noteKey changes each advance, so effect re-runs correctly

  // ── Keyboard shortcuts ─────────────────────────────────────────────────────

  useEffect(() => {
    const handler = (e) => {
      const key = e.key.toUpperCase()
      if (['A', 'B', 'C', 'D', 'E', 'F', 'G'].includes(key)) {
        submitAnswer(key)
        return
      }
      if (e.key === '#') { setState((s) => ({ ...s, selectedAcc: '#' })); return }
      if (e.key === 'b' && !e.shiftKey) { setState((s) => ({ ...s, selectedAcc: 'b' })); return }
      if (e.key === 'n' || e.key === 'N') setState((s) => ({ ...s, selectedAcc: '' }))
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [submitAnswer])

  // ── Bootstrap ─────────────────────────────────────────────────────────────

  useEffect(() => {
    advanceNote()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    return () => {
      clearTimeout(timerTimeoutRef.current)
      clearTimeout(countdownTimeoutRef.current)
    }
  }, [])

  return {
    state,
    actions: {
      submitAnswer,
      submitPianoAnswer,
      toggleClef,
      toggleLevel,
      toggleSolfejo,
      togglePiano,
      toggleAcc,
      resetScore,
      startTimerRound,
      beginTimerRound,
      stopTimerMode,
    },
  }
}
