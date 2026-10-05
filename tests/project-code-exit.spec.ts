import { expect, test } from '@playwright/test'
import { code, markdown, openCode, openNotepad, placeCaret } from './support/code-editor'

for (const surface of ['About', 'Notepad'] as const) {
  for (const mobile of [false, true]) {
    test(`${surface} exits on the second Enter at the end on ${mobile ? 'mobile' : 'desktop'}`, async ({ page }) => {
      await page.setViewportSize(mobile ? { width: 390, height: 844 } : { width: 1440, height: 900 })
      const editor = await openCode(page, surface)
      await placeCaret(editor)
      await expect(page.getByRole('button', { name: 'Exit code block', exact: true })).toHaveCount(0)
      await page.keyboard.press('Enter')
      expect(await editor.locator('pre').textContent()).toBe(`${code}\n`)
      await expect(editor.locator('pre + p')).toHaveCount(0)
      await page.keyboard.press('Enter')
      await expect(editor.locator('pre + p')).toHaveCount(1)
      await expect(editor).toBeFocused()
      await page.keyboard.type('Continue outside the code block.')
      expect(await editor.locator('pre').textContent()).toBe(code)
      await expect(editor.locator('pre code')).toHaveClass('language-js')
      await expect(editor.locator('pre + p')).toHaveText('Continue outside the code block.')

      if (surface === 'About') await page.getByRole('button', { name: 'Save', exact: true }).click()
      const expected = `${markdown}\n\nContinue outside the code block.`
      await expect.poll(() => page.evaluate((surface) => JSON.parse(localStorage.getItem('lean-canvas:v2')!)[0][surface === 'About' ? 'about' : 'notes'], surface)).toBe(expected)
      await page.reload()
      if (surface === 'Notepad') await openNotepad(page)
      await expect(editor.locator('pre')).toHaveText(code)
      await expect(editor.locator('pre + p')).toHaveText('Continue outside the code block.')
    })
  }
}

test('undo and redo preserve the code and restore the final empty line', async ({ page }) => {
  const editor = await openCode(page, 'About')
  await placeCaret(editor)
  await page.keyboard.type('// recent edit')
  await page.keyboard.press('Enter')
  await page.keyboard.press('Enter')
  await expect(editor.locator('pre + p')).toHaveCount(1)
  await page.getByRole('button', { name: 'Undo', exact: true }).click()
  await expect(editor.locator('pre + p')).toHaveCount(0)
  expect(await editor.locator('pre').textContent()).toBe(`${code}// recent edit\n`)
  await page.getByRole('button', { name: 'Redo', exact: true }).click()
  await expect(editor.locator('pre + p')).toHaveCount(1)
  expect(await editor.locator('pre').textContent()).toBe(`${code}// recent edit`)
})

test('two Enters in the middle keep blank lines inside code', async ({ page }) => {
  const editor = await openCode(page, 'About')
  await placeCaret(editor, code.indexOf('\n') + 1)
  await page.keyboard.press('Enter')
  await page.keyboard.press('Enter')
  expect(await editor.locator('pre').textContent()).toBe(code.replace('\n', '\n\n\n'))
  await expect(editor.locator('pre + p')).toHaveCount(0)
})

test('soft-keyboard paragraph input exits on the last empty line', async ({ page }) => {
  const editor = await openCode(page, 'Notepad')
  await placeCaret(editor)
  await page.keyboard.press('Enter')
  const canceled = await editor.evaluate((element) => !element.dispatchEvent(new InputEvent('beforeinput', {
    inputType: 'insertParagraph', bubbles: true, cancelable: true,
  })))
  expect(canceled).toBe(true)
  await page.keyboard.type('After code')
  expect(await editor.locator('pre').textContent()).toBe(code)
  await expect(editor.locator('pre + p')).toHaveText('After code')
})

test('Ctrl/Command+Enter still exits immediately', async ({ page }) => {
  const editor = await openCode(page, 'About')
  await placeCaret(editor)
  await page.keyboard.press('ControlOrMeta+Enter')
  await page.keyboard.type('Normal text')
  expect(await editor.locator('pre').textContent()).toBe(code)
  await expect(editor.locator('pre + p')).toHaveText('Normal text')
})
