import { useId } from 'react'
import { ArrowUp, MessageSquare } from 'lucide-react'
import type { BoardComment } from '../../data/board'
import { CommentAvatar } from './CommentAvatar'
import './board-comments.css'

interface Props {
  comments: BoardComment[]; text: string; onText: (text: string) => void
  readOnly?: boolean; pending: boolean; onAdd: () => Promise<void>; authorName?: string
}
export function BoardComments({ comments, text, onText, pending, readOnly, onAdd, authorName = 'You' }: Props) {
  const inputId = useId()
  const hintId = useId()
  return <section className="kanban-comments" aria-label="Comments">
    <div className="kanban-comments-heading">
      <h3><MessageSquare size={17} strokeWidth={1.8} aria-hidden="true" /> Comments</h3>
      <span className="kanban-comments-count" aria-hidden="true">{comments.length}</span>
    </div>
    {comments.length === 0 ? <div className="kanban-comments-empty">
      <span className="kanban-comments-empty-icon" aria-hidden="true"><MessageSquare size={22} strokeWidth={1.5} /></span>
      <p>No comments yet.</p><span>Share an update or start a conversation.</span>
    </div> : <ol className="kanban-comment-thread" role="list" aria-label="Comment thread">
      {comments.map((comment) => <li key={comment.id}>
        <CommentAvatar name={comment.authorName} agent={comment.authorType === 'agent'} />
        <div className="kanban-comment-content">
          <div className="kanban-comment-meta"><strong>{comment.authorName}</strong>
            <span className="kanban-comment-author-type" data-author-type={comment.authorType ?? 'user'}>
              {comment.authorType === 'agent' ? 'Agent' : 'User'}
            </span>
          </div>
          <time dateTime={comment.createdAt} title={new Date(comment.createdAt).toLocaleString()}>
            {new Date(comment.createdAt).toLocaleString(undefined, { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })}
          </time>
          <p>{comment.text}</p>
        </div>
      </li>)}
    </ol>}
    <form className="kanban-comment-form" onSubmit={(event) => {
      event.preventDefault()
      if (!pending && !readOnly && text.trim()) void onAdd()
    }}>
      <fieldset disabled={pending}>
        <div className="kanban-comment-composer-heading">
          <CommentAvatar name={authorName} />
          <div><label htmlFor={inputId}>New comment</label><span>Posting as {authorName}</span></div>
        </div>
        <div className="kanban-comment-composer">
          <textarea id={inputId} name="comment" aria-describedby={hintId} placeholder="Share an update, ask a question…"
            maxLength={10000} readOnly={readOnly} value={text} rows={3}
            onChange={(event) => onText(event.target.value)} onKeyDown={(event) => {
              if (event.key === 'Enter' && (event.metaKey || event.ctrlKey) && !event.nativeEvent.isComposing && event.keyCode !== 229) {
                event.preventDefault(); event.currentTarget.form?.requestSubmit()
              }
            }} />
          <div className="kanban-comment-composer-footer">
            <span id={hintId} className="kanban-comment-shortcut"><kbd>Ctrl</kbd> / <kbd>⌘</kbd> + <kbd>Enter</kbd> to post</span>
            <button type="submit" disabled={readOnly || !text.trim()} className="kanban-primary">
              <ArrowUp size={15} aria-hidden="true" /> Add comment
            </button>
          </div>
        </div>
      </fieldset>
    </form>
  </section>
}
