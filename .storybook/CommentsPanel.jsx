import React, { useState } from 'react'
import { useStorybookState } from 'storybook/manager-api'

const STORAGE_PREFIX = 'trello-storybook-comments:v1'

function storageKey(storyId) {
  return `${STORAGE_PREFIX}:${storyId}`
}

function readComments(storyId) {
  if (!storyId) return []
  try {
    const stored = JSON.parse(localStorage.getItem(storageKey(storyId)))
    return Array.isArray(stored) ? stored : []
  } catch {
    return []
  }
}

function writeComments(storyId, comments) {
  localStorage.setItem(storageKey(storyId), JSON.stringify(comments))
}

function createComment(text) {
  return {
    id: `comment-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    text,
    createdAt: new Date().toISOString(),
  }
}

const styles = {
  panel: {
    minHeight: '100%',
    padding: 16,
    color: 'inherit',
    fontFamily: 'Nunito Sans, -apple-system, BlinkMacSystemFont, sans-serif',
  },
  header: { margin: '0 0 4px', fontSize: 14 },
  context: { margin: '0 0 14px', color: '#738091', fontSize: 12 },
  list: { display: 'grid', gap: 8, margin: '0 0 14px', padding: 0, listStyle: 'none' },
  item: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
    padding: 10,
    border: '1px solid rgba(115, 128, 145, 0.28)',
    borderRadius: 6,
  },
  text: { margin: '0 0 4px', fontSize: 13, lineHeight: 1.4, whiteSpace: 'pre-wrap' },
  time: { color: '#738091', fontSize: 10 },
  deleteButton: {
    padding: '3px 7px',
    border: 0,
    borderRadius: 4,
    color: '#c9372c',
    background: 'transparent',
    cursor: 'pointer',
  },
  empty: { margin: '0 0 14px', color: '#738091', fontSize: 12 },
  label: { display: 'block', marginBottom: 5, fontSize: 12, fontWeight: 700 },
  textarea: {
    width: '100%',
    minHeight: 68,
    padding: 8,
    resize: 'vertical',
    border: '1px solid #738091',
    borderRadius: 5,
    color: 'inherit',
    background: 'transparent',
    font: 'inherit',
  },
  addButton: {
    marginTop: 8,
    padding: '7px 11px',
    border: 0,
    borderRadius: 4,
    color: '#fff',
    background: '#029cfd',
    cursor: 'pointer',
    fontWeight: 700,
  },
}

function StoryComments({ storyId, story }) {
  const [comments, setComments] = useState(() => readComments(storyId))
  const [draft, setDraft] = useState('')

  const addComment = () => {
    const text = draft.trim()
    if (!text || !storyId) return
    const nextComments = [
      ...comments,
      createComment(text),
    ]
    setComments(nextComments)
    writeComments(storyId, nextComments)
    setDraft('')
  }

  const deleteComment = (commentId) => {
    const nextComments = comments.filter((comment) => comment.id !== commentId)
    setComments(nextComments)
    writeComments(storyId, nextComments)
  }

  return (
    <div style={styles.panel}>
      <h3 style={styles.header}>Component comments</h3>
      <p style={styles.context}>{story?.title ? `${story.title} / ${story.name}` : storyId}</p>

      {comments.length ? (
        <ul style={styles.list}>
          {comments.map((comment) => (
            <li key={comment.id} style={styles.item}>
              <div>
                <p style={styles.text}>{comment.text}</p>
                <time style={styles.time} dateTime={comment.createdAt}>{new Date(comment.createdAt).toLocaleString()}</time>
              </div>
              <button type="button" style={styles.deleteButton} onClick={() => deleteComment(comment.id)} aria-label="Delete comment">
                Delete
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p style={styles.empty}>No comments for this component story yet.</p>
      )}

      <label style={styles.label} htmlFor="component-comment">Add a comment</label>
      <textarea
        id="component-comment"
        style={styles.textarea}
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        placeholder="Write a review note…"
      />
      <button type="button" style={styles.addButton} onClick={addComment} disabled={!draft.trim()}>
        Add comment
      </button>
    </div>
  )
}

export function CommentsPanel() {
  const { storyId, index } = useStorybookState()

  if (!storyId) {
    return <div style={styles.panel}>Select a component story to add comments.</div>
  }

  return React.createElement(StoryComments, { key: storyId, storyId, story: index?.[storyId] })
}
