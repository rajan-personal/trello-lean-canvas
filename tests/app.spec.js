import { expect, test } from '@playwright/test'
import { dump } from 'js-yaml'
import { sectionTemplate } from '../src/data.js'

const sampleCards = {
  problem: [
    'Decisions disappear across chat, docs, and meetings',
    'Weekly status updates take team leads 2–3 hours',
    'Remote teams cannot see blockers early enough',
  ],
  alternatives: ['Slack threads, spreadsheets, and recurring syncs'],
  solution: ['One-minute asynchronous team check-ins', 'Automatic blocker and decision digest', 'Shared weekly pulse with clear owners'],
  metrics: ['North star\nTeams completing 3+ check-ins weekly'],
  value: ['Keep every team in sync—without another meeting.'],
  concept: ['The daily stand-up meets a calm team dashboard.'],
  advantage: ['Proprietary team-health benchmark', 'Founder network of remote-first product teams'],
  channels: ['Product-led team invites', 'Remote-work communities'],
  segments: ['Remote-first product teams', 'Product and engineering managers', 'People leaders'],
  adopters: ['Series A SaaS teams'],
  cost: ['Fixed\nProduct team and infrastructure', 'Variable\nAI summaries and support'],
  revenue: ['Team plan\n$8 per member', 'Business plan\n$14 per member', 'Annual contracts\n20% off'],
}

function makeCanvasYaml({ name, title = name, cards = {} }) {
  return dump({
    canvas: {
      name,
      title,
      sections: sectionTemplate.map((section) => ({
        ...section,
        cards: cards[section.id] ?? [],
      })),
    },
  })
}

async function uploadCanvas(page, canvas, fileName = 'canvas.yaml') {
  await page.locator('input[type="file"]').setInputFiles({
    name: fileName,
    mimeType: 'application/yaml',
    buffer: Buffer.from(makeCanvasYaml(canvas)),
  })
}

async function openSampleCanvas(page) {
  await page.goto('/')
  await uploadCanvas(page, { name: 'Team alignment', title: 'Pulse', cards: sampleCards }, 'team-alignment.yaml')
  await expect(page.getByRole('heading', { name: 'Pulse' })).toBeVisible()
}

test('starts empty, creates, uploads, edits, switches, and exports independent canvases', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('main')).toBeEmpty()
  await expect(page.locator('.canvas-cell')).toHaveCount(0)

  await page.getByRole('button', { name: 'Add canvas' }).click()
  await page.getByRole('textbox', { name: 'Canvas name' }).fill('Blank canvas')
  await page.getByRole('button', { name: 'Create canvas' }).click()
  await expect(page.getByRole('heading', { name: 'Blank canvas' })).toBeVisible()
  await expect(page.locator('.canvas-cell')).toHaveCount(12)

  await uploadCanvas(page, { name: 'Team alignment', title: 'Pulse', cards: sampleCards }, 'team-alignment.yaml')

  await expect(page.getByRole('heading', { name: 'Pulse' })).toBeVisible()
  await expect(page.locator('.canvas-cell')).toHaveCount(12)
  await expect(page.locator('.cell-hint')).toHaveCount(0)

  await page.locator('.canvas-card').first().dblclick()
  const editor = page.getByRole('textbox', { name: 'Edit card' })
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await editor.fill('Decisions stay visible')
  await page.getByRole('button', { name: 'Save', exact: true }).click()
  await expect(page.getByText('Decisions stay visible')).toBeVisible()

  const download = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Download canvas data as YAML' }).click()
  await expect((await download).suggestedFilename()).toBe('team-alignment.yaml')

  await uploadCanvas(page, { name: 'Launch lab' }, 'launch-lab.yaml')
  await expect(page.getByRole('heading', { name: 'Launch lab' })).toBeVisible()
  await expect(page.locator('.canvas-card')).toHaveCount(0)
  await expect(page.locator('.cell-hint')).toHaveCount(12)

  await page.getByRole('button', { name: 'Team alignment' }).click()
  await expect(page.getByText('Decisions stay visible')).toBeVisible()
})

test('imports YAML into the current canvas', async ({ page }) => {
  await page.goto('/')
  const yaml = `
canvas:
  name: Imported canvas
  title: Lean Canvas — Imported
  sections:
    - id: problem
      title: Problem
      hint: Imported problem hint
      cards:
        - A freshly imported problem
    - id: alternatives
      title: Existing alternatives
      cards: []
    - id: solution
      title: Solution
      cards: []
    - id: metrics
      title: Key metrics
      cards: []
    - id: value
      title: Unique value proposition
      cards: []
    - id: concept
      title: High-level concept
      cards: []
    - id: advantage
      title: Unfair advantage
      cards: []
    - id: channels
      title: Channels
      cards: []
    - id: segments
      title: Customer segments
      cards: []
    - id: adopters
      title: Early adopters
      cards: []
    - id: cost
      title: Cost structure
      cards: []
    - id: revenue
      title: Revenue streams
      cards: []
`

  await page.locator('input[type="file"]').setInputFiles({
    name: 'imported.yaml',
    mimeType: 'application/yaml',
    buffer: Buffer.from(yaml),
  })

  await expect(page.getByRole('heading', { name: 'Imported' })).toBeVisible()
  await expect(page.getByText('A freshly imported problem')).toBeVisible()
})

