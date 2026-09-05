import { readFile } from 'node:fs/promises'
import { expect, test } from '@playwright/test'
import { load } from 'js-yaml'
import { canvasToYaml } from '../src/data/yaml'
import { populatedBoard } from '../unit/board-fixtures'
import { canvas } from '../unit/fixtures'

test('imports, reloads, exports and deletes board records without changing Lean Canvas notes', async ({ page }) => {
  await page.goto('/')
  const original = canvas('source')
  original.name = original.title = 'Board transfer'
  original.sections[0].cards = ['Separate Lean Canvas note']
  const chooser = page.waitForEvent('filechooser')
  await page.getByRole('button', { name: 'Add canvas' }).click()
  await page.getByRole('button', { name: 'Upload' }).click()
  await (await chooser).setFiles({ name: 'board.yaml', mimeType: 'application/yaml',
    buffer: Buffer.from(canvasToYaml(original, populatedBoard())) })
  await expect(page.getByRole('heading', { name: 'Board transfer' })).toBeVisible()
  await expect.poll(() => page.evaluate(() => Object.keys(JSON.parse(localStorage.getItem('lean-canvas:boards:v1') ?? '{}')).length)).toBe(1)
  await page.reload()
  await expect(page.getByText('Separate Lean Canvas note')).toBeVisible()
  const download = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Download canvas data as YAML' }).click()
  const path = await (await download).path()
  const data = load(await readFile(path!, 'utf8')) as { canvas: { id: string }; board: unknown }
  expect(data.canvas.id).not.toBe(original.id)
  expect(data.board).toEqual(populatedBoard())
  page.once('dialog', (dialog) => dialog.accept())
  await page.getByRole('button', { name: 'Delete board' }).click()
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('lean-canvas:boards:v1') ?? '{}'))).toEqual({})
  await page.reload()
  await expect(page.getByRole('heading', { name: 'Board transfer' })).toHaveCount(0)
})
