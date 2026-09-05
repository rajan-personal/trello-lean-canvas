import { MessageSquare } from 'lucide-react'
import type { BoardComment } from '../../data/board'

interface Props {
  comments: BoardComment[]; text: string; onText: (text: string) => void
  readOnly?: boolean; pending: boolean; onAdd: () => Promise<void>
}
export function BoardComments({ comments, text, onText, pending, readOnly, onAdd }: Props) {
  return <section className="kanban-comments" aria-label="Comments">
    <h3><MessageSquare size={18} aria-hidden="true" /> Comments</h3>
    <form onSubmit={(event) => { event.preventDefault(); if (!pending && !readOnly && text.trim()) void onAdd() }}>
      <fieldset disabled={pending}>
        <label>New comment<textarea name="comment" placeholder="Write a comment…" maxLength={10000} readOnly={readOnly} value={text}
          onChange={(event) => onText(event.target.value)} rows={3} /></label>
        <button type="submit" disabled={readOnly || !text.trim()} className="kanban-primary">Add comment</button>
      </fieldset>
    </form>
    {comments.length === 0 && <p className="kanban-comments-empty">No comments yet.<br /><span>Start the conversation here.</span></p>}
    <ol>{comments.map((comment) => <li key={comment.id}>
      <div className="kanban-comment-meta"><strong>{comment.authorName}</strong>
        <time dateTime={comment.createdAt}>{new Date(comment.createdAt).toLocaleString()}</time></div>
      <p>{comment.text}</p>
    </li>)}</ol>
  </section>
}
