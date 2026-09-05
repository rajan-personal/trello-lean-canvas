import { useId, useState, type ComponentProps } from 'react'
import { TopBar } from './TopBar'
import { WorkspaceTabs, type WorkspaceView } from './WorkspaceTabs'
import { CreateCanvasDialog } from './CreateCanvasDialog'
import type { CanvasDialogState } from './Dialog'
import { storyCanvas } from './component-story-fixtures'

export function TopBarHarness(args: ComponentProps<typeof TopBar> & { initialView?: WorkspaceView }) {
  const id = useId()
  const [view, setView] = useState<WorkspaceView>(args.initialView ?? 'canvas')
  const [canvas, setCanvas] = useState(args.canvas)
  const [sidebarCollapsed, setCollapsed] = useState(args.sidebarCollapsed)
  const [sidebarOpen, setOpen] = useState(args.sidebarOpen)
  const [notepadOpen, setNotepadOpen] = useState(args.notepadOpen)
  const [dialog, setDialog] = useState<CanvasDialogState | null>(null)
  return <><TopBar {...args} canvas={canvas} sidebarCollapsed={sidebarCollapsed}
    tabs={canvas && <WorkspaceTabs idPrefix={id} view={view} onChange={(next) => { setView(next); return true }} />}
    sidebarOpen={sidebarOpen} notepadOpen={notepadOpen}
    onToggleSidebar={() => { args.onToggleSidebar(); setCollapsed((value) => !value) }}
    onOpenSidebar={() => { args.onOpenSidebar(); setOpen(true) }}
    onRename={(name) => { args.onRename(name); setCanvas((value) => value && ({ ...value, name, title: name })) }}
    onFavorite={() => { args.onFavorite(); setCanvas((value) => value && ({ ...value, favorite: !value.favorite })) }}
    onToggleNotepad={() => { args.onToggleNotepad(); setNotepadOpen((value) => !value) }}
    onDelete={() => { args.onDelete(); setCanvas(undefined) }}
    onNewCanvas={() => {
      args.onNewCanvas()
      setDialog({ heading: 'Create canvas', submitLabel: 'Create canvas', value: '' })
    }} />
    {canvas && (['canvas', 'board'] as const).map((tab) => <div key={tab}
      id={`${id}-${tab}-panel`} role="tabpanel" aria-labelledby={`${id}-${tab}-tab`}
      tabIndex={0} hidden={tab !== view} className="bg-white p-4 text-[#172b4d]">
      {tab === 'canvas' ? 'Canvas content' : 'Board content'}
    </div>)}
    <CreateCanvasDialog dialog={dialog} setDialog={setDialog} onCreate={(name) => {
      setCanvas({ ...storyCanvas, id: 'created-canvas', name, title: name })
    }} />
  </>
}
