import { lazy, Suspense, useId, useState } from 'react'
import type { RegisterDraftGuard } from '../app/useNavigationGuard'
import { useDraftGuard } from './board/useDraftGuard'
import { usePendingAction } from './usePendingAction'
import type { LeanCanvas } from '../data/types'

const ProjectRichTextEditor = lazy(() => import('./ProjectRichTextEditor'))

function saveStatus(tooLong: boolean, failed: boolean, pending: boolean, dirty: boolean) {
  if (tooLong) return 'Project details must be 100,000 characters or fewer.'
  if (failed) return 'Changes could not be saved. Try saving again.'
  if (pending) return 'Saving…'
  return dirty ? 'Unsaved changes' : 'All changes saved'
}

interface Props {
  canvas: LeanCanvas
  onSave: (about: string) => Promise<void>
  register: RegisterDraftGuard
}

export function ProjectAbout({ canvas, onSave, register }: Props) {
  const id = useId()
  const [draft, setDraft] = useState<string | null>(null)
  const value = draft ?? canvas.about
  const tooLong = value.length > 100000
  const save = usePendingAction(async () => {
    await onSave(value)
    setDraft(null)
  })
  const failed = save.failed && draft !== null
  const dirty = draft !== null && (draft !== canvas.about || failed)
  useDraftGuard(dirty, save.pending, () => setDraft(null), register)
  return <div className="flex min-h-0 min-w-0 flex-1 overflow-auto p-4 max-[760px]:p-2">
    <form onSubmit={(event) => { event.preventDefault(); if (dirty && !tooLong) void save.run() }} className="flex h-full min-h-0 min-w-0 w-full flex-col rounded-xl bg-panel p-6 text-[#172b4d] shadow-[0_1px_1px_rgba(9,30,66,0.25),0_0_1px_rgba(9,30,66,0.31)] max-[760px]:p-4">
      <div className="mb-4 flex shrink-0 items-center justify-between gap-4">
        <h2 id={`${id}-label`} className="text-base font-semibold">Project details</h2>
        <div className="flex items-center gap-3">
          <p id={`${id}-status`} role="status" className="text-xs text-[#44546f]">{saveStatus(tooLong, failed, save.pending, dirty)}</p>
          <button type="submit" disabled={save.pending || !dirty || tooLong}
          className="min-h-10 shrink-0 rounded-md bg-[#0c66e4] px-4 text-sm font-semibold text-white hover:bg-[#0055cc] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0c66e4] disabled:opacity-60 max-[760px]:min-h-12">{save.pending ? 'Saving…' : 'Save'}</button>
        </div>
      </div>
      <Suspense fallback={<p className="flex-1">Loading editor…</p>}>
        <ProjectRichTextEditor id={id} value={value} disabled={save.pending} invalid={tooLong}
          onChange={(next) => { if (!save.pending) setDraft(next) }} />
      </Suspense>
    </form>
  </div>
}
