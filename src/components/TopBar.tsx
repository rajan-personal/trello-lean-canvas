import type { ChangeEvent, ReactNode } from 'react'
import './topbar.css'
import { Menu } from 'lucide-react'
import type { LeanCanvas } from '../data/types'
import { BoardTitle } from './BoardTitle'
import { CanvasAddMenu } from './CanvasAddMenu'
import { CanvasToolbarActions } from './CanvasToolbarActions'
import { toolbarButtonClass } from './workspace-classes'

interface Props {
  tabs?: ReactNode
  canvas?: LeanCanvas
  sidebarOpen: boolean
  sidebarCollapsed: boolean
  onToggleSidebar: () => void
  onOpenSidebar: () => void
  onNewCanvas: () => void
  onLoadSamples: () => void
  onRename: (name: string) => void
  notepadOpen: boolean
  onFavorite: () => void
  onToggleNotepad: () => void
  onDelete: () => void
  onImport: (event: ChangeEvent<HTMLInputElement>) => void
  onDownload: () => void
}

export function TopBar(props: Props) {
  const { canvas } = props

  return (
    <header className="topbar relative z-20 flex h-12 items-center bg-[#0b4a6f] text-white shadow-[0_1px_0_rgba(9,30,66,0.25)]">
      <button
        className={`mobile-sidebar-button ms-2 me-[7px] hidden ${toolbarButtonClass} max-[760px]:grid`}
        onClick={props.onOpenSidebar}
        aria-label="Open sidebar"
        aria-expanded={props.sidebarOpen}
        aria-controls="canvas-sidebar"
      >
        <Menu size={19} />
      </button>
      <button
        className={`desktop-sidebar-button ms-2 me-[7px] ${toolbarButtonClass} max-[760px]:hidden`}
        onClick={props.onToggleSidebar}
        aria-label={
          props.sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'
        }
        aria-expanded={!props.sidebarCollapsed}
        aria-controls="canvas-sidebar"
      >
        <Menu size={19} />
      </button>
      <div className="topbar-brand flex h-full w-11 flex-none items-center justify-center px-2">
        <CanvasAddMenu
          onNew={props.onNewCanvas}
          onImport={props.onImport}
          onLoadSamples={props.onLoadSamples}
        />
      </div>
      <div className="board-toolbar flex h-full min-w-0 flex-1 items-center border-s border-white/14 px-3 text-white max-[760px]:px-1.5">
        {canvas && (
          <BoardTitle
            key={canvas.id}
            canvas={canvas}
            onRename={props.onRename}
          />
        )}
        <span className="toolbar-spacer flex-1" />
        {canvas && (
          <div className="topbar-actions flex shrink-0 items-center">
            {props.tabs}
            <CanvasToolbarActions
              canvas={canvas}
              notepadOpen={props.notepadOpen}
              onFavorite={props.onFavorite}
              onToggleNotepad={props.onToggleNotepad}
              onDelete={props.onDelete}
              onDownload={props.onDownload}
            />
          </div>
        )}
      </div>
    </header>
  )
}