test('opens the canvas sidebar on mobile', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await openSampleCanvas(page)
  await page.getByRole('button', { name: 'Open sidebar' }).click()
  await expect(page.getByRole('navigation', { name: 'Lean canvases' })).toBeVisible()
  await page.getByRole('button', { name: 'Team alignment' }).click()
  await expect(page.getByRole('heading', { name: 'Pulse' })).toBeVisible()
})

test('renames the canvas inline from the board header', async ({ page }) => {
  await page.setViewportSize({ width: 1424, height: 797 })
  await openSampleCanvas(page)

  await page.getByRole('button', { name: 'Pulse', exact: true }).click()
  await expect(page.getByRole('dialog')).toHaveCount(0)

  const titleInput = page.getByRole('textbox', { name: 'Rename canvas' })
  await expect(titleInput).toBeFocused()
  await titleInput.fill('Signal')
  await titleInput.press('Enter')

  await expect(page.getByRole('heading', { name: 'Signal' })).toBeVisible()
  await expect(page.getByRole('navigation', { name: 'Lean canvases' }).getByRole('button', { name: 'Signal', exact: true })).toBeVisible()
})

test('collapses and restores the desktop sidebar from the main header', async ({ page }) => {
  await page.setViewportSize({ width: 1424, height: 797 })
  await openSampleCanvas(page)

  const menuBox = await page.getByRole('button', { name: 'Collapse sidebar' }).boundingBox()
  const brandBox = await page.locator('.topbar-brand').boundingBox()
  expect(menuBox.x + menuBox.width).toBeLessThanOrEqual(brandBox.x)

  await page.getByRole('button', { name: 'Collapse sidebar' }).click()
  await expect(page.getByRole('button', { name: 'Expand sidebar' })).toBeVisible()
  await expect.poll(async () => page.locator('#canvas-sidebar').evaluate((element) => element.getBoundingClientRect().width)).toBe(0)
  await expect.poll(async () => page.locator('.main-area').evaluate((element) => element.getBoundingClientRect().left)).toBe(0)

  await page.getByRole('button', { name: 'Expand sidebar' }).click()
  await expect.poll(async () => page.locator('#canvas-sidebar').evaluate((element) => element.getBoundingClientRect().width)).toBe(248)
})

test('keeps paired canvas cells compact and evenly sized', async ({ page }) => {
  await page.setViewportSize({ width: 1424, height: 797 })
  await openSampleCanvas(page)

  const cellHeights = await page.locator('.canvas-column').evaluateAll((columns) => columns.map((column) => (
    [...column.children].map((cell) => cell.getBoundingClientRect().height)
  )))

  for (const [topHeight, bottomHeight] of cellHeights) {
    expect(topHeight).toBe(250)
    expect(bottomHeight).toBe(topHeight)
  }
})

test('reveals a cross on hover and deletes the card', async ({ page }) => {
  await page.setViewportSize({ width: 1424, height: 797 })
  await openSampleCanvas(page)

  const card = page.getByRole('button', { name: 'Weekly status updates take team leads 2–3 hours', exact: true })
  await card.hover()
  const deleteButton = page.getByRole('button', { name: 'Delete “Weekly status updates take team leads 2–3 hours”', exact: true })
  await expect(deleteButton).toHaveCSS('opacity', '1')

  const cardBox = await card.locator('..').boundingBox()
  const deleteBox = await deleteButton.boundingBox()
  expect(deleteBox.x).toBeGreaterThanOrEqual(cardBox.x)
  expect(deleteBox.y).toBeGreaterThanOrEqual(cardBox.y)
  expect(deleteBox.x + deleteBox.width).toBeLessThanOrEqual(cardBox.x + cardBox.width)
  expect(deleteBox.y + deleteBox.height).toBeLessThanOrEqual(cardBox.y + cardBox.height)

  await deleteButton.click()

  await expect(card).toHaveCount(0)
  await expect(page.getByRole('status')).toHaveText('Card deleted')
})

