import { useState, type ComponentProps } from 'react'
import { TopBar } from './TopBar'
import { CreateCanvasDialog } from './CreateCanvasDialog'
import type { CanvasDialogState } from './Dialog'
import { storyCanvas } from './component-story-fixtures'

export function TopBarHarness(args: ComponentProps<typeof TopBar>) {
  const [canvas, setCanvas] = useState(args.canvas)
  const [sidebarCollapsed, setCollapsed] = useState(args.sidebarCollapsed)
  const [sidebarOpen, setOpen] = useState(args.sidebarOpen)
  const [notepadOpen, setNotepadOpen] = useState(args.notepadOpen)
  const [dialog, setDialog] = useState<CanvasDialogState | null>(null)
  return <><TopBar {...args} canvas={canvas} sidebarCollapsed={sidebarCollapsed}
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
    <CreateCanvasDialog dialog={dialog} setDialog={setDialog} onCreate={(name) => {
      setCanvas({ ...storyCanvas, id: 'created-canvas', name, title: name })
    }} />
  </>
}
