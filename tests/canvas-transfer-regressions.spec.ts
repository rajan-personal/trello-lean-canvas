import { readFile } from 'node:fs/promises'
import { expect, test } from '@playwright/test'
import { load } from 'js-yaml'
import { openSampleCanvas, uploadCanvas } from './support/canvas-fixtures'

test('invalid upload keeps the canvas, retry imports, and download contains rendered edits', async ({ page }) => {
  await openSampleCanvas(page)
  const upload = page.getByLabel('Upload canvas YAML file')
  await upload.setInputFiles({ name: 'invalid.yaml', mimeType: 'application/yaml', buffer: Buffer.from('canvas: [') })
  await expect(page.getByRole('status')).toContainText('unexpected end')
  await expect(page.getByRole('heading', { name: 'Pulse' })).toBeVisible()
  await expect(upload).toHaveValue('')
  await uploadCanvas(page, { name: 'Retry canvas' }, 'retry.yaml')
  await expect(page.getByRole('heading', { name: 'Retry canvas' })).toBeVisible()
  await page.locator('.canvas-cell').first().getByRole('button', { name: '＋ Add a card' }).click()
  await page.getByRole('textbox', { name: 'New card' }).fill('Export heading\nExport body')
  await page.getByRole('button', { name: 'Add card', exact: true }).click()
  await page.getByRole('button', { name: 'Favorite canvas' }).click()
  await page.getByRole('button', { name: 'Notepad', exact: true }).click()
  await page.getByRole('textbox', { name: 'Canvas notes' }).fill('Export notes')
  const downloaded = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Download canvas data as YAML' }).click()
  const file = await downloaded
  expect(file.suggestedFilename()).toBe('retry-canvas.yaml')
  const data = load(await readFile((await file.path())!, 'utf8')) as {
    canvas: { name: string; favorite: boolean; notes: string; sections: { cards: string[] }[] }
  }
  expect(data.canvas.name).toBe('Retry canvas')
  expect(data.canvas.favorite).toBe(true)
  expect(data.canvas.notes).toBe('Export notes')
  expect(data.canvas.sections[0].cards).toEqual(['Export heading\nExport body'])
})
