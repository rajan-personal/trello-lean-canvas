import { createBlankCanvas } from '../src/data/factories'
import { createBoard, boardDataSchema } from '../src/data/board'
import { writeLocalBoards } from '../src/data/board-storage'
import { writeStoredCanvases } from '../src/data/storage'

export const demoUser = {
  uid: 'staging-demo', displayName: 'Demo User', email: 'demo@example.test', photoURL: null,
}
const marker = 'lean-canvas:staging-seeded:v1'

export function seedDemo() {
  if (localStorage.getItem(marker)) return
  const pilot = { ...createBlankCanvas('Launch pilot'), id: 'demo-pilot', favorite: true,
    about: '## Synthetic staging project\n\nTry Canvas, Tickets, About and Notepad. Changes stay in this browser. Authentication and cloud sync are disabled.',
    notes: '## Pilot notes\n\n- Interview three early customers\n- Review the prototype\n- Collect feedback' }
  const content: Record<string, string[]> = {
    problem: ['Teams lose track of customer feedback', 'Planning takes too many meetings'],
    alternatives: ['Spreadsheets and chat threads'], solution: ['One shared planning workspace'],
    metrics: ['Three teams complete a pilot'], value: ['Clear priorities with fewer meetings'],
    concept: ['A calm launch planning board'], advantage: ['Direct access to pilot teams'],
    channels: ['Team invitations'], segments: ['Small product teams'], adopters: ['Early pilot partners'],
    cost: ['Prototype development', 'Customer interviews'], revenue: ['Monthly team subscription'],
  }
  pilot.sections = pilot.sections.map((section) => ({ ...section, cards: content[section.id] ?? [] }))
  const next = { ...createBlankCanvas('Next idea'), id: 'demo-next' }
  const board = boardDataSchema.parse({ ...createBoard(), cards: [
    { id: 'interviews', columnId: 'backlog', title: 'Interview three early customers', description: 'Ask about the last time feedback changed a product decision.', storyPoints: 3, rank: 'h' },
    { id: 'plan', columnId: 'todo', title: 'Draft the pilot plan', description: '', rank: 'h' },
    { id: 'prototype', columnId: 'in-progress', title: 'Build a focused prototype', description: 'Keep the first version small.\n\nReview with one pilot team.', storyPoints: 5, rank: 'h' },
    { id: 'review', columnId: 'review', title: 'Review the launch checklist', description: '', storyPoints: 1, rank: 'h' },
    { id: 'scope', columnId: 'done', title: 'Agree on pilot scope', description: '', rank: 'h' },
  ], comments: [{ id: 'demo-comment', cardId: 'prototype', authorId: demoUser.uid,
    authorName: 'Demo User', text: 'Synthetic sample comment — try adding your own.', createdAt: '2026-10-02T00:00:00.000Z' }] })
  writeStoredCanvases([pilot, next])
  writeLocalBoards(localStorage, { [pilot.id]: board, [next.id]: createBoard() })
  localStorage.setItem(marker, 'true')
}

export function resetDemo() {
  Object.keys(localStorage).filter((key) => key.startsWith('lean-canvas:'))
    .forEach((key) => localStorage.removeItem(key))
  location.assign('/')
}
