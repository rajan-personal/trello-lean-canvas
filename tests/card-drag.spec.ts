import { expect, test } from '@playwright/test'
import { openSampleCanvas } from './support/canvas-fixtures'

test('reorders cards vertically with drag and drop and persists the order', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1424, height: 797 })
  await openSampleCanvas(page)

  const problemSection = page
    .locator('.canvas-column.problem .canvas-cell')
    .first()
  const firstCard = problemSection
    .locator('.canvas-card')
    .filter({ hasText: 'Decisions disappear across chat, docs, and meetings' })
  const thirdCard = problemSection
    .locator('.canvas-card')
    .filter({ hasText: 'Remote teams cannot see blockers early enough' })
  const thirdCardBox = await thirdCard.boundingBox()
  expect(thirdCardBox).not.toBeNull()

  await firstCard.dragTo(thirdCard, {
    targetPosition: { x: 20, y: thirdCardBox!.height - 2 },
  })

  await expect(page.getByRole('status')).toHaveText('Card moved')
  await expect(
    problemSection.locator('.card-content').nth(0),
  ).toHaveAccessibleName('Weekly status updates take team leads 2–3 hours')
  await expect(
    problemSection.locator('.card-content').nth(1),
  ).toHaveAccessibleName('Remote teams cannot see blockers early enough')
  await expect(
    problemSection.locator('.card-content').nth(2),
  ).toHaveAccessibleName('Decisions disappear across chat, docs, and meetings')

  await page.reload()
  await page
    .getByRole('button', { name: 'Team alignment', exact: true })
    .click()
  await expect(
    problemSection.locator('.card-content').nth(2),
  ).toHaveAccessibleName('Decisions disappear across chat, docs, and meetings')
})