test('edits cards with one save action and dismisses on outside click', async ({ page }) => {
  await page.setViewportSize({ width: 1424, height: 797 })
  await openSampleCanvas(page)

  const section = page.locator('.canvas-column.problem .canvas-cell').first()
  const card = page.getByRole('button', { name: 'Weekly status updates take team leads 2–3 hours', exact: true })
  await card.click()
  await expect(page.getByRole('textbox', { name: 'Edit card' })).toHaveCount(0)
  await card.dblclick()
  const editor = page.getByRole('textbox', { name: 'Edit card' })
  await expect(editor).toBeVisible()
  await editor.fill('Unsaved note')
  expect(await editor.evaluate((element) => element.getBoundingClientRect().height)).toBeLessThanOrEqual(40)
  await expect(section.locator('.inline-card-actions button')).toHaveCount(1)

  await section.locator('.cell-heading strong').click()
  await expect(editor).toHaveCount(0)
  await expect(card).toBeVisible()

  await card.dblclick()
  await page.getByRole('textbox', { name: 'Edit card' }).fill('Saved note')
  await page.getByRole('button', { name: 'Save', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Saved note', exact: true })).toBeVisible()
})

test('expands the white column for the composer without nested scrolling', async ({ page }) => {
  await page.setViewportSize({ width: 1424, height: 797 })
  await openSampleCanvas(page)

  const column = page.locator('.canvas-column.solution')
  const section = column.locator('.canvas-cell').first()
  const initialColumnHeight = await column.evaluate((element) => element.getBoundingClientRect().height)
  await section.getByRole('button', { name: '＋ Add a card' }).click()

  const layout = await section.evaluate((element) => {
    const sectionRect = element.getBoundingClientRect()
    const composerRect = element.querySelector('.card-composer').getBoundingClientRect()
    const cardBottoms = [...element.querySelectorAll('.canvas-card')]
      .map((card) => card.getBoundingClientRect().bottom)

    return {
      columnHeight: element.parentElement.getBoundingClientRect().height,
      sectionTop: sectionRect.top,
      sectionBottom: sectionRect.bottom,
      sectionClientHeight: element.clientHeight,
      sectionScrollHeight: element.scrollHeight,
      composerTop: composerRect.top,
      composerBottom: composerRect.bottom,
      lastCardBottom: Math.max(...cardBottoms),
    }
  })

  expect(layout.columnHeight).toBeGreaterThan(initialColumnHeight)
  expect(layout.sectionScrollHeight).toBe(layout.sectionClientHeight)
  expect(layout.composerTop).toBeGreaterThanOrEqual(layout.lastCardBottom)
  expect(layout.composerTop).toBeGreaterThanOrEqual(layout.sectionTop)
  expect(layout.composerBottom).toBeLessThanOrEqual(layout.sectionBottom)
})

test('keeps the first card anchored when it changes from composer to saved card', async ({ page }) => {
  await page.setViewportSize({ width: 1424, height: 797 })
  await openSampleCanvas(page)

  await uploadCanvas(page, { name: 'Blank canvas' }, 'blank-canvas.yaml')

  const section = page.locator('.canvas-column.problem .canvas-cell').first()
  await section.getByRole('button', { name: '＋ Add a card' }).click()
  const composerTop = await section.getByRole('textbox', { name: 'New card' })
    .evaluate((element) => element.getBoundingClientRect().top)

  await section.getByRole('textbox', { name: 'New card' }).fill('First card')
  await section.getByRole('button', { name: 'Add card' }).click()
  const savedCardTop = await section.getByRole('button', { name: 'First card', exact: true })
    .evaluate((element) => element.getBoundingClientRect().top)

  expect(savedCardTop).toBe(composerTop)
})

test('keeps every add-card action below the section cards', async ({ page }) => {
  await page.setViewportSize({ width: 1424, height: 797 })
  await openSampleCanvas(page)

  const sections = await page.locator('.canvas-cell').evaluateAll((elements) => elements.map((element) => {
    const sectionRect = element.getBoundingClientRect()
    const buttonRect = element.querySelector('.add-card-button')?.getBoundingClientRect()
    const cardBottoms = [...element.querySelectorAll('.canvas-card')]
      .map((card) => card.getBoundingClientRect().bottom)

    return {
      sectionBottom: sectionRect.bottom,
      buttonTop: buttonRect?.top,
      buttonBottom: buttonRect?.bottom,
      lastCardBottom: cardBottoms.length ? Math.max(...cardBottoms) : null,
    }
  }))

  for (const section of sections) {
    expect(section.buttonBottom).toBeLessThanOrEqual(section.sectionBottom)
    if (section.lastCardBottom !== null) {
      expect(section.buttonTop).toBeGreaterThanOrEqual(section.lastCardBottom)
      expect(section.lastCardBottom).toBeLessThanOrEqual(section.sectionBottom)
    }
  }
})
