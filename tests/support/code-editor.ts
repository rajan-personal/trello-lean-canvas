import type { Locator, Page } from '@playwright/test'
import { loadSamples } from './canvas-fixtures'

export const code = 'const answer = 42\nconsole.log(answer)'
export const markdown = `\`\`\`js\n${code}\n\`\`\``

export async function openNotepad(page: Page) {
  if (page.viewportSize()!.width < 761) await page.getByRole('button', { name: 'More actions', exact: true }).click()
  await page.getByRole('button', { name: 'Notepad', exact: true }).click()
}

export async function openCode(page: Page, surface: 'About' | 'Notepad') {
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

export async function placeCaret(editor: Locator, offset?: number) {
  await editor.locator('pre').click()
  await editor.evaluate((element, offset) => {
    const node = element.querySelector('pre code')!
    const range = document.createRange()
    range.selectNodeContents(node)
    if (offset !== undefined) range.setStart(node.firstChild!, offset)
    range.collapse(offset !== undefined)
    const selection = window.getSelection()!
    selection.removeAllRanges()
    selection.addRange(range)
    document.dispatchEvent(new Event('selectionchange'))
  }, offset)
}
