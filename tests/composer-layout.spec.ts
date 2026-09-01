import { expect, test } from '@playwright/test'
import { openSampleCanvas, uploadCanvas } from './support/canvas-fixtures'

test('expands the white column for the composer without nested scrolling', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1424, height: 797 })
  await openSampleCanvas(page)

  const column = page.locator('.canvas-column.solution')
  const section = column.locator('.canvas-cell').first()
  const initialColumnHeight = await column.evaluate(
    (element) => element.getBoundingClientRect().height,
  )
  await section.getByRole('button', { name: '＋ Add a card' }).click()

  const layout = await section.evaluate((element) => {
    const composer = element.querySelector('.card-composer')
    if (!composer || !element.parentElement)
      throw new Error('Composer layout is incomplete')

    const sectionRect = element.getBoundingClientRect()
    const composerRect = composer.getBoundingClientRect()
    const cardBottoms = [...element.querySelectorAll('.canvas-card')].map(
      (card) => card.getBoundingClientRect().bottom,
    )

    return {
      columnHeight: element.parentElement.getBoundingClientRect().height,
      sectionTop: sectionRect.top,
      sectionBottom: sectionRect.bottom,
      sectionClientHeight: element.clientHeight,
      sectionScrollHeight: element.scrollHeight,
      composerTop: composerRect.top,
      composerBottom: composerRect.bottom,
      lastCardBottom: Math.max(...cardBottoms),
    }
  })

  expect(layout.columnHeight).toBeGreaterThan(initialColumnHeight)
  expect(layout.sectionScrollHeight).toBe(layout.sectionClientHeight)
  expect(layout.composerTop).toBeGreaterThanOrEqual(layout.lastCardBottom)
  expect(layout.composerTop).toBeGreaterThanOrEqual(layout.sectionTop)
  expect(layout.composerBottom).toBeLessThanOrEqual(layout.sectionBottom)
})

test('keeps the first card anchored when it changes from composer to saved card', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1424, height: 797 })
  await openSampleCanvas(page)

  await uploadCanvas(page, { name: 'Blank canvas' }, 'blank-canvas.yaml')

  const emptyMainCellHeights = await page
    .locator('.canvas-column .canvas-cell')
    .evaluateAll((cells) =>
      cells.map((cell) => Math.round(cell.getBoundingClientRect().height)),
    )
  const emptyBottomCellHeights = await page
    .locator('.bottom-panel .canvas-cell')
    .evaluateAll((cells) =>
      cells.map((cell) => Math.round(cell.getBoundingClientRect().height)),
    )
  expect(Math.min(...emptyMainCellHeights)).toBeGreaterThanOrEqual(200)
  expect(Math.min(...emptyBottomCellHeights)).toBeGreaterThanOrEqual(150)

  const section = page.locator('.canvas-column.problem .canvas-cell').first()
  await section.getByRole('button', { name: '＋ Add a card' }).click()
  const composerTop = await section
    .getByRole('textbox', { name: 'New card' })
    .evaluate((element) => element.getBoundingClientRect().top)

  await section.getByRole('textbox', { name: 'New card' }).fill('First card')
  await section.getByRole('button', { name: 'Add card' }).click()
  const savedCardTop = await section
    .getByRole('button', { name: 'First card', exact: true })
    .evaluate((element) => element.getBoundingClientRect().top)

  expect(savedCardTop).toBe(composerTop)
})
