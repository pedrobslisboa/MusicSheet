import { useState, useEffect, useRef, useCallback } from 'react'
import {
  noteKey, triadKey, getPool, isTriadMode,
  weightedRandom, updateWeight, getMedal,
} from '../utils/noteUtils'
import { TREBLE_TRIADS, BASS_TRIADS } from '../data/triads'

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
  // timer
  timerMode: false,
  timerDuration: 30,
  timerCount: 0,
  timerCorrect: 0,
  timerEnd: null,
  timerPhase: 'idle', // idle | prompt | countdown | running | result
  countdownNum: 3,
  timerResult: null,
}

export function useGameState() {
  const [state, setState] = useState(INITIAL_STATE)
  const timerIntervalRef = useRef(null)
  const countdownTimeoutRef = useRef(null)

  const update = useCallback((patch) => setState((s) => ({ ...s, ...patch })), [])

  const clearFlash = useCallback((delay = 900) => {
    setTimeout(() => update({ flashCard: null }), delay)
  }, [update])

  // ── Next note ─────────────────────────────────────────────────────────────

  const nextNote = useCallback((currentState) => {
    const s = currentState
    if (isTriadMode(s.level)) {
      const pool = getPool(s.clef, s.level)
      let triad, tries = 0
      do {
        triad = weightedRandom(pool, s.weights)
        tries++
      } while (tries < 10 && s.currentTriad && triadKey(triad) === triadKey(s.currentTriad))

      const feedbackMsg =
        s.level === 'inter' ? 'Identifique a nota 1 de 3' : ''
      const feedbackType = s.level === 'inter' ? 'hint' : ''

      setState((prev) => ({
        ...prev,
        currentTriad: triad,
        triadNoteIndex: 0,
        currentNote: triad.notes[0],
        waiting: false,
        selectedAcc: '',
        feedback: { msg: feedbackMsg, type: feedbackType },
        noteKey: (prev.noteKey ?? 0) + 1,
      }))
    } else {
      const pool = getPool(s.clef, s.level)
      let note, tries = 0
      do {
        note = weightedRandom(pool, s.weights)
        tries++
      } while (tries < 10 && s.currentNote && noteKey(note) === noteKey(s.currentNote))

      setState((prev) => ({
        ...prev,
        currentNote: note,
        currentTriad: null,
        waiting: false,
        selectedAcc: '',
        feedback: { msg: '', type: '' },
        noteKey: (prev.noteKey ?? 0) + 1,
      }))
    }
  }, [])

  // ── Answer submission ──────────────────────────────────────────────────────

  const submitAnswer = useCallback((name) => {
    setState((s) => {
      if (s.waiting) return s

      if (s.level === 'adv') {
        const ct = s.currentTriad
        const correct = name === triadKey(ct)
        const newWeights = updateWeight(ct.notes[0], correct, s.weights)
        const flash = correct ? 'correct' : 'wrong'
        const feedback = correct
          ? { msg: '✓ Correto!', type: 'correct' }
          : { msg: `✗ Era ${ct.label}`, type: 'wrong' }

        setTimeout(() => {
          setState((prev) => {
            nextNote(prev)
            return prev
          })
          update({ flashCard: null })
        }, 900)

        return {
          ...s,
          total: s.total + 1,
          correct: correct ? s.correct + 1 : s.correct,
          streak: correct ? s.streak + 1 : 0,
          weights: newWeights,
          waiting: true,
          flashCard: flash,
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
        const accLabel = targetNote.acc === '#' ? '♯' : targetNote.acc === 'b' ? '♭' : ''

        if (correct) {
          const nextIdx = s.triadNoteIndex + 1
          if (nextIdx < 3) {
            // advance to next note in triad
            setTimeout(() => {
              setState((prev) => ({
                ...prev,
                triadNoteIndex: nextIdx,
                currentNote: ct.notes[nextIdx],
                waiting: false,
                selectedAcc: '',
                flashCard: null,
                feedback: { msg: `Identifique a nota ${nextIdx + 1} de 3`, type: 'hint' },
                noteKey: (prev.noteKey ?? 0) + 1,
              }))
            }, 700)

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
              timerCount: s.timerMode ? s.timerCount + 1 : s.timerCount,
              timerCorrect: s.timerMode ? s.timerCorrect + 1 : s.timerCorrect,
            }
          }
          // triad complete
          setTimeout(() => {
            setState((prev) => {
              nextNote(prev)
              return prev
            })
            update({ flashCard: null })
          }, 900)

          return {
            ...s,
            total: s.total + 1,
            correct: s.correct + 1,
            streak: s.streak + 1,
            weights: newWeights,
            waiting: true,
            flashCard: 'correct',
            feedback: { msg: '✓ Tríade completa!', type: 'correct' },
            answeredNote: name,
            timerCount: s.timerMode ? s.timerCount + 1 : s.timerCount,
            timerCorrect: s.timerMode ? s.timerCorrect + 1 : s.timerCorrect,
          }
        }

        // wrong
        setTimeout(() => {
          setState((prev) => {
            nextNote(prev)
            return prev
          })
          update({ flashCard: null })
        }, 900)

        return {
          ...s,
          total: s.total + 1,
          streak: 0,
          weights: newWeights,
          waiting: true,
          flashCard: 'wrong',
          feedback: { msg: `✗ Era ${s.solfejo ? { C:'Dó',D:'Ré',E:'Mi',F:'Fá',G:'Sol',A:'Lá',B:'Si' }[targetNote.name] : targetNote.name}${accLabel}`, type: 'wrong' },
          answeredNote: name,
          timerCount: s.timerMode ? s.timerCount + 1 : s.timerCount,
        }
      }

      // basic mode
      const cn = s.currentNote
      const correct = name === cn.name && s.selectedAcc === cn.acc
      const newWeights = updateWeight(cn, correct, s.weights)
      const accLabel = cn.acc === '#' ? '♯' : cn.acc === 'b' ? '♭' : ''
      const flash = correct ? 'correct' : 'wrong'
      const feedback = correct
        ? { msg: '✓ Correto!', type: 'correct' }
        : { msg: `✗ Era ${s.solfejo ? { C:'Dó',D:'Ré',E:'Mi',F:'Fá',G:'Sol',A:'Lá',B:'Si' }[cn.name] : cn.name}${accLabel}`, type: 'wrong' }

      setTimeout(() => {
        setState((prev) => {
          nextNote(prev)
          return prev
        })
        update({ flashCard: null })
      }, 900)

      return {
        ...s,
        total: s.total + 1,
        correct: correct ? s.correct + 1 : s.correct,
        streak: correct ? s.streak + 1 : 0,
        weights: newWeights,
        waiting: true,
        flashCard: flash,
        feedback,
        answeredNote: name,
        timerCount: s.timerMode ? s.timerCount + 1 : s.timerCount,
        timerCorrect: s.timerMode && correct ? s.timerCorrect + 1 : s.timerCorrect,
      }
    })
  }, [nextNote, update])

  // ── Piano answer ──────────────────────────────────────────────────────────

  const submitPianoAnswer = useCallback((name, acc, oct) => {
    setState((s) => {
      if (s.waiting) return s
      const cn = s.currentNote
      const correct = name === cn.name && acc === cn.acc
      const newWeights = updateWeight(cn, correct, s.weights)
      const accLabel = cn.acc === '#' ? '♯' : cn.acc === 'b' ? '♭' : ''
      const flash = correct ? 'correct' : 'wrong'
      const feedback = correct
        ? { msg: '✓ Correto!', type: 'correct' }
        : { msg: `✗ Era ${s.solfejo ? { C:'Dó',D:'Ré',E:'Mi',F:'Fá',G:'Sol',A:'Lá',B:'Si' }[cn.name] : cn.name}${accLabel}`, type: 'wrong' }

      setTimeout(() => {
        setState((prev) => {
          nextNote(prev)
          return prev
        })
        update({ flashCard: null })
      }, 900)

      return {
        ...s,
        total: s.total + 1,
        correct: correct ? s.correct + 1 : s.correct,
        streak: correct ? s.streak + 1 : 0,
        weights: newWeights,
        waiting: true,
        flashCard: flash,
        feedback,
        pianoFeedback: { midi: name + acc + oct, correct },
        timerCount: s.timerMode ? s.timerCount + 1 : s.timerCount,
        timerCorrect: s.timerMode && correct ? s.timerCorrect + 1 : s.timerCorrect,
      }
    })
  }, [nextNote, update])

  // ── Settings toggles ───────────────────────────────────────────────────────

  const toggleClef = useCallback((clef) => {
    setState((s) => {
      const next = { ...s, clef, weights: s.weights }
      setTimeout(() => nextNote(next), 0)
      return { ...s, clef }
    })
  }, [nextNote])

  const toggleLevel = useCallback((level) => {
    setState((s) => {
      const next = { ...s, level }
      setTimeout(() => nextNote(next), 0)
      return { ...s, level, selectedAcc: '' }
    })
  }, [nextNote])

  const toggleSolfejo = useCallback(() => {
    update((s) => ({ solfejo: !s.solfejo }))
    setState((s) => ({ ...s, solfejo: !s.solfejo }))
  }, [update])

  const togglePiano = useCallback(() => {
    setState((s) => ({ ...s, showPiano: !s.showPiano }))
  }, [])

  const toggleAcc = useCallback((acc) => {
    update({ selectedAcc: acc })
  }, [update])

  const resetScore = useCallback(() => {
    update({ correct: 0, total: 0, streak: 0, weights: {} })
  }, [update])

  // ── Timer ─────────────────────────────────────────────────────────────────

  const finishTimerRound = useCallback(() => {
    clearTimeout(timerIntervalRef.current)
    setState((s) => {
      const pct = s.timerCount > 0 ? Math.round(s.timerCorrect / s.timerCount * 100) : 0
      const notesPerMin = (s.timerCorrect / s.timerDuration * 60).toFixed(1)
      return {
        ...s,
        timerMode: false,
        timerPhase: 'result',
        timerResult: {
          duration: s.timerDuration,
          correct: s.timerCorrect,
          pct,
          speed: notesPerMin,
          medal: getMedal(s.timerCorrect),
        },
      }
    })
  }, [])

  const startTimerRound = useCallback((duration) => {
    clearTimeout(timerIntervalRef.current)
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
        setState((prev) => ({ ...prev, countdownNum: 0 }))
        countdownTimeoutRef.current = setTimeout(() => {
          setState((prev) => {
            const end = Date.now() + prev.timerDuration * 1000
            const next = {
              ...prev,
              timerMode: true,
              timerCount: 0,
              timerCorrect: 0,
              timerEnd: end,
              timerPhase: 'running',
            }
            nextNote(next)
            // Use a single timeout to end the round at the right time
            timerIntervalRef.current = setTimeout(
              () => finishTimerRound(),
              prev.timerDuration * 1000
            )
            return next
          })
        }, 600)
        return
      }
      setState((prev) => ({ ...prev, countdownNum: current }))
      countdownTimeoutRef.current = setTimeout(tick, 900)
    }
    countdownTimeoutRef.current = setTimeout(tick, 900)
  }, [nextNote, finishTimerRound])

  const stopTimerMode = useCallback(() => {
    clearTimeout(timerIntervalRef.current)
    clearTimeout(countdownTimeoutRef.current)
    setState((s) => {
      const next = {
        ...s,
        timerMode: false,
        timerPhase: 'idle',
        timerResult: null,
      }
      nextNote(next)
      return next
    })
  }, [nextNote])

  // ── Keyboard shortcuts ────────────────────────────────────────────────────

  useEffect(() => {
    const handler = (e) => {
      setState((s) => {
        if (s.waiting || s.timerPhase !== 'running' && !s.timerMode && s.timerPhase !== 'idle') return s
        if (s.waiting) return s
        const key = e.key.toUpperCase()
        if (['A', 'B', 'C', 'D', 'E', 'F', 'G'].includes(key)) {
          submitAnswer(key)
        }
        return s
      })
      if (e.key === '#') toggleAcc('#')
      if (e.key === 'b' || (e.key === 'B' && e.shiftKey)) toggleAcc('b')
      if (e.key === 'n' || e.key === 'N') toggleAcc('')
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [submitAnswer, toggleAcc])

  // ── Bootstrap ─────────────────────────────────────────────────────────────

  useEffect(() => {
    setState((s) => {
      nextNote(s)
      return s
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearTimeout(timerIntervalRef.current)
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
