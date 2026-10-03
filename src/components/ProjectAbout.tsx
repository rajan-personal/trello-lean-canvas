import { lazy, Suspense, useId, useState } from 'react'
import { Trash2 } from 'lucide-react'
import { ProjectAboutTabs } from './ProjectAboutTabs'
import type { RegisterDraftGuard } from '../app/useNavigationGuard'
import { useDraftGuard } from './board/useDraftGuard'
import { usePendingAction } from './usePendingAction'
import { maxAboutTabs, maxAboutTabTitle, maxAboutText } from '../data/canvas-schema'
import type { AboutTab, LeanCanvas } from '../data/types'
import { aboutProblem, aboutSaveStatus, type AboutDetails } from './project-about-status'

const ProjectRichTextEditor = lazy(() => import('./ProjectRichTextEditor'))
const overview = 'overview'

interface Props {
  canvas: LeanCanvas
  onSave: (details: AboutDetails) => Promise<void>
  register: RegisterDraftGuard
}

export function ProjectAbout({ canvas, onSave, register }: Props) {
  const id = useId()
  const [draft, setDraft] = useState<AboutDetails | null>(null)
  const [active, setActive] = useState(overview)
  const [focusName, setFocusName] = useState(false)
  const saved: AboutDetails = { about: canvas.about, aboutTabs: canvas.aboutTabs }
  const value = draft ?? saved
  const invalid = aboutProblem(value)
  const save = usePendingAction(async () => {
    await onSave(value)
    setDraft(null)
  })
  const failed = save.failed && draft !== null
  const dirty = draft !== null && (JSON.stringify(draft) !== JSON.stringify(saved) || failed)
  useDraftGuard(dirty, save.pending, () => { setDraft(null); setActive(overview) }, register)

  const tabs = [{ id: overview, title: 'Overview', content: value.about }, ...value.aboutTabs]
  const current = tabs.find((tab) => tab.id === active) ?? tabs[0]
  const editorId = `${id}-${current.id}`
  const update = (next: AboutDetails) => { if (!save.pending) setDraft(next) }
  const updateTab = (tabId: string, change: Partial<AboutTab>) => update({ ...value,
    aboutTabs: value.aboutTabs.map((tab) => tab.id === tabId ? { ...tab, ...change } : tab) })
  const addTab = () => {
    const tab = { id: crypto.randomUUID(), title: 'New tab', content: '' }
    update({ ...value, aboutTabs: [...value.aboutTabs, tab] })
    setActive(tab.id)
    setFocusName(true)
  }
  const removeTab = (tabId: string) => {
    const index = tabs.findIndex((tab) => tab.id === tabId)
    update({ ...value, aboutTabs: value.aboutTabs.filter((tab) => tab.id !== tabId) })
    setActive(tabs[index - 1]?.id ?? overview)
  }

  return <div className="flex min-h-0 min-w-0 flex-1 overflow-auto p-4 max-[760px]:p-2">
    <form onSubmit={(event) => { event.preventDefault(); if (dirty && !invalid) void save.run() }} className="flex h-full min-h-0 min-w-0 w-full flex-col rounded-xl bg-panel p-6 text-[#172b4d] shadow-[0_1px_1px_rgba(9,30,66,0.25),0_0_1px_rgba(9,30,66,0.31)] max-[760px]:p-4">
      <div className="mb-3 flex shrink-0 items-center justify-between gap-4">
        <h2 className="text-base font-semibold">Project details</h2>
        <div className="flex items-center gap-3">
          <p id={`${editorId}-status`} role="status" className="text-xs text-[#44546f]">{aboutSaveStatus(invalid, failed, save.pending, dirty)}</p>
          <button type="submit" disabled={save.pending || !dirty || !!invalid}
          className="min-h-10 shrink-0 rounded-md bg-[#0c66e4] px-4 text-sm font-semibold text-white hover:bg-[#0055cc] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0c66e4] disabled:opacity-60 max-[760px]:min-h-12">{save.pending ? 'Saving…' : 'Save'}</button>
        </div>
      </div>
      <ProjectAboutTabs id={id} tabs={tabs} active={current.id} onSelect={setActive} onAdd={addTab}
        canAdd={!save.pending && value.aboutTabs.length < maxAboutTabs}
        addTitle={value.aboutTabs.length >= maxAboutTabs ? `Up to ${maxAboutTabs + 1} tabs` : 'Add tab'} />
      <div role="tabpanel" id={`${id}-panel`} aria-labelledby={`${id}-${current.id}-tab`} className="flex min-h-0 flex-1 flex-col">
        <span id={`${editorId}-label`} className="sr-only">{current.id === overview ? 'Project details' : current.title.trim() || 'Untitled tab'}</span>
        {current.id !== overview && <div className="mb-3 flex shrink-0 flex-wrap items-end gap-2">
          <label className="flex min-w-0 flex-1 flex-col gap-1 text-xs font-semibold text-[#44546f]">Tab name
            <input key={current.id} value={current.title} maxLength={maxAboutTabTitle} disabled={save.pending}
              autoFocus={focusName} onFocus={(event) => { if (focusName) { event.target.select(); setFocusName(false) } }}
              onChange={(event) => updateTab(current.id, { title: event.target.value })}
              className="min-h-10 rounded-md border border-[#8590a2] px-3 text-sm font-normal text-[#172b4d] focus-visible:outline-2 focus-visible:outline-[#0c66e4]" />
          </label>
          <button type="button" onClick={() => removeTab(current.id)} disabled={save.pending}
            className="flex min-h-10 items-center gap-1.5 rounded-md border border-[#dcdfe4] px-3 text-sm font-semibold text-[#ae2e24] hover:bg-[#ffeceb] focus-visible:outline-2 focus-visible:outline-[#0c66e4] disabled:opacity-60">
            <Trash2 size={14} aria-hidden="true" />Delete tab
          </button>
        </div>}
        <Suspense fallback={<p className="flex-1">Loading editor…</p>}>
          <ProjectRichTextEditor key={current.id} id={editorId} value={current.content} disabled={save.pending}
            invalid={current.content.length > maxAboutText}
            onChange={(next) => current.id === overview ? update({ ...value, about: next }) : updateTab(current.id, { content: next })} />
        </Suspense>
      </div>
    </form>
  </div>
}
