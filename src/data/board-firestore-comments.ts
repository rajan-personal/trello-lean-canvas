import { doc, getDocFromServer, runTransaction, serverTimestamp, type Firestore } from 'firebase/firestore'
import { boardCommentSchema, type BoardComment } from './board'
import { sameComment } from './board-comments'
import { boardPath, boardRecordSchema, childPayload } from './board-firestore-model'

// Append without reading/replacing the thread. The caller's stable id makes a
// lost acknowledgement safe to retry; no unrelated cards/comments are rewritten.
export async function appendBoardComment(db: Firestore, uid: string, canvasId: string, input: BoardComment) {
  const comment = boardCommentSchema.parse(input)
  const path = boardPath(uid, canvasId)
  const boardRef = doc(db, path)
  const commentRef = doc(db, `${path}/comments`, comment.id)
  if (!(await getDocFromServer(doc(db, `${path}/cards`, comment.cardId))).exists())
    throw new Error('Card is unavailable for comments.')
  // The board revision/status serializes deletion; rules verify the card at commit.
  for (let attempt = 0; attempt < 5; attempt++) {
    let revision: number | undefined
    try {
      await runTransaction(db, async (tx) => {
        const board = boardRecordSchema.parse((await tx.get(boardRef)).data())
        const existing = await tx.get(commentRef)
        revision = board.revision
        if (board.status !== 'active') throw new Error('Card is unavailable for comments.')
        if (existing.exists()) {
          if (!sameComment({ ...existing.data(), id: existing.id } as BoardComment, comment))
            throw new Error('Comment id already used for different content.')
          return
        }
        tx.set(commentRef, childPayload(comment, canvasId))
        tx.update(boardRef, { revision: board.revision + 1, updatedAt: serverTimestamp() })
      })
      return
    } catch (error) {
      // Rules can reject a stale revision before the transaction precondition is
      // evaluated. Retry only proven contention, never an unchanged permission failure.
      if (attempt === 4 || (error as { code?: string }).code !== 'permission-denied' || revision === undefined) throw error
      const current = await getDocFromServer(boardRef)
      if (current.data()?.revision === revision) throw error
    }
  }
}
