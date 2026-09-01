import { useState } from 'react'
import { Dialog, type CanvasDialogState } from '../components/Dialog'
import { CanvasBoard } from '../components/CanvasBoard'
import { Sidebar } from '../components/Sidebar'
import { Toast } from '../components/Toast'
import { TopBar } from '../components/TopBar'
import { useCanvasCommands } from './useCanvasCommands'
import { useCanvasState } from './useCanvasState'
import { useCardDrag } from './useCardDrag'
import { useCardEditing } from './useCardEditing'
import { useNotice } from './useNotice'

export function Workspace() {
  const state = useCanvasState()
  const { notice, notify } = useNotice()
  const cards = useCardEditing(state, notify)
  const commands = useCanvasCommands(state, cards.clearCardEditing, notify)
  const dragHandlers = useCardDrag(
    state,
    () => cards.setEditingCard(null),
    notify,
  )
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [dialog, setDialog] = useState<CanvasDialogState | null>(null)
  const sectionProps = {
    addingSectionId: cards.addingSectionId,
    setAddingSectionId: cards.setAddingSectionId,
    cardDraft: cards.cardDraft,
    setCardDraft: cards.setCardDraft,
    addCard: cards.addCard,
    editCard: cards.editCard,
    deleteCard: cards.deleteCard,
    editingCard: cards.editingCard,
    setEditingCard: cards.setEditingCard,
    saveEditedCard: cards.saveEditedCard,
    startAddingCard: cards.startAddingCard,
    dragHandlers,
  }
  return (
    <div className="app-shell h-dvh min-h-[640px] overflow-hidden bg-linear-[130deg,#0c66e4_0%,#338bfa_100%]">
      <TopBar
        canvas={state.activeCanvas}
        sidebarOpen={sidebarOpen}
        sidebarCollapsed={sidebarCollapsed}
        onToggleSidebar={() => setSidebarCollapsed((value) => !value)}
        onOpenSidebar={() => setSidebarOpen(true)}
        onNewCanvas={() =>
          setDialog({
            heading: 'Create canvas',
            submitLabel: 'Create canvas',
            value: '',
          })
        }
        onRename={commands.renameCanvas}
        onFavorite={() =>
          state.updateActiveCanvas((canvas) => ({
            ...canvas,
            favorite: !canvas.favorite,
          }))
        }
        onDelete={commands.deleteCanvas}
        onImport={commands.importYaml}
        onNotify={notify}
      />
      <div className="workspace-layout flex h-[calc(100dvh-48px)] min-h-[592px]">
        <Sidebar
          canvases={state.canvases}
          activeId={state.activeCanvas?.id ?? null}
          onSelect={commands.selectCanvas}
          onMove={commands.moveCanvas}
          onLoadSamples={commands.loadSampleData}
          open={sidebarOpen}
          collapsed={sidebarCollapsed}
          onClose={() => setSidebarOpen(false)}
        />
        {state.activeCanvas ? (
          <CanvasBoard
            sections={state.activeCanvas.sections}
            sectionProps={sectionProps}
          />
        ) : (
          <main className="main-area h-full min-w-0 flex-1" />
        )}
      </div>
      <Dialog
        dialog={dialog}
        setDialog={setDialog}
        onSubmit={(current) => {
          const name = current.value.trim()
          if (!name) return
          commands.createCanvas(name)
          setDialog(null)
        }}
      />
      <Toast notice={notice} />
    </div>
  )
}
