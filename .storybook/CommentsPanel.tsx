import { useState } from 'react'
import { useStorybookState } from 'storybook/manager-api'

const STORAGE_PREFIX = 'trello-storybook-comments:v1'

interface ComponentComment {
  id: string
  text: string
  createdAt: string
}

interface StorySummary {
  title?: string
  name?: string
}

interface StoryCommentsProps {
  storyId: string
  story?: StorySummary
}

function storageKey(storyId: string): string {
  return `${STORAGE_PREFIX}:${storyId}`
}

function isComponentComment(value: unknown): value is ComponentComment {
  if (!value || typeof value !== 'object') return false
  const comment = value as Record<string, unknown>
  return typeof comment.id === 'string'
    && typeof comment.text === 'string'
    && typeof comment.createdAt === 'string'
}

function readComments(storyId: string): ComponentComment[] {
  if (!storyId) return []
  try {
    const stored: unknown = JSON.parse(localStorage.getItem(storageKey(storyId)) ?? '[]')
    return Array.isArray(stored) ? stored.filter(isComponentComment) : []
  } catch {
    return []
  }
}

function writeComments(storyId: string, comments: ComponentComment[]): void {
  localStorage.setItem(storageKey(storyId), JSON.stringify(comments))
}

function createComment(text: string): ComponentComment {
  return {
    id: `comment-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    text,
    createdAt: new Date().toISOString(),
  }
}

const panelClass = 'min-h-full p-4 font-[Nunito_Sans,-apple-system,BlinkMacSystemFont,sans-serif] text-[inherit]'

function StoryComments({ storyId, story }: StoryCommentsProps) {
  const [comments, setComments] = useState<ComponentComment[]>(() => readComments(storyId))
  const [draft, setDraft] = useState('')

  const addComment = () => {
    const text = draft.trim()
    if (!text) return
    const nextComments = [...comments, createComment(text)]
    setComments(nextComments)
    writeComments(storyId, nextComments)
    setDraft('')
  }

  const deleteComment = (commentId: string) => {
    const nextComments = comments.filter((comment) => comment.id !== commentId)
    setComments(nextComments)
    writeComments(storyId, nextComments)
  }

  return (
    <div className={panelClass}>
      <h3 className="mt-0 mb-1 text-sm font-bold">Component comments</h3>
      <p className="mt-0 mb-3.5 text-xs text-[#738091]">{story?.title ? `${story.title} / ${story.name}` : storyId}</p>

      {comments.length ? (
        <ul className="mb-3.5 grid list-none gap-2 p-0">
          {comments.map((comment) => (
            <li
              key={comment.id}
              className="flex items-start justify-between gap-3 rounded-md border border-[rgba(115,128,145,0.28)] p-2.5"
            >
              <div>
                <p className="mt-0 mb-1 text-[13px] leading-[1.4] whitespace-pre-wrap">{comment.text}</p>
                <time className="text-[10px] text-[#738091]" dateTime={comment.createdAt}>
                  {new Date(comment.createdAt).toLocaleString()}
                </time>
              </div>
              <button
                type="button"
                className="rounded-sm border-0 bg-transparent px-[7px] py-[3px] text-[#c9372c] hover:bg-[#c9372c]/10 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#029cfd]"
                onClick={() => deleteComment(comment.id)}
                aria-label="Delete comment"
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-0 mb-3.5 text-xs text-[#738091]">No comments for this component story yet.</p>
      )}

      <label className="mb-[5px] block text-xs font-bold" htmlFor="component-comment">Add a comment</label>
      <textarea
        id="component-comment"
        className="min-h-[68px] w-full resize-y rounded-[5px] border border-[#738091] bg-transparent p-2 font-[inherit] text-[inherit] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#029cfd]"
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        placeholder="Write a review note…"
      />
      <button
        type="button"
        className="mt-2 rounded-sm border-0 bg-[#029cfd] px-[11px] py-[7px] font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
        onClick={addComment}
        disabled={!draft.trim()}
      >
        Add comment
      </button>
    </div>
  )
}

export function CommentsPanel() {
  const { storyId, index } = useStorybookState()

  if (!storyId) {
    return <div className={panelClass}>Select a component story to add comments.</div>
  }

  return <StoryComments key={storyId} storyId={storyId} story={index?.[storyId]} />
}
