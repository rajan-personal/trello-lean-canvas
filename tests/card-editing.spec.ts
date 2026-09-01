import { expect, test } from '@playwright/test'
import { openSampleCanvas } from './support/canvas-fixtures'

test('reveals a cross on hover and deletes the card', async ({ page }) => {
  await page.setViewportSize({ width: 1424, height: 797 })
  await openSampleCanvas(page)

  const card = page.getByRole('button', {
    name: 'Weekly status updates take team leads 2–3 hours',
    exact: true,
  })
  await card.hover()
  const deleteButton = page.getByRole('button', {
    name: 'Delete “Weekly status updates take team leads 2–3 hours”',
    exact: true,
  })
  await expect(deleteButton).toHaveCSS('opacity', '1')

  const cardBox = await card.locator('..').boundingBox()
  const deleteBox = await deleteButton.boundingBox()
  expect(cardBox).not.toBeNull()
  expect(deleteBox).not.toBeNull()
  expect(deleteBox!.x).toBeGreaterThanOrEqual(cardBox!.x)
  expect(deleteBox!.y).toBeGreaterThanOrEqual(cardBox!.y)
  expect(deleteBox!.x + deleteBox!.width).toBeLessThanOrEqual(
    cardBox!.x + cardBox!.width,
  )
  expect(deleteBox!.y + deleteBox!.height).toBeLessThanOrEqual(
    cardBox!.y + cardBox!.height,
  )

  await deleteButton.click()

  await expect(card).toHaveCount(0)
  await expect(page.getByRole('status')).toHaveText('Card deleted')
})

test('edits cards with one save action and dismisses on outside click', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1424, height: 797 })
  await openSampleCanvas(page)

  const section = page.locator('.canvas-column.problem .canvas-cell').first()
  const card = page.getByRole('button', {
    name: 'Weekly status updates take team leads 2–3 hours',
    exact: true,
  })
  await card.click()
  await expect(page.getByRole('textbox', { name: 'Edit card' })).toHaveCount(0)
  await card.dblclick()
  const editor = page.getByRole('textbox', { name: 'Edit card' })
  await expect(editor).toBeVisible()
  await editor.fill('Unsaved note')
  expect(
    await editor.evaluate((element) => element.getBoundingClientRect().height),
  ).toBeLessThanOrEqual(40)
  await expect(section.locator('.inline-card-actions button')).toHaveCount(1)

  await section.locator('.cell-heading strong').click()
  await expect(editor).toHaveCount(0)
  await expect(card).toBeVisible()

  await card.dblclick()
  await page.getByRole('textbox', { name: 'Edit card' }).fill('Saved note')
  await page.getByRole('button', { name: 'Save', exact: true }).click()
  await expect(
    page.getByRole('button', { name: 'Saved note', exact: true }),
  ).toBeVisible()
})

test('dismisses the add-card composer outside while preserving its draft', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1424, height: 797 })
  await openSampleCanvas(page)

  const section = page.locator('.canvas-column.solution .canvas-cell').first()
  await section.getByRole('button', { name: '＋ Add a card' }).click()
  const composer = section.getByRole('textbox', { name: 'New card' })
  await composer.fill('A draft worth keeping')
  await expect(
    section.getByRole('button', { name: 'Cancel adding card' }),
  ).toHaveCount(0)

  await section.locator('.cell-heading').click()
  await expect(composer).toHaveCount(0)

  await section.getByRole('button', { name: '＋ Add a card' }).click()
  const reopenedComposer = section.getByRole('textbox', { name: 'New card' })
  await expect(reopenedComposer).toHaveValue('A draft worth keeping')
  await expect(reopenedComposer).toBeFocused()
  await expect
    .poll(() =>
      reopenedComposer.evaluate((element) =>
        element instanceof HTMLTextAreaElement ? element.selectionStart : -1,
      ),
    )
    .toBe('A draft worth keeping'.length)
})
