import { expect, type Page } from '@playwright/test'

export async function startLayoutWatch(page: Page) {
  await page.evaluate(() => {
    const board = document.querySelector('.kanban-lists')!
    const top = board.getBoundingClientRect().top
    const samples: number[] = []
    let active = true
    const sample = () => {
      samples.push(Math.abs(board.getBoundingClientRect().top - top))
      if (active) requestAnimationFrame(sample)
    }
    requestAnimationFrame(sample)
    Object.assign(window, { stopLayoutWatch: () => { active = false; return samples } })
  })
}

export async function expectSteadyLayout(page: Page) {
  const samples = await page.evaluate(() =>
    (window as unknown as { stopLayoutWatch: () => number[] }).stopLayoutWatch())
  expect(samples.length).toBeGreaterThan(0)
  expect(Math.max(...samples)).toBeLessThan(1)
}
