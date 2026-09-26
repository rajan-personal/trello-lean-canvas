import { expect, test } from '@playwright/test'
import { addBoardCard, openBoard, openBoardCard } from './support/board-fixtures'

test('user and agent comments share a persistent, plain-text task thread on mobile', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await openBoard(page)
  await addBoardCard(page, 'Review comments')
  await page.evaluate(() => {
    const key = 'lean-canvas:boards:v1'
    const boards = JSON.parse(localStorage.getItem(key)!)
    const board = Object.values(boards)[0] as { cards: { id: string }[]; comments: unknown[] }
    board.comments.push({ id: 'agent-review', cardId: board.cards[0].id, authorId: 'agent', authorName: 'Review agent',
      authorType: 'agent', text: '<script>not executable</script>\nTests pass.', createdAt: '2026-09-01T10:00:00.000Z' })
    localStorage.setItem(key, JSON.stringify(boards))
  })
  await page.reload()
  await openBoardCard(page, 'Review comments')
  const thread = page.getByRole('region', { name: 'Comments', exact: true })
  await expect(thread.getByText('Agent', { exact: true })).toBeVisible()
  await expect(thread.locator('script')).toHaveCount(0)
  await expect(thread.getByText('<script>not executable</script> Tests pass.')).toBeVisible()
  await thread.getByLabel('New comment').fill('Thanks!\nReady for review.')
  await thread.getByRole('button', { name: 'Add comment' }).click()
  await expect(thread.getByLabel('New comment')).toHaveValue('')
  await expect(thread.getByRole('listitem')).toHaveCount(2)
  await expect(thread.getByRole('listitem').last()).toContainText('User')
  await expect(page.getByRole('status').filter({ hasText: 'Comment added.' })).toBeVisible()
  await page.reload()
  await expect(thread.getByRole('listitem')).toHaveCount(2)
  await expect(thread.getByRole('listitem').last()).toContainText('Thanks! Ready for review.')
  await expect(thread.getByLabel('New comment')).toHaveAttribute('maxlength', '10000')
  await expect(page.getByRole('dialog')).toBeVisible()
})
