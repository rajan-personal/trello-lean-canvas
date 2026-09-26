import { expect, test } from '@playwright/test'
import { addBoardCard, openBoard, openBoardCard } from './support/board-fixtures'

test('composer preserves newlines and IME composition; Ctrl/Command+Enter posts once', async ({ page }) => {
  await openBoard(page)
  await addBoardCard(page, 'Discuss the release')
  await openBoardCard(page, 'Discuss the release')
  const comments = page.getByRole('region', { name: 'Comments', exact: true })
  const input = comments.getByLabel('New comment')
  await expect(comments.getByText('No comments yet.')).toBeVisible()
  for (const modifier of ['Control', 'Meta']) {
    await input.fill(`${modifier} update`)
    await input.press('Enter')
    await expect(input).toHaveValue(`${modifier} update\n`)
    await input.evaluate((element) => element.dispatchEvent(new KeyboardEvent('keydown', {
      key: 'Enter', ctrlKey: true, isComposing: true, bubbles: true,
    })))
    await expect(input).toHaveValue(`${modifier} update\n`)
    await input.press(`${modifier}+Enter`)
    await expect(input).toHaveValue('')
    await expect(comments.getByText(`${modifier} update`, { exact: true })).toBeVisible()
  }
  await expect(comments.getByRole('listitem')).toHaveCount(2)
  await expect(comments.locator('.kanban-comments-count')).toHaveText('2')
})

for (const width of [320, 760, 1440]) test(`long author names and comment bodies stay inside the panel at ${width}px`, async ({ page }) => {
  await page.setViewportSize({ width, height: 900 })
  await openBoard(page)
  await addBoardCard(page, 'Long discussion')
  await page.evaluate(() => {
    const key = 'lean-canvas:boards:v1'
    const boards = JSON.parse(localStorage.getItem(key)!)
    const board = Object.values(boards)[0] as { cards: { id: string }[]; comments: unknown[]; columns: { title: string }[] }
    board.columns[0].title = 'A very long workflow status '.repeat(12)
    board.comments.push({ id: 'long-agent', cardId: board.cards[0].id, authorId: 'agent', authorName: 'ReviewAgent'.repeat(30),
      authorType: 'agent', text: 'https://example.com/' + 'long-link'.repeat(100), createdAt: '2026-09-26T08:00:00.000Z' })
    localStorage.setItem(key, JSON.stringify(boards))
  })
  await page.reload()
  await openBoardCard(page, 'Long discussion')
  const dialog = page.getByRole('dialog')
  const comments = dialog.getByRole('region', { name: 'Comments' })
  await expect(comments.getByText('Agent', { exact: true })).toBeVisible()
  expect(await comments.evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true)
  expect(await dialog.evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true)
  const header = (await dialog.locator(':scope > header').boundingBox())!
  expect(header.height).toBeLessThan(120)
  const composer = comments.getByLabel('New comment')
  await composer.fill('Still usable')
  await comments.getByRole('button', { name: 'Add comment' }).click()
  await expect(comments.getByText('Still usable', { exact: true })).toBeVisible()
})
