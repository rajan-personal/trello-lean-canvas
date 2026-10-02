import { createContext, useContext, useEffect, useState, type CSSProperties, type ReactNode } from 'react'
import './kanban.css'

const cardHeights = [[56, 40, 72], [40, 56], [72, 40, 40, 56], [40]]
const LoadingVisible = createContext(false)

function useDelayedVisibility() {
  const [show, setShow] = useState(false)
  useEffect(() => {
    const timer = setTimeout(() => setShow(true), 150)
    return () => clearTimeout(timer)
  }, [])
  return show
}

// Share the delay across the Suspense and data-loading phases to avoid a second flash.
export function BoardLoadingBoundary({ children }: { children: ReactNode }) {
  const show = useDelayedVisibility()
  return <LoadingVisible value={show}>{children}</LoadingVisible>
}

export function BoardSkeleton() {
  const show = useDelayedVisibility()
  const alreadyVisible = useContext(LoadingVisible)
  const visibility = show || alreadyVisible ? 'visible' : 'hidden'
  return <div className="kanban-lists kanban-skeleton" role="status" aria-live="polite">
    <span className="sr-only">Loading board…</span>
    {cardHeights.map((heights, index) => <div key={index} aria-hidden="true"
      className="kanban-column sk-column" style={{ visibility, '--i': index } as CSSProperties}>
      <div aria-hidden="true" className="sk-block sk-header" />
      {heights.map((height, card) => <div key={card} aria-hidden="true" className="sk-block" style={{ height }} />)}
      <div aria-hidden="true" className="sk-block sk-add-card" />
    </div>)}
    <div aria-hidden="true" className="kanban-add-column sk-add-column" style={{ visibility }} />
  </div>
}
