// Separate preview entry: never imported by the production application.
import { createRoot } from 'react-dom/client'
import App from '../src/app/App'
import { createBlankCanvas } from '../src/data/factories'
import { createBoard } from '../src/data/board'
import { writeStoredCanvases } from '../src/data/storage'
import { writeLocalBoards } from '../src/data/board-storage'
import './styles.css'

const project = 'comments-preview'
const card = 'comments-demo'
if (localStorage.getItem('lean-canvas:v2') === null) {
  const canvas = { ...createBlankCanvas('Task comments preview'), id: project }
  const board = createBoard()
  board.cards.push({ id: card, columnId: 'review', title: 'Try user + agent comments', rank: 'h',
    description: 'This is an isolated preview, not your production workspace.\n\nAdd a comment on the right, then refresh to check persistence. The existing agent comment is synthetic demo data. Your comments are stored only in this browser.\n\nThe authenticated agent CLI and Firestore permissions are tested separately against the emulator; see docs/task-comments.md in the PR.' })
  board.comments.push({ id: 'agent-demo', cardId: card, authorId: 'demo-agent', authorName: 'Review agent',
    authorType: 'agent', text: 'I checked this task. Ready for your feedback!\n(Synthetic agent comment for the preview.)', createdAt: '2026-09-26T08:00:00.000Z' })
  writeStoredCanvases([canvas])
  writeLocalBoards(localStorage, { [project]: board })
}
if (location.pathname === '/') history.replaceState(null, '', `/project/${project}/ticket/${card}`)
createRoot(document.getElementById('root')!).render(<App browserRouting previewUser={{
  uid: 'preview-user', displayName: 'Preview user', email: null, photoURL: null,
}} />)
