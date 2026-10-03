import { lazy, Suspense, useId, useState } from 'react'
import { ProjectAboutTabs } from './ProjectAboutTabs'
import { ProjectAboutEditorHeader } from './ProjectAboutEditorHeader'
import type { RegisterDraftGuard } from '../app/useNavigationGuard'
import { useDraftGuard } from './board/useDraftGuard'
import { usePendingAction } from './usePendingAction'
import { maxAboutTabs, maxAboutText } from '../data/canvas-schema'
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
  const [renaming, setRenaming] = useState<{ id: string; original: string } | null>(null)
  const [sectionsOpen, setSectionsOpen] = useState(false)
  const saved: AboutDetails = { about: canvas.about, aboutTabs: canvas.aboutTabs }
  const value = draft ?? saved
  const invalid = aboutProblem(value)
  const save = usePendingAction(async () => { await onSave(value); setDraft(null) })
  const failed = save.failed && draft !== null
  const dirty = draft !== null && (JSON.stringify(draft) !== JSON.stringify(saved) || failed)
  useDraftGuard(dirty, save.pending, () => { setDraft(null); setActive(overview); setRenaming(null) }, register)

  const tabs = [{ id: overview, title: 'Overview', content: value.about }, ...value.aboutTabs]
  const current = tabs.find((tab) => tab.id === active) ?? tabs[0]
  const editorId = `${id}-${current.id}`
  const position = value.aboutTabs.findIndex((tab) => tab.id === current.id)
  const update = (next: AboutDetails) => { if (!save.pending) setDraft(next) }
  const updateTab = (tabId: string, change: Partial<AboutTab>) => update({ ...value,
    aboutTabs: value.aboutTabs.map((tab) => tab.id === tabId ? { ...tab, ...change } : tab) })
  const startRename = (tabId: string) => {
    const tab = value.aboutTabs.find((item) => item.id === tabId)
    if (tab && !save.pending) { setActive(tabId); setSectionsOpen(true); setRenaming({ id: tabId, original: tab.title }) }
  }
  const endRename = (cancel: boolean) => {
    if (!renaming) return
    const tab = value.aboutTabs.find((item) => item.id === renaming.id)
    if (tab && (cancel || !tab.title.trim())) updateTab(renaming.id, { title: renaming.original })
    setRenaming(null); setSectionsOpen(false)
  }
  const addTab = () => {
    const tab = { id: crypto.randomUUID(), title: 'New tab', content: '' }
    update({ ...value, aboutTabs: [...value.aboutTabs, tab] })
    setActive(tab.id); setSectionsOpen(true); setRenaming({ id: tab.id, original: tab.title })
  }
  const moveTab = (tabId: string, index: number) => {
    const rest = value.aboutTabs.filter((tab) => tab.id !== tabId)
    const tab = value.aboutTabs.find((item) => item.id === tabId)
    if (tab && index >= 0 && index <= rest.length) update({ ...value, aboutTabs: [...rest.slice(0, index), tab, ...rest.slice(index)] })
  }
  const removeTab = (tabId: string) => {
    const index = tabs.findIndex((tab) => tab.id === tabId)
    update({ ...value, aboutTabs: value.aboutTabs.filter((tab) => tab.id !== tabId) })
    if (tabId === current.id) setActive(tabs[index - 1]?.id ?? overview)
  }

  return <div className="flex min-h-0 min-w-0 flex-1 overflow-auto p-4 max-[760px]:p-2">
    <form onSubmit={(event) => { event.preventDefault(); if (dirty && !invalid) void save.run() }} className="flex h-full min-h-0 min-w-0 w-full flex-col rounded-xl bg-panel p-6 text-[#172b4d] shadow-[0_1px_1px_rgba(9,30,66,0.25),0_0_1px_rgba(9,30,66,0.31)] max-[760px]:p-4">
      <div className="mb-4 flex shrink-0 items-center justify-between gap-4 max-[760px]:mb-3">
        <h2 className="text-base font-semibold">Project details</h2>
        <div className="flex items-center gap-3">
          <p id={`${editorId}-status`} role="status" className="text-xs text-[#44546f]">{aboutSaveStatus(invalid, failed, save.pending, dirty)}</p>
          <button type="submit" disabled={save.pending || !dirty || !!invalid}
          className="min-h-10 shrink-0 rounded-md bg-[#0c66e4] px-4 text-sm font-semibold text-white hover:bg-[#0055cc] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0c66e4] disabled:opacity-60 max-[760px]:min-h-12">{save.pending ? 'Saving…' : 'Save'}</button>
        </div>
      </div>
      <div className="about-workbench flex min-h-0 flex-1 overflow-hidden rounded-md border border-[#d4d4d4] bg-white max-[760px]:flex-col">
        <ProjectAboutTabs id={id} tabs={tabs} active={current.id} pinned={overview} renaming={renaming?.id ?? null}
          onAdd={addTab} onMove={moveTab} onDelete={removeTab} onRename={(tabId, title) => updateTab(tabId, { title })}
          onRenameStart={startRename} onRenameEnd={endRename}
          open={sectionsOpen} onToggle={setSectionsOpen} onSelect={(tabId) => { setActive(tabId); setSectionsOpen(false) }}
          canAdd={!save.pending && value.aboutTabs.length < maxAboutTabs} canMove={!save.pending}
          addTitle={value.aboutTabs.length >= maxAboutTabs ? `Up to ${maxAboutTabs + 1} sections` : 'New section'} />
        <div role="tabpanel" id={`${id}-panel`} aria-labelledby={`${id}-${current.id}-tab`} className={`flex min-h-0 min-w-0 flex-1 flex-col max-[760px]:min-h-80 ${sectionsOpen ? 'max-[760px]:hidden' : ''}`}>
          <span id={`${editorId}-label`} className="sr-only">{current.id === overview ? 'Project details' : current.title.trim() || 'Untitled tab'}</span>
          <ProjectAboutEditorHeader tab={current} pinned={current.id === overview} disabled={save.pending}
            onRename={() => startRename(current.id)} onDelete={() => removeTab(current.id)}
            onMoveUp={position > 0 ? () => moveTab(current.id, position - 1) : undefined}
            onMoveDown={position >= 0 && position < value.aboutTabs.length - 1 ? () => moveTab(current.id, position + 1) : undefined} />
          <Suspense fallback={<p className="flex-1 p-4">Loading editor…</p>}>
            <ProjectRichTextEditor key={current.id} id={editorId} value={current.content} disabled={save.pending}
              invalid={current.content.length > maxAboutText}
              onChange={(next) => current.id === overview ? update({ ...value, about: next }) : updateTab(current.id, { content: next })} />
          </Suspense>
        </div>
      </div>
    </form>
  </div>
}
