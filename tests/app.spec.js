import { expect, test } from '@playwright/test'

test('creates, edits, switches, and exports independent lean canvases', async ({ page }) => {
  await page.goto('/')

  await expect(page.getByRole('heading', { name: 'Lean Canvas — Pulse' })).toBeVisible()
  await expect(page.locator('.canvas-cell')).toHaveCount(12)

  await page.locator('.canvas-card').first().click()
  const editor = page.getByRole('dialog').locator('textarea')
  await editor.fill('Decisions stay visible')
  await page.getByRole('button', { name: 'Save card' }).click()
  await expect(page.getByText('Decisions stay visible')).toBeVisible()

  const download = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Download canvas data as YAML' }).click()
  await expect((await download).suggestedFilename()).toBe('team-alignment.yaml')

  await page.getByRole('button', { name: 'Add startup canvas' }).click()
  await page.getByRole('dialog').locator('input').fill('Launch lab')
  await page.getByRole('button', { name: 'Create canvas' }).click()
  await expect(page.getByRole('heading', { name: 'Lean Canvas — Launch lab' })).toBeVisible()
  await expect(page.locator('.canvas-card')).toHaveCount(0)

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

  await expect(page.getByRole('heading', { name: 'Lean Canvas — Imported' })).toBeVisible()
  await expect(page.getByText('A freshly imported problem')).toBeVisible()
})

test('opens the canvas sidebar on mobile', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/')
  await page.getByRole('button', { name: 'Open sidebar' }).click()
  await expect(page.getByRole('navigation', { name: 'Lean canvases' })).toBeVisible()
  await page.getByRole('button', { name: 'Mobile onboarding' }).click()
  await expect(page.getByRole('heading', { name: 'Lean Canvas — Firstmile' })).toBeVisible()
})
