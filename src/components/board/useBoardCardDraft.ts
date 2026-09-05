import { useRef, useState } from 'react'
import type { AppUser } from '../../auth/auth-context'
import type { BoardCard, BoardComment } from '../../data/board'
import type { RunBoardCommand } from './board-ui'

export function useBoardCardDraft(card: BoardCard, user: AppUser, run: RunBoardCommand) {
  const [baseline, setBaseline] = useState(card)
  const [draft, setDraft] = useState(card)
  const [comment, setComment] = useState('')
  const [message, setMessage] = useState('')
  const attempt = useRef<BoardComment | null>(null)
  const fieldsDirty = draft.title !== baseline.title || draft.description !== baseline.description ||
    draft.columnId !== baseline.columnId
  const changedElsewhere = card.title !== baseline.title || card.description !== baseline.description ||
    card.columnId !== baseline.columnId
  const save = async () => {
    if (changedElsewhere) { setMessage('This card changed elsewhere. Copy your draft, then close and reopen to review it.'); return false }
    const saved = { ...draft, title: draft.title.trim() }
    if (!await run({ type: 'edit-card', id: card.id, title: saved.title,
      description: saved.description, columnId: saved.columnId, expected: baseline })) return false
    setDraft(saved)
    setBaseline(saved)
    setMessage('Card saved.')
    return true
  }
  const addComment = async () => {
    if (!comment.trim()) return
    attempt.current ??= { id: crypto.randomUUID(), cardId: card.id, authorId: user.uid,
      authorName: user.displayName || user.email || 'Canvas owner', text: comment.trim(),
      createdAt: new Date().toISOString() }
    attempt.current.text = comment.trim()
    if (await run({ type: 'add-comment', comment: attempt.current })) {
      attempt.current = null
      setComment('')
      setMessage('Comment added.')
    }
  }
  return { draft, setDraft, comment, setComment, message, fieldsDirty,
    dirty: fieldsDirty || comment.length > 0, save, addComment }
}
