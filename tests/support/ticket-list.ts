import { expect, type Page } from '@playwright/test'
import type { BoardData } from '../../src/data/board'
import { canvas } from '../../unit/fixtures'

type Card = BoardData['cards'][number]
const card = (id: string, columnId: string, title: string, rank: string): Card => ({ id, columnId, title, description: '', rank })
export const projects = [
  { ...canvas('a'), name: 'Alpha project', title: 'Alpha project', favorite: true, notes: 'Prepare the next product release.' },
  { ...canvas('b'), name: 'Beta project', title: 'Beta project', favorite: false, notes: 'Explore new ideas.' },
  { ...canvas('c'), name: 'Empty project', title: 'Empty project', favorite: false },
]
export const boards: Record<string, BoardData> = {
  a: { columns: [{ id: 'z-custom', title: 'Review' }, { id: 'a-custom', title: 'Backlog' }], cards: [
    card('a-duplicate-late', 'z-custom', 'Duplicate title', 'b'), card('a-duplicate-first', 'z-custom', 'Duplicate title', 'a'), card('a-backlog', 'a-custom', 'A backlog', 'a'),
  ], comments: [] },
  b: { columns: [{ id: 'b-custom', title: 'Done' }, { id: 'c-custom', title: 'In Review' }, { id: 'todo', title: 'Todo' }], cards: [
    card('b-done', 'b-custom', 'B done', 'a'), card('b-review', 'c-custom', 'Review this', 'a'), card('b-todo', 'todo', 'Build this', 'a'),
  ], comments: [] },
  c: { columns: [], cards: [], comments: [] },
}
export async function openList(page: Page, seed = { projects, boards }) {
  await page.addInitScript(({ projects, boards }) => {
    localStorage.clear()
    localStorage.setItem('lean-canvas:v2', JSON.stringify(projects))
    localStorage.setItem('lean-canvas:boards:v1', JSON.stringify(boards))
  }, seed)
  await page.goto('/tickets')
  await expect(page.getByRole('main', { name: 'All tickets' })).toBeVisible()
  await expect(page.locator('.ticket-project-row')).toHaveCount(seed.projects.length)
  await expect(page.getByText('Loading tickets…')).toHaveCount(0)
}
