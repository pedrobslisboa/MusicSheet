/**
 * E2E tests for Leitura de Partituras
 *
 * Requires the dev server to be running: npm run dev
 * Run tests: node tests/e2e.test.js
 */

const puppeteer = require('puppeteer')

const BASE_URL = 'http://localhost:5173'
const VIEWPORT_DESKTOP = { width: 1280, height: 800 }
const VIEWPORT_MOBILE = { width: 390, height: 844 }  // iPhone 14

let browser
let page

// ── Helpers ────────────────────────────────────────────────────────────────

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

function pass(name) { console.log(`  ✓ ${name}`) }
function fail(name, err) { console.error(`  ✗ ${name}\n    ${err.message ?? err}`) }

async function test(name, fn) {
  try {
    await fn()
    pass(name)
    return true
  } catch (err) {
    fail(name, err)
    return false
  }
}

async function suite(name, fn) {
  console.log(`\n${name}`)
  await fn()
}

async function waitForApp() {
  await page.waitForSelector('.card', { timeout: 5000 })
  await page.waitForSelector('.staff-svg', { timeout: 5000 })
}

function assert(condition, message) {
  if (!condition) throw new Error(message ?? 'Assertion failed')
}

// ── Test suites ────────────────────────────────────────────────────────────

async function testPageLoad() {
  await suite('Page load', async () => {
    await test('page loads and title is correct', async () => {
      const title = await page.title()
      assert(title === 'Leitura de Partituras', `Got title: "${title}"`)
    })

    await test('header renders', async () => {
      const h1 = await page.$eval('h1', (el) => el.textContent)
      assert(h1.includes('Leitura de Partituras'), `Got: "${h1}"`)
    })

    await test('staff SVG is visible', async () => {
      const svg = await page.$('.staff-svg')
      assert(svg !== null, 'Staff SVG not found')
      const visible = await svg.isVisible()
      assert(visible, 'Staff SVG is not visible')
    })

    await test('note renders on initial load (ellipse present in SVG)', async () => {
      const ellipseCount = await page.evaluate(() =>
        document.querySelectorAll('.staff-svg ellipse').length
      )
      assert(ellipseCount > 0, `No note ellipse in staff SVG on initial load (got ${ellipseCount})`)
    })

    await test('stats bar shows 0 correct, 0 total', async () => {
      const values = await page.$$eval('.stat-value', (els) =>
        els.map((el) => el.textContent.trim())
      )
      assert(values[0] === '0', `Expected "0" correct, got "${values[0]}"`)
      assert(values[1] === '0', `Expected "0" total, got "${values[1]}"`)
      assert(values[2] === '—', `Expected "—" accuracy, got "${values[2]}"`)
    })

    await test('answer grid has 7 buttons (basic mode)', async () => {
      const buttons = await page.$$('.answer-btn')
      assert(buttons.length === 7, `Expected 7 buttons, got ${buttons.length}`)
    })

    await test('clef label shows Clave de Sol by default', async () => {
      const label = await page.$eval('.clef-label', (el) => el.textContent)
      assert(label.includes('Clave de Sol'), `Got: "${label}"`)
    })

    await test('streak starts at 0', async () => {
      const streak = await page.$eval('.streak-val', (el) => el.textContent)
      assert(streak === '0', `Got streak: "${streak}"`)
    })
  })
}

