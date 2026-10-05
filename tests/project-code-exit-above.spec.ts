import { expect, test } from '@playwright/test'
import { code, markdown, openCode, openNotepad, placeCaret } from './support/code-editor'

for (const surface of ['About', 'Notepad'] as const) {
  for (const mobile of [false, true]) {
    test(`${surface} exits above on the third Enter at the start on ${mobile ? 'mobile' : 'desktop'}`, async ({ page }) => {
      await page.setViewportSize(mobile ? { width: 390, height: 844 } : { width: 1440, height: 900 })
      const editor = await openCode(page, surface)
      await placeCaret(editor, 0)
      await page.keyboard.press('Enter')
      expect(await editor.locator('pre').textContent()).toBe(`\n${code}`)
      await expect(editor.locator('p')).toHaveCount(0)
      await page.keyboard.press('Enter')
      expect(await editor.locator('pre').textContent()).toBe(`\n\n${code}`)
      await expect(editor.locator('p')).toHaveCount(0)
      await page.keyboard.press('Enter')
      await expect(editor.locator('p + pre')).toHaveCount(1)
      await expect(editor).toBeFocused()
      await page.keyboard.type('Introduction above code.')
      expect(await editor.locator('pre').textContent()).toBe(code)
      await expect(editor.locator('pre code')).toHaveClass('language-js')
      await expect(editor.locator('p')).toHaveText('Introduction above code.')
      if (surface === 'About') await page.getByRole('button', { name: 'Save', exact: true }).click()
      await expect.poll(() => page.evaluate((surface) => JSON.parse(localStorage.getItem('lean-canvas:v2')!)[0][surface === 'About' ? 'about' : 'notes'], surface)).toBe(`Introduction above code.\n\n${markdown}`)
      await page.reload()
      if (surface === 'Notepad') await openNotepad(page)
      await expect(editor.locator('p + pre')).toHaveCount(1)
      await expect(editor.locator('p')).toHaveText('Introduction above code.')
      expect(await editor.locator('pre').textContent()).toBe(code)
    })
  }
}

test('undo and redo restore the leading newlines without removing code edits', async ({ page }) => {
  const editor = await openCode(page, 'About')
  await placeCaret(editor, 0)
  await page.keyboard.type('// recent edit\n')
  await placeCaret(editor, 0)
  for (let i = 0; i < 3; i++) await page.keyboard.press('Enter')
  await expect(editor.locator('p + pre')).toHaveCount(1)
  await page.getByRole('button', { name: 'Undo', exact: true }).click()
  await expect(editor.locator('p')).toHaveCount(0)
  expect(await editor.locator('pre').textContent()).toBe(`\n\n// recent edit\n${code}`)
  await page.getByRole('button', { name: 'Redo', exact: true }).click()
  await expect(editor.locator('p + pre')).toHaveCount(1)
  expect(await editor.locator('pre').textContent()).toBe(`// recent edit\n${code}`)
})

test('soft-keyboard paragraph input also exits above code', async ({ page }) => {
  const editor = await openCode(page, 'Notepad')
  await placeCaret(editor, 0)
  await page.keyboard.press('Enter')
  await page.keyboard.press('Enter')
  const canceled = await editor.evaluate((element) => !element.dispatchEvent(new InputEvent('beforeinput', {
    inputType: 'insertParagraph', bubbles: true, cancelable: true,
  })))
  expect(canceled).toBe(true)
  await page.keyboard.type('Above code')
  await expect(editor.locator('p + pre')).toHaveCount(1)
  await expect(editor.locator('p')).toHaveText('Above code')
  expect(await editor.locator('pre').textContent()).toBe(code)
})
