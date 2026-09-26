import type { AppUser } from '../auth/auth-context'
import { createBoard, type BoardData } from '../data/board'
import { readLocalBoards, writeLocalBoards } from '../data/board-storage'
import { createBlankCanvas } from '../data/factories'
import { readStoredCanvases, writeStoredCanvases } from '../data/storage'

// Public demo inputs, not real account credentials or a security boundary.
export const demoEmail = 'demo@example.com'
export const demoPassword = 'TicketsFirst2026!'
export const demoProjectId = '79c8d0b7-e366-4dbd-9aa4-5ffb58354a31'
export const demoTicketId = '45c1152a-e67b-4fe4-a20a-40abf3b37ba4'
export const demoUser: AppUser = {
  uid: 'tickets-first-demo', displayName: 'Demo User', email: demoEmail, photoURL: null,
}

export function seedDemoWorkspace(storage: Storage = globalThis.localStorage) {
  const seededKey = 'lean-demo:tickets-first:seeded'
  if (storage.getItem(seededKey)) return
  // Never overwrite an existing local workspace, even after all projects are deleted.
  if (readStoredCanvases(storage).length) {
    storage.setItem(seededKey, 'true')
    return
  }
  const canvas = { ...createBlankCanvas('Tickets-first demo'), id: demoProjectId }
  canvas.notes = 'Public demo. Changes stay in this browser; no Firebase account or cloud sync.'
  canvas.sections[0].cards = ['Start with actionable tickets, then explore the business canvas.']
  const board: BoardData = {
    ...createBoard(),
    cards: [
      { id: demoTicketId, columnId: 'todo', title: 'Try the tickets-first workspace',
        description: 'Tickets is the first tab and the default landing view. Switch to Canvas, refresh, and use Back/Forward to test existing links.',
        storyPoints: 3, rank: 'a' },
      { id: 'sample-edit', columnId: 'backlog', title: 'Edit or move this sample ticket',
        description: 'All edits are local to your browser. No production data is connected.', storyPoints: 1, rank: 'a' },
    ],
  }
  const boards = readLocalBoards(storage)
  writeLocalBoards(storage, { ...boards, [canvas.id]: board })
  writeStoredCanvases([canvas], storage)
  storage.setItem(seededKey, 'true')
}