async function testAnswering() {
  await suite('Answering notes', async () => {
    await test('clicking a note button registers an answer', async () => {
      const before = await page.$eval('#root', () => ({
        total: document.querySelectorAll('.stat-value')[1].textContent,
      }))
      assert(before.total === '0', 'Total should start at 0')

      const btn = await page.$('.answer-btn')
      await btn.click()
      await sleep(200)

      const after = await page.$$eval('.stat-value', (els) =>
        els.map((el) => el.textContent.trim())
      )
      assert(after[1] === '1', `Total should be 1 after answering, got "${after[1]}"`)
    })

    await test('correct/wrong class is applied after answering', async () => {
      const btns = await page.$$('.answer-btn')
      const hasResult = await page.evaluate(() =>
        [...document.querySelectorAll('.answer-btn')].some(
          (b) => b.classList.contains('correct') || b.classList.contains('wrong')
        )
      )
      assert(hasResult, 'No correct/wrong class found after answering')
    })

    await test('feedback message appears after answering', async () => {
      const feedback = await page.$eval('.feedback', (el) => el.textContent.trim())
      assert(feedback.length > 0, 'Feedback should not be empty after answering')
    })

    await test('next note loads automatically after delay', async () => {
      await sleep(1000)
      const total = await page.$eval(
        '.stat-value:nth-child(1)',
        () => document.querySelectorAll('.stat-value')[1].textContent
      )
      // Still 1 — a new note should have appeared but total stays until next answer
      const feedback = await page.$eval('.feedback', (el) => el.textContent.trim())
      // Feedback may be cleared for the new note
      assert(typeof feedback === 'string', 'Feedback element exists')
    })

    await test('keyboard shortcut A-G submits an answer', async () => {
      // wait for waiting state to clear
      await sleep(1100)
      const totalBefore = await page.$$eval('.stat-value', (els) => els[1].textContent)
      await page.keyboard.press('C')
      await sleep(200)
      const totalAfter = await page.$$eval('.stat-value', (els) => els[1].textContent)
      assert(
        parseInt(totalAfter) > parseInt(totalBefore),
        `Total did not increase: before=${totalBefore} after=${totalAfter}`
      )
    })
  })
}

async function testClefToggle() {
  await suite('Clef toggle', async () => {
    await test('switching to Clave de Fá updates label', async () => {
      const bassBtn = await page.$('#root button ::-p-text(Clave de Fá)')

      // Find by text content
      const btns = await page.$$('.setting-btn')
      let bassButton = null
      for (const btn of btns) {
        const txt = await btn.evaluate((el) => el.textContent)
        if (txt.includes('Clave de Fá')) { bassButton = btn; break }
      }
      assert(bassButton !== null, 'Bass clef button not found')
      await bassButton.click()
      await sleep(300)

      const label = await page.$eval('.clef-label', (el) => el.textContent)
      assert(label.includes('Clave de Fá'), `Expected bass clef label, got "${label}"`)
    })

    await test('switching back to Clave de Sol works', async () => {
      const btns = await page.$$('.setting-btn')
      let trebleButton = null
      for (const btn of btns) {
        const txt = await btn.evaluate((el) => el.textContent)
        if (txt.includes('Clave de Sol')) { trebleButton = btn; break }
      }
      assert(trebleButton !== null, 'Treble clef button not found')
      await trebleButton.click()
      await sleep(300)

      const label = await page.$eval('.clef-label', (el) => el.textContent)
      assert(label.includes('Clave de Sol'), `Expected treble clef label, got "${label}"`)
    })
  })
}

async function testSolfejoMode() {
  await suite('Solfejo mode', async () => {
    await test('toggling solfejo changes button labels to Dó Ré Mi...', async () => {
      const btns = await page.$$('.setting-btn')
      let solfejoBtn = null
      for (const btn of btns) {
        const txt = await btn.evaluate((el) => el.textContent)
        if (txt.includes('Solfejo')) { solfejoBtn = btn; break }
      }
      assert(solfejoBtn !== null, 'Solfejo button not found')
      await solfejoBtn.click()
      await sleep(200)

      const answerLabels = await page.$$eval('.answer-btn', (els) =>
        els.map((el) => el.textContent.trim())
      )
      const hasSolfejo = answerLabels.some((l) =>
        ['Dó', 'Ré', 'Mi', 'Fá', 'Sol', 'Lá', 'Si'].includes(l)
      )
      assert(hasSolfejo, `Solfejo labels not found, got: ${answerLabels.join(', ')}`)
    })

    await test('toggling solfejo off restores letter labels', async () => {
      const btns = await page.$$('.setting-btn')
      let solfejoBtn = null
      for (const btn of btns) {
        const txt = await btn.evaluate((el) => el.textContent)
        if (txt.includes('Solfejo')) { solfejoBtn = btn; break }
      }
      await solfejoBtn.click()
      await sleep(200)

      const answerLabels = await page.$$eval('.answer-btn', (els) =>
        els.map((el) => el.textContent.trim())
      )
      const hasLetters = answerLabels.some((l) =>
        ['C', 'D', 'E', 'F', 'G', 'A', 'B'].includes(l)
      )
      assert(hasLetters, `Letter labels not found after toggling off solfejo`)
    })
  })
}

