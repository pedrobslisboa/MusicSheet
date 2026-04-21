import { TREBLE_NOTES, BASS_NOTES } from '../data/notes'
import { TREBLE_TRIADS, BASS_TRIADS } from '../data/triads'

export const LETTER_TO_SOLFEJO = {
  C: 'Dó', D: 'Ré', E: 'Mi', F: 'Fá', G: 'Sol', A: 'Lá', B: 'Si',
}

export const SOLFEJO_TO_LETTER = {
  Dó: 'C', Ré: 'D', Mi: 'E', Fá: 'F', Sol: 'G', Lá: 'A', Si: 'B',
}

export function noteName(letter, solfejo) {
  return solfejo ? LETTER_TO_SOLFEJO[letter] : letter
}

export function noteKey(note) {
  return `${note.name}${note.acc}_${note.step}`
}

export function triadKey(triad) {
  return triad.root + triad.quality
}

export function getWeight(note, weights) {
  return weights[noteKey(note)] ?? 1
}

export function updateWeight(note, correct, weights) {
  const k = noteKey(note)
  const w = weights[k] ?? 1
  return {
    ...weights,
    [k]: correct
      ? Math.max(0.5, w * 0.7)
      : Math.min(6, w * 2.2 + 0.5),
  }
}

export function weightedRandom(pool, weights) {
  const getW = (item) =>
    item.notes ? getWeight(item.notes[0], weights) : getWeight(item, weights)
  const ws = pool.map(getW)
  const total = ws.reduce((a, b) => a + b, 0)
  let r = Math.random() * total
  for (let i = 0; i < pool.length; i++) {
    r -= ws[i]
    if (r <= 0) return pool[i]
  }
  return pool[pool.length - 1]
}

export function getPool(clef, level) {
  const isTriad = level === 'inter' || level === 'adv'
  if (isTriad) return clef === 'treble' ? TREBLE_TRIADS : BASS_TRIADS
  return (clef === 'treble' ? TREBLE_NOTES : BASS_NOTES).basic
}

export function isTriadMode(level) {
  return level === 'inter' || level === 'adv'
}

export const WHITE_PATTERN = ['C', 'D', 'E', 'F', 'G', 'A', 'B']

export const BLACK_OFFSETS = {
  'C#': 0.6, 'D#': 1.6, 'F#': 3.6, 'G#': 4.6, 'A#': 5.6,
}

export function noteToMidi(name, acc, octave) {
  const semis = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 }
  const delta = acc === '#' ? 1 : acc === 'b' ? -1 : 0
  return octave * 12 + semis[name] + delta
}

export function stepToY(step, clef) {
  const bottomLineStep = clef === 'treble' ? 2 : 0
  return 96 - (step - bottomLineStep) * 7
}

export function getMedal(correct) {
  if (correct >= 25) return '🥇'
  if (correct >= 15) return '🥈'
  return '🥉'
}

export function getWeightDotColor(weight) {
  const ratio = Math.min(1, (weight - 0.5) / 5.5)
  const r = Math.round(90 + ratio * 106)
  const g = Math.round(158 - ratio * 100)
  return `rgb(${r},${g},74)`
}

export function getUniqueTriads(triads) {
  const seen = new Set()
  return triads.filter((t) => {
    const k = triadKey(t)
    if (seen.has(k)) return false
    seen.add(k)
    return true
  })
}
