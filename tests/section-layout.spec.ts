import { expect, test } from '@playwright/test'
import { openSampleCanvas, uploadCanvas } from './support/canvas-fixtures'

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

for (const width of [1440, 390]) {
  test(`blank canvas helper text fits all twelve sections at ${width}px`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: 900 })
    await page.goto('/')
    await uploadCanvas(page, { name: 'Blank canvas' }, 'blank-canvas.yaml')
    await page.getByRole('tab', { name: 'Canvas', exact: true }).click()
    const hints = page.locator('.cell-hint')
    await expect(hints).toHaveCount(12)
    for (const hint of await hints.all()) {
      await hint.scrollIntoViewIfNeeded()
      await expect(hint).toBeVisible()
      await expect(hint).toHaveCSS('font-size', '12px')
      await expect(hint).toHaveCSS('line-height', '16px')
      await expect(hint).toHaveCSS('color', 'rgb(68, 84, 111)')
      expect(await hint.evaluate((element) => {
        const rect = element.getBoundingClientRect()
        const section = element.closest('section')!.getBoundingClientRect()
        return element.scrollHeight <= element.clientHeight && rect.top >= section.top && rect.bottom <= section.bottom
      })).toBe(true)
    }
    await page.locator('.board-scroll').evaluate((element) => { element.scrollLeft = 0; element.scrollTop = 0 })
    const path = testInfo.outputPath(`readability-${width}.png`)
    await page.screenshot({ path, fullPage: true })
    await testInfo.attach(`Readability ${width}px`, { path, contentType: 'image/png' })
  })
}