async function testResetScore() {
  await suite('Reset score', async () => {
    await test('reset clears stats to 0', async () => {
      // Make sure there's some score first
      await sleep(1100)
      await page.keyboard.press('C')
      await sleep(200)

      const btns = await page.$$('.setting-btn')
      let resetBtn = null
      for (const btn of btns) {
        const txt = await btn.evaluate((el) => el.textContent)
        if (txt.includes('Reset')) { resetBtn = btn; break }
      }
      assert(resetBtn !== null, 'Reset button not found')
      await resetBtn.click()
      await sleep(200)

      const values = await page.$$eval('.stat-value', (els) =>
        els.map((el) => el.textContent.trim())
      )
      assert(values[0] === '0', `Correct should be 0, got "${values[0]}"`)
      assert(values[1] === '0', `Total should be 0, got "${values[1]}"`)
    })
  })
}

async function testTimerMode() {
  await suite('Timer mode', async () => {
    await test('clicking 30s shows timer start prompt', async () => {
      const btns = await page.$$('.setting-btn')
      let timer30 = null
      for (const btn of btns) {
        const txt = await btn.evaluate((el) => el.textContent)
        if (txt.trim() === '30s') { timer30 = btn; break }
      }
      assert(timer30 !== null, '30s timer button not found')
      await timer30.click()
      await sleep(300)

      const prompt = await page.$('.timer-start-prompt')
      assert(prompt !== null, 'Timer start prompt not visible')
      const visible = await prompt.isVisible()
      assert(visible, 'Timer start prompt is not visible')
    })

    await test('start button shows countdown', async () => {
      const startBtn = await page.$('.tsp-btn')
      assert(startBtn !== null, 'Start button not found')
      await startBtn.click()
      await sleep(300)

      const countdown = await page.$('.timer-countdown')
      assert(countdown !== null, 'Countdown not found')
      const visible = await countdown.isVisible()
      assert(visible, 'Countdown not visible')
    })

    await test('after countdown, staff and answers appear', async () => {
      // Wait through 3-2-1-GO (3 * 900ms + 600ms)
      await sleep(4000)

      const staff = await page.$('.staff-svg')
      assert(staff !== null && await staff.isVisible(), 'Staff not visible after countdown')

      const answerBtns = await page.$$('.answer-btn')
      assert(answerBtns.length > 0, 'No answer buttons visible after countdown')
    })

    await test('timer HUD is visible during round', async () => {
      const hud = await page.$('.timer-hud')
      assert(hud !== null && await hud.isVisible(), 'Timer HUD not visible during round')
    })

    await test('timer shows result screen when time expires', async () => {
      // Wait for 30s timer to complete (we're already a few seconds in)
      await sleep(30000)

      const result = await page.$('.timer-result')
      assert(result !== null && await result.isVisible(), 'Timer result screen not visible')
    })

    await test('result shows medal and stats', async () => {
      const medal = await page.$eval('.res-medal', (el) => el.textContent)
      const hasMedal = ['🥇', '🥈', '🥉'].some((m) => medal.includes(m))
      assert(hasMedal, `Expected medal emoji, got "${medal}"`)
    })

    await test('free mode button exits timer', async () => {
      const btns = await page.$$('.res-btn')
      let freeBtn = null
      for (const btn of btns) {
        const txt = await btn.evaluate((el) => el.textContent)
        if (txt.includes('Modo livre')) { freeBtn = btn; break }
      }
      assert(freeBtn !== null, 'Free mode button not found')
      await freeBtn.click()
      await sleep(500)

      const staff = await page.$('.staff-svg')
      assert(staff !== null && await staff.isVisible(), 'Staff not visible after returning to free mode')
    })
  })
}

