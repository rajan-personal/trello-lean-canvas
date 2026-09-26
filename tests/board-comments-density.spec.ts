import { expect, test } from '@playwright/test'
import { addBoardCard, openBoard, openBoardCard } from './support/board-fixtures'

for (const width of [390, 1440]) test(`compact comment layout stays readable and expands for drafts at ${width}px`, async ({ page }) => {
  await page.setViewportSize({ width, height: 900 })
  await openBoard(page)
  await addBoardCard(page, 'Compact discussion')
  await openBoardCard(page, 'Compact discussion')
  const dialog = page.getByRole('dialog')
  const comments = dialog.getByRole('region', { name: 'Comments' })
  const form = comments.locator('form')
  const input = comments.getByLabel('New comment')
  const height = async () => (await form.boundingBox())!.height
  expect(await height()).toBeLessThan(100)
  expect((await comments.getByText('No comments yet.').boundingBox())!.height).toBeLessThan(30)
  if (width > 760) {
    expect((await comments.boundingBox())!.width / (await dialog.boundingBox())!.width).toBeLessThan(.4)
  }
  // The icon button still has a clear accessible name and a mobile-sized target.
  const send = comments.getByRole('button', { name: 'Add comment' })
  await expect(send).toBeDisabled()
  const sendBox = (await send.boundingBox())!
  expect(sendBox.width).toBeGreaterThanOrEqual(width < 760 ? 44 : 36)
  expect(sendBox.height).toBeGreaterThanOrEqual(width < 760 ? 44 : 36)
  for (const fallback of [false, true]) {
    if (fallback) await page.addStyleTag({ content: '.kanban-comment-composer textarea { field-sizing: fixed !important; }' })
    await input.fill(`Update ${fallback ? 'two' : 'one'}\nSecond line`)
    expect((await input.boundingBox())!.height).toBeGreaterThanOrEqual(72)
    await dialog.getByLabel('Title', { exact: true }).focus()
    expect((await input.boundingBox())!.height).toBeGreaterThanOrEqual(72)
    await expect(input).toHaveValue(`Update ${fallback ? 'two' : 'one'}\nSecond line`)
    await send.click()
    await expect(input).toHaveValue('')
    await dialog.getByLabel('Title', { exact: true }).focus()
    expect(await height()).toBeLessThan(100)
  }
  await expect(comments.getByRole('listitem')).toHaveCount(2)
  expect((await comments.locator('.kanban-comment-thread').boundingBox())!.height).toBeLessThan(210)
  const bodyFont = await comments.locator('li p').first().evaluate((element) => parseFloat(getComputedStyle(element).fontSize))
  expect(bodyFont).toBeGreaterThanOrEqual(14)
  expect(await comments.evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true)
})
