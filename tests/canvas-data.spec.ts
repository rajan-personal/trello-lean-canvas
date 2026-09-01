import { expect, test } from '@playwright/test'
import { openSampleCanvas } from './support/canvas-fixtures'

test('loads fresh sample data without removing custom canvases or creating duplicates', async ({
  page,
}) => {
  await page.goto('/')

  await page.getByRole('button', { name: 'Add canvas' }).click()
  await page.getByRole('textbox', { name: 'Canvas name' }).fill('My startup')
  await page.getByRole('button', { name: 'Create canvas' }).click()
  await expect(page.getByRole('heading', { name: 'My startup' })).toBeVisible()

  const loadSamples = page.getByRole('button', { name: 'Load sample data' })
  await loadSamples.click()
  await expect(
    page.getByRole('heading', { name: 'Airbnb — 2008' }),
  ).toBeVisible()
  await expect(page.getByRole('status')).toHaveText('Sample data loaded')
  await expect(
    page.getByRole('navigation', { name: 'Lean canvases' }).getByRole('button'),
  ).toHaveCount(5)
  await expect(
    page.getByRole('button', { name: 'My startup', exact: true }),
  ).toBeVisible()

  await loadSamples.click()
  await expect(
    page.getByRole('navigation', { name: 'Lean canvases' }).getByRole('button'),
  ).toHaveCount(5)
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
  await expect(
    page.getByRole('navigation', { name: 'Lean canvases' }),
  ).toBeVisible()
  await page.getByRole('button', { name: 'Team alignment' }).click()
  await expect(page.getByRole('heading', { name: 'Pulse' })).toBeVisible()
})
