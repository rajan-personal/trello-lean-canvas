import { expect, test } from '@playwright/test'
import {
  loadSamples,
  sampleCards,
  uploadCanvas,
} from './support/canvas-fixtures'

test('starts with researched examples, creates, uploads, edits, switches, and exports independent canvases', async ({
  page,
}) => {
  await loadSamples(page)
  await expect(
    page.getByRole('navigation', { name: 'Lean canvases' }).getByRole('button'),
  ).toHaveCount(4)
  await expect(page.locator('.canvas-cell')).toHaveCount(12)
  await expect(page.getByText('Booking fees from travellers')).toBeVisible()

  await page.getByRole('button', { name: 'Add canvas' }).click()
  await page.getByRole('button', { name: 'New', exact: true }).click()
  const createCanvasDialog = page.getByRole('dialog', {
    name: 'Create canvas',
  })
  await expect(
    createCanvasDialog.getByRole('button', { name: 'Cancel' }),
  ).toHaveCSS('background-color', 'rgb(241, 242, 244)')
  await expect(
    createCanvasDialog.getByRole('button', { name: 'Create canvas' }),
  ).toHaveCSS('background-color', 'rgb(12, 102, 228)')
  await page.getByRole('textbox', { name: 'Canvas name' }).fill('Blank canvas')
  await page.getByRole('button', { name: 'Create canvas' }).click()
  await expect(
    page.getByRole('heading', { name: 'Blank canvas' }),
  ).toBeVisible()
  await expect(page.locator('.canvas-cell')).toHaveCount(12)

  await uploadCanvas(
    page,
    { name: 'Team alignment', title: 'Pulse', cards: sampleCards },
    'team-alignment.yaml',
  )

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
  await page
    .getByRole('button', { name: 'Download canvas data as YAML' })
    .click()
  await expect((await download).suggestedFilename()).toBe('team-alignment.yaml')

  await uploadCanvas(page, { name: 'Launch lab' }, 'launch-lab.yaml')
  await expect(page.getByRole('heading', { name: 'Launch lab' })).toBeVisible()
  await expect(page.locator('.canvas-card')).toHaveCount(0)
  await expect(page.locator('.cell-hint')).toHaveCount(12)

  await page.getByRole('button', { name: 'Team alignment' }).click()
  await expect(page.getByText('Decisions stay visible')).toBeVisible()
})
