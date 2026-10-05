import { expect, test, type Page } from '@playwright/test'
import { loadSamples } from './support/canvas-fixtures'

const code = 'const answer = 42\nconsole.log(answer)'
const markdown = `\`\`\`js\n${code}\n\`\`\``

async function openNotepad(page: Page) {
  if (page.viewportSize()!.width < 761) await page.getByRole('button', { name: 'More actions', exact: true }).click()
  await page.getByRole('button', { name: 'Notepad', exact: true }).click()
}

async function openCode(page: Page, surface: 'About' | 'Notepad') {
  await page.route('https://fonts.googleapis.com/**', (route) => route.abort())
  await loadSamples(page)
  await page.evaluate(({ surface, markdown }) => {
    const canvases = JSON.parse(localStorage.getItem('lean-canvas:v2')!)
    canvases[0][surface === 'About' ? 'about' : 'notes'] = markdown
    localStorage.setItem('lean-canvas:v2', JSON.stringify(canvases))
  }, { surface, markdown })
  await page.reload()
  if (surface === 'About') await page.getByRole('tab', { name: 'About', exact: true }).click()
  else await openNotepad(page)
  return page.getByRole('textbox', { name: surface === 'About' ? 'Project details' : 'Canvas notes', exact: true })
}

for (const surface of ['About', 'Notepad'] as const) {
  for (const mobile of [false, true]) {
    test(`${surface} exits a final code block using the toolbar on ${mobile ? 'mobile' : 'desktop'}`, async ({ page }, testInfo) => {
      await page.setViewportSize(mobile ? { width: 390, height: 844 } : { width: 1440, height: 900 })
      const editor = await openCode(page, surface)
      const toolbar = editor.locator('xpath=ancestor::div[contains(@class, "project-rich-text-editor")]')
      const exit = toolbar.getByRole('button', { name: 'Exit code block', exact: true })
      await editor.locator('pre').click()
      // A cursor in the middle must leave the entire code block intact.
      await editor.press('ControlOrMeta+Home')
      await editor.press('ArrowRight')
      await expect(exit).toBeVisible()
      await exit.click()
      await expect(editor).toBeFocused()
      await expect(exit).toHaveCount(0)
      await page.keyboard.type('Continue outside the code block.')
      await expect(editor.locator('pre')).toHaveText(code)
      await expect(editor.locator('pre code')).toHaveClass('language-js')
      await expect(editor.locator('pre + p')).toHaveText('Continue outside the code block.')
      await page.screenshot({ path: testInfo.outputPath('outside-code-block.png') })

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

test('exiting a newly created code block is undoable without removing its formatting', async ({ page }) => {
  const editor = await openCode(page, 'About')
  await editor.locator('pre').click()
  await page.getByRole('button', { name: 'Code block', exact: true }).click()
  await editor.fill('New code')
  await page.getByRole('button', { name: 'Code block', exact: true }).click()
  await page.getByRole('button', { name: 'Exit code block', exact: true }).click()
  await expect(editor.locator('pre + p')).toHaveCount(1)
  await page.getByRole('button', { name: 'Undo', exact: true }).click()
  await expect(editor.locator('pre + p')).toHaveCount(0)
  await expect(editor.locator('pre')).toHaveText('New code')
  await page.getByRole('button', { name: 'Redo', exact: true }).click()
  await expect(editor.locator('pre + p')).toHaveCount(1)
  await expect(editor.locator('pre')).toHaveText('New code')
})

test('normal Enter stays in code and Ctrl/Command+Enter exits without changing it', async ({ page }) => {
  const editor = await openCode(page, 'About')
  await editor.locator('pre').click()
  await editor.evaluate((element) => {
    const range = document.createRange()
    range.selectNodeContents(element.querySelector('pre code')!)
    range.collapse(false)
    const selection = window.getSelection()!
    selection.removeAllRanges()
    selection.addRange(range)
  })
  await page.keyboard.press('Enter')
  await page.keyboard.type('// still code')
  await expect(editor.locator('pre')).toHaveText(`${code}\n// still code`)
  await page.keyboard.press('ControlOrMeta+Enter')
  await page.keyboard.type('Normal text')
  await expect(editor.locator('pre')).toHaveText(`${code}\n// still code`)
  await expect(editor.locator('pre + p')).toHaveText('Normal text')
})