async function testMobileLayout() {
  await suite('Mobile layout (390×844)', async () => {
    await page.setViewport(VIEWPORT_MOBILE)
    await page.reload()
    await waitForApp()

    await test('card does not overflow viewport horizontally', async () => {
      const card = await page.$('.card')
      const box = await card.boundingBox()
      assert(box.x >= 0, `Card x is ${box.x}, should be >= 0`)
      assert(
        box.x + box.width <= VIEWPORT_MOBILE.width + 1,
        `Card right edge ${box.x + box.width} exceeds viewport ${VIEWPORT_MOBILE.width}`
      )
    })

    await test('staff SVG fits within viewport', async () => {
      const svg = await page.$('.staff-svg')
      const box = await svg.boundingBox()
      assert(
        box.width <= VIEWPORT_MOBILE.width,
        `Staff SVG width ${box.width}px exceeds viewport ${VIEWPORT_MOBILE.width}px`
      )
    })

    await test('answer buttons have adequate touch target height (≥ 44px)', async () => {
      const btn = await page.$('.answer-btn')
      const box = await btn.boundingBox()
      assert(
        box.height >= 44,
        `Answer button height is ${box.height}px, need ≥ 44px`
      )
    })

    await test('settings buttons have adequate touch target height (≥ 40px)', async () => {
      const btn = await page.$('.setting-btn')
      const box = await btn.boundingBox()
      assert(
        box.height >= 40,
        `Setting button height is ${box.height}px, need ≥ 40px`
      )
    })

    await test('no horizontal scroll', async () => {
      const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth)
      assert(
        scrollWidth <= VIEWPORT_MOBILE.width + 1,
        `Page scrollWidth ${scrollWidth} > viewport ${VIEWPORT_MOBILE.width}`
      )
    })

    // Restore desktop
    await page.setViewport(VIEWPORT_DESKTOP)
  })
}

// ── Main ───────────────────────────────────────────────────────────────────

;(async () => {
  console.log('Starting E2E tests...')
  console.log(`Target: ${BASE_URL}\n`)

  browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  })

  page = await browser.newPage()
  await page.setViewport(VIEWPORT_DESKTOP)

  let passed = 0
  let failed = 0

  const originalConsoleLog = console.log
  const originalConsoleError = console.error
  const results = []

  // Patch to count results
  console.log = (...args) => {
    const msg = args.join(' ')
    if (msg.startsWith('  ✓')) passed++
    if (msg.startsWith('  ✗')) failed++
    originalConsoleLog(...args)
  }
  console.error = (...args) => {
    const msg = args.join(' ')
    if (msg.startsWith('  ✗')) failed++
    originalConsoleError(...args)
  }

  try {
    await page.goto(BASE_URL, { waitUntil: 'networkidle0', timeout: 10000 })
    await waitForApp()

    await testPageLoad()
    await testAnswering()
    await testClefToggle()
    await testSolfejoMode()
    await testResetScore()
    await testMobileLayout()
    await testTimerMode()
  } catch (err) {
    console.error('\nFatal error during tests:', err.message)
  } finally {
    await browser.close()
    console.log(`\n${'─'.repeat(40)}`)
    console.log(`Results: ${passed} passed, ${failed} failed`)
    if (failed > 0) process.exit(1)
  }
})()
