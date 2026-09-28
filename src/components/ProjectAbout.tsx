import { useId, useState } from 'react'
import type { RegisterDraftGuard } from '../app/useNavigationGuard'
import { useDraftGuard } from './board/useDraftGuard'
import { usePendingAction } from './usePendingAction'
import type { LeanCanvas } from '../data/types'

interface Props {
  canvas: LeanCanvas
  onSave: (about: string) => Promise<void>
  register: RegisterDraftGuard
}

export function ProjectAbout({ canvas, onSave, register }: Props) {
  const id = useId()
  const [draft, setDraft] = useState<string | null>(null)
  const value = draft ?? canvas.about
  const save = usePendingAction(async () => {
    await onSave(value)
    setDraft(null)
  })
  const failed = save.failed && draft !== null
  const dirty = draft !== null && (draft !== canvas.about || failed)
  useDraftGuard(dirty, save.pending, () => setDraft(null), register)
  return <div className="flex min-h-0 min-w-0 flex-1">
    <form onSubmit={(event) => { event.preventDefault(); if (dirty) void save.run() }} className="flex min-h-0 w-full flex-col bg-[#f1f2f4] p-6 text-[#172b4d] max-[760px]:p-4">
      <div className="mb-4 flex shrink-0 items-center justify-between gap-4">
        <h2 className="text-base font-semibold"><label htmlFor={id}>Project details</label></h2>
        <button type="submit" disabled={save.pending || !dirty}
          className="min-h-10 shrink-0 rounded-md bg-[#0c66e4] px-4 text-sm font-semibold text-white hover:bg-[#0055cc] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0c66e4] disabled:opacity-60 max-[760px]:min-h-12">{save.pending ? 'Saving…' : 'Save'}</button>
      </div>
      <textarea id={id} name="about" value={value} maxLength={100000} readOnly={save.pending}
        spellCheck
        onChange={(event) => setDraft(event.target.value)}
        placeholder="Project overview, goals, and useful links."
        className="block min-h-0 w-full flex-1 resize-none rounded-lg border border-[#8590a2] bg-white p-4 text-base leading-7 placeholder:text-sm placeholder:text-[#626f86] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0c66e4]"
      />
      <p role="status" className="mt-3 shrink-0 text-xs text-[#626f86]">{failed ? 'Changes could not be saved. Try saving again.' : save.pending ? 'Saving…' : dirty ? 'Unsaved changes' : 'All changes saved'}</p>
    </form>
  </div>
}
