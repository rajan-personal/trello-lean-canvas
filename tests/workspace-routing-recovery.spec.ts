import { expect, test } from '@playwright/test'
import { answerHistoryNavigation } from './support/history-navigation'
import { addBoardCard, openBoard, openBoardCard } from './support/board-fixtures'
import { loadSamples } from './support/canvas-fixtures'

test('unknown and inaccessible projects do not fall back to another canvas', async ({ page }) => {
  await loadSamples(page)
  const first = page.url()
  await page.goto('/project/not-owned/ticket/no-ticket')
  await expect(page.getByRole('alert')).toContainText('This project is unavailable')
  await expect(page.getByRole('heading')).toHaveCount(0)
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await page.getByRole('button', { name: 'Go to workspace' }).click()
  await expect(page).toHaveURL(first)
  await page.goto('/not-a-route')
  await expect(page.getByRole('alert')).toContainText('Page not found')
})

test('missing ticket keeps parent Board; deleting an open ticket preserves drafts until closed', async ({ page }) => {
  await openBoard(page)
  const parent = page.url()
  await page.goto(`${parent}/missing`)
  await expect(page.getByRole('alert')).toContainText('This ticket is unavailable')
  await page.getByRole('button', { name: 'Close ticket' }).click()
  await expect(page).toHaveURL(parent)
  await addBoardCard(page, 'Deleted ticket')
  await openBoardCard(page, 'Deleted ticket')
  const ticket = page.url()
  await page.getByLabel('Description').fill('Copy before close')
  await page.evaluate(() => {
    const boards = JSON.parse(localStorage.getItem('lean-canvas:boards:v1')!)
    for (const board of Object.values(boards) as { cards: unknown[] }[]) board.cards = []
    localStorage.setItem('lean-canvas:boards:v1', JSON.stringify(boards))
    window.dispatchEvent(new Event('lean-canvas-board-change'))
  })
  await expect(page.getByRole('dialog').getByRole('alert')).toContainText('deleted elsewhere')
  await expect(page.getByLabel('Description')).toHaveValue('Copy before close')
  page.once('dialog', (dialog) => dialog.dismiss())
  await page.getByRole('button', { name: 'Close dialog' }).click()
  await expect(page).toHaveURL(ticket)
  page.once('dialog', (dialog) => dialog.accept())
  await page.getByRole('button', { name: 'Close dialog' }).click()
  await expect(page).toHaveURL(parent)
  await page.goto(ticket)
  await expect(page.getByRole('alert')).toContainText('This ticket is unavailable')
})

test('Canvas draft survives cancelled browser Back; confirmation navigates and forward restores selection', async ({ page }) => {
  await loadSamples(page)
  const first = page.url()
  await page.getByRole('button', { name: 'Facebook', exact: true }).click()
  const second = page.url()
  await page.getByRole('button', { name: '＋ Add a card', exact: true }).first().click()
  await page.getByLabel('New card', { exact: true }).fill('Unsaved Canvas draft')
  await answerHistoryNavigation(page, -1, false)
  await expect(page).toHaveURL(second)
  await expect(page.getByLabel('New card', { exact: true })).toHaveValue('Unsaved Canvas draft')
  const prevented = await page.evaluate(() => {
    const event = new Event('beforeunload', { cancelable: true })
    window.dispatchEvent(event)
    return event.defaultPrevented
  })
  expect(prevented).toBe(true)
  await answerHistoryNavigation(page, -1, true)
  await expect(page).toHaveURL(first)
  await page.goForward()
  await expect(page).toHaveURL(second)
  await expect(page.getByLabel('New card', { exact: true })).toHaveCount(0)
})
