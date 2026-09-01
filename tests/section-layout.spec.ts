import { expect, test } from '@playwright/test'
import { openSampleCanvas } from './support/canvas-fixtures'

test('keeps every add-card action below the section cards', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1424, height: 797 })
  await openSampleCanvas(page)

  const sections = await page.locator('.canvas-cell').evaluateAll((elements) =>
    elements.map((element) => {
      const sectionRect = element.getBoundingClientRect()
      const buttonRect = element
        .querySelector('.add-card-button')
        ?.getBoundingClientRect()
      const cardBottoms = [...element.querySelectorAll('.canvas-card')].map(
        (card) => card.getBoundingClientRect().bottom,
      )

      return {
        sectionBottom: sectionRect.bottom,
        buttonTop: buttonRect?.top,
        buttonBottom: buttonRect?.bottom,
        lastCardBottom: cardBottoms.length ? Math.max(...cardBottoms) : null,
      }
    }),
  )

  for (const section of sections) {
    expect(section.buttonBottom).toBeLessThanOrEqual(section.sectionBottom)
    if (section.lastCardBottom !== null) {
      expect(section.buttonTop).toBeGreaterThanOrEqual(section.lastCardBottom)
      expect(section.lastCardBottom).toBeLessThanOrEqual(section.sectionBottom)
    }
  }
})
