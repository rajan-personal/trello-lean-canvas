import { readFile } from 'node:fs/promises'
import { expect, test } from '@playwright/test'
import { load } from 'js-yaml'
import type { BoardData } from '../src/data/board'
import { addBoardCard, column, openBoard, openBoardCard } from './support/board-fixtures'

test('round trips UI-created cards, ordering, description and comments through YAML into an independent canvas', async ({ page }) => {
  await openBoard(page)
  await addBoardCard(page, 'Exported card', 'Review')
  await openBoardCard(page, 'Exported card')
  const modal = page.getByRole('dialog')
  await modal.getByLabel('Description').fill('Portable details')
  await modal.getByLabel('New comment').fill('Portable discussion')
  await modal.getByRole('button', { name: 'Add comment' }).click()
  await expect(modal.getByLabel('New comment')).toHaveValue('')
  await modal.getByRole('button', { name: 'Save', exact: true }).click()
  await expect(modal).toHaveCount(0)
  const download = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Download canvas data as YAML' }).click()
  const yaml = await readFile((await (await download).path())!, 'utf8')
  const bundle = load(yaml) as { version: number; board: BoardData }
  expect(bundle.board.cards[0]).toMatchObject({ title: 'Exported card', columnId: 'review', description: 'Portable details' })
  expect(bundle.board.comments[0]).toMatchObject({ text: 'Portable discussion', authorName: 'Test User' })
  const chooser = page.waitForEvent('filechooser')
  await page.getByRole('button', { name: 'Add canvas' }).click()
  await page.getByRole('button', { name: 'Upload' }).click()
  await (await chooser).setFiles({ name: 'round-trip.yaml', mimeType: 'application/yaml', buffer: Buffer.from(yaml) })
  await expect(page.getByRole('navigation', { name: 'Lean canvases' }).getByRole('button')).toHaveCount(2)
  await expect(column(page, 'Review').locator('.kanban-card')).toHaveText('Exported card')
  const boards = await page.evaluate(() => Object.values(JSON.parse(localStorage.getItem('lean-canvas:boards:v1')!)))
  expect(boards).toEqual([bundle.board, bundle.board])
  await openBoardCard(page, 'Exported card')
  await expect(modal.getByText('Portable discussion', { exact: true })).toBeVisible()
  page.once('dialog', (dialog) => dialog.accept())
  await modal.getByRole('button', { name: 'Delete card' }).click()
  await page.getByRole('navigation', { name: 'Lean canvases' }).getByRole('button').first().click()
  await expect(column(page, 'Review').locator('.kanban-card')).toHaveText('Exported card')
})
