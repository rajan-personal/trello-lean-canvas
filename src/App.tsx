import { useEffect, useRef, useState, type ChangeEvent, type MouseEventHandler, type ReactNode } from 'react'
import {
  Database,
  Download,
  Menu,
  Plus,
  Star,
  Trash2,
  Upload,
  X,
} from 'lucide-react'
import {
  CanvasSection,
  type CanvasDragHandlers,
  type CanvasSectionProps,
  type EditingCard,
} from './components/CanvasSection'
import { Dialog, type CanvasDialogState } from './components/Dialog'
import {
  createBlankCanvas,
  createExampleCanvases,
  type CanvasSectionData,
  type LeanCanvas,
  type SectionId,
} from './data'
import { downloadYaml, yamlToCanvas } from './yaml'

const STORAGE_KEY = 'lean-canvas:v2'
const LEGACY_CANVAS_TITLE_PREFIX = 'Lean Canvas — '
const columnGroups: readonly (readonly [SectionId, SectionId])[] = [
  ['problem', 'alternatives'],
  ['solution', 'metrics'],
  ['value', 'concept'],
  ['advantage', 'channels'],
  ['segments', 'adopters'],
]

interface IconButtonProps {
  label: string
  title?: string
  onClick: MouseEventHandler<HTMLButtonElement>
  children: ReactNode
  active?: boolean
  pressed?: boolean
}

interface BoardTitleProps {
  canvas: LeanCanvas
  onRename: (name: string) => void
}

interface SidebarProps {
  canvases: LeanCanvas[]
  activeId: string | null
  onSelect: (canvasId: string) => void
  onLoadSamples: () => void
  open: boolean
  collapsed: boolean
  onClose: () => void
}

interface DraggedCard {
  sectionId: SectionId
  index: number
}

function readStoredCanvases(): LeanCanvas[] {
  const savedCanvases = localStorage.getItem(STORAGE_KEY)
  if (savedCanvases === null) return createExampleCanvases()

  try {
    const stored: unknown = JSON.parse(savedCanvases)
    return Array.isArray(stored) ? stored as LeanCanvas[] : []
  } catch {
    return []
  }
}

const toolbarButtonClass = 'grid size-8 flex-none place-items-center rounded-md border-0 bg-transparent p-0 text-white/75 hover:bg-white/17 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-white'
const brandActionButtonClass = 'grid size-7 flex-none place-items-center rounded-md border-0 bg-transparent p-0 text-white hover:bg-white/16 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-white'
const panelClass = 'min-w-0 overflow-hidden rounded-xl bg-[#f1f2f4] shadow-[0_1px_1px_rgba(9,30,66,0.25),0_0_1px_rgba(9,30,66,0.31)]'
const columnGridClass: Partial<Record<SectionId, string>> = {
  problem: 'col-[1/3]',
  solution: 'col-[3/5]',
  value: 'col-[5/7]',
  advantage: 'col-[7/9]',
  segments: 'col-[9/11]',
}

function Brand() {
  return <div className="brand inline-flex items-center gap-2 text-xl font-bold tracking-[-0.45px]" aria-label="Lean">Lean</div>
}

function IconButton({ label, title, onClick, children, active = false, pressed }: IconButtonProps) {
  return (
    <button
      className={`toolbar-icon ${toolbarButtonClass} ${active ? 'text-[#f5cd47]' : ''}`}
      aria-label={label}
      aria-pressed={pressed}
      title={title ?? label}
      onClick={onClick}
    >
      {children}
    </button>
  )
}

function getCanvasDisplayTitle(canvas: LeanCanvas): string {
  const title = canvas.title?.trim() || canvas.name
  if (title.startsWith(LEGACY_CANVAS_TITLE_PREFIX)) {
    return title.slice(LEGACY_CANVAS_TITLE_PREFIX.length).trim() || canvas.name
  }
  return title
}

function BoardTitle({ canvas, onRename }: BoardTitleProps) {
  const [editing, setEditing] = useState(false)
  const displayTitle = getCanvasDisplayTitle(canvas)
  const [draft, setDraft] = useState(displayTitle)

  const commitRename = () => {
    const name = draft.trim()
    setEditing(false)
    if (!name) {
      setDraft(displayTitle)
      return
    }
    if (name !== displayTitle) onRename(name)
  }

  return (
    <h1 className={`board-title m-0 flex min-w-0 max-w-[min(52vw,620px)] items-center text-lg leading-7 font-bold tracking-[-0.15px] whitespace-nowrap max-[760px]:text-base ${editing ? 'flex-[0_1_auto] overflow-visible' : 'overflow-hidden'}`}>
      {editing ? (
        <input
          className="board-title-input h-8 w-[clamp(100px,18vw,260px)] min-w-0 rounded-sm border-2 border-[#85b8ff] bg-white px-1.5 py-0.5 font-[inherit] leading-6 tracking-[inherit] text-[#172b4d] outline-none focus:border-[#579dff] focus:shadow-[0_0_0_1px_rgba(255,255,255,0.85)] max-[760px]:w-[clamp(90px,30vw,170px)]"
          aria-label="Rename canvas"
          autoFocus
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onBlur={commitRename}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault()
              event.currentTarget.blur()
            }
            if (event.key === 'Escape') {
              event.preventDefault()
              setDraft(displayTitle)
              setEditing(false)
            }
          }}
        />
      ) : (
        <button
          type="button"
          className="board-title-button ms-[-6px] min-w-0 max-w-[min(52vw,620px)] overflow-hidden text-ellipsis whitespace-nowrap rounded-sm border-0 bg-transparent px-1.5 py-0.5 font-[inherit] leading-[inherit] tracking-[inherit] text-[inherit] hover:bg-white/17 focus-visible:bg-white/17 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-white"
          title="Rename canvas"
          onClick={() => {
            setDraft(displayTitle)
            setEditing(true)
          }}
        >
          {displayTitle}
        </button>
      )}
    </h1>
  )
}

function Sidebar({ canvases, activeId, onSelect, onLoadSamples, open, collapsed, onClose }: SidebarProps) {
  return (
    <>
      {open && (
        <button
          className="sidebar-scrim fixed inset-x-0 top-12 bottom-0 z-50 block h-[calc(100dvh-48px)] w-full border-0 bg-[rgba(9,30,66,0.45)] p-0 min-[761px]:hidden"
          onClick={onClose}
          aria-label="Close sidebar"
        />
      )}
      <aside
        id="canvas-sidebar"
        className={`sidebar relative z-10 flex h-full w-[248px] basis-[248px] flex-col overflow-hidden bg-[#07558f] px-2.5 py-3.5 text-white shadow-[1px_0_0_rgba(255,255,255,0.14)] transition-[flex-basis,width,padding] duration-180 ease-out max-[760px]:fixed max-[760px]:top-12 max-[760px]:bottom-0 max-[760px]:left-0 max-[760px]:z-60 max-[760px]:h-auto max-[760px]:shadow-[8px_0_24px_rgba(9,30,66,0.35)] max-[760px]:transition-transform ${open ? 'max-[760px]:translate-x-0' : 'max-[760px]:translate-x-[-102%]'} ${collapsed ? 'min-[761px]:w-0 min-[761px]:basis-0 min-[761px]:px-0 min-[761px]:shadow-none' : ''}`}
      >
        <div className="sidebar-heading hidden min-h-[34px] justify-end max-[760px]:mb-1.5 max-[760px]:flex">
          <button className={`${brandActionButtonClass} mobile-close`} onClick={onClose} aria-label="Close sidebar"><X size={18} /></button>
        </div>
        <nav className="grid min-h-0 gap-[3px] overflow-y-auto" aria-label="Lean canvases">
          {canvases.map((canvas) => (
            <button
              className={`canvas-nav-item flex min-h-[38px] w-full items-center gap-2 overflow-hidden rounded-md border-0 px-2.5 py-2 ps-3.5 text-left text-sm leading-5 font-medium whitespace-nowrap text-white/90 hover:bg-white/10 ${canvas.id === activeId ? 'bg-white/16 text-white' : 'bg-transparent'}`}
              key={canvas.id}
              onClick={() => {
                onSelect(canvas.id)
                onClose()
              }}
            >
              <span className="canvas-nav-label min-w-0 flex-1 overflow-hidden text-ellipsis">{canvas.name}</span>
              {canvas.favorite && (
                <Star className="canvas-nav-favorite flex-none text-[#f5cd47]" size={15} fill="currentColor" aria-hidden="true" />
              )}
            </button>
          ))}
        </nav>
        <div className="sidebar-footer mt-auto border-t border-white/14 pt-2.5">
          <button
            type="button"
            className="load-samples-button flex min-h-[38px] w-full items-center gap-2.5 rounded-md border-0 bg-transparent px-2.5 py-2 text-left text-sm leading-5 font-medium text-white/90 hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-white"
            onClick={() => {
              onLoadSamples()
              onClose()
            }}
          >
            <Database size={17} aria-hidden="true" />
            <span>Load sample data</span>
          </button>
        </div>
      </aside>
    </>
  )
}

export default function App() {
  const [canvases, setCanvases] = useState<LeanCanvas[]>(readStoredCanvases)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [addingSectionId, setAddingSectionId] = useState<SectionId | null>(null)
  const [cardDraft, setCardDraft] = useState('')
  const [editingCard, setEditingCard] = useState<EditingCard | null>(null)
  const [notice, setNotice] = useState('')
  const [canvasDialog, setCanvasDialog] = useState<CanvasDialogState | null>(null)
  const importInputRef = useRef<HTMLInputElement>(null)
  const draggedCardRef = useRef<DraggedCard | null>(null)

  const activeCanvas = canvases.find((canvas) => canvas.id === activeId) ?? canvases[0]

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(canvases))
  }, [canvases])

  const notify = (message: string) => {
    setNotice(message)
    window.setTimeout(() => setNotice(''), 2200)
  }

  const updateActiveCanvas = (updater: (canvas: LeanCanvas) => LeanCanvas) => {
    if (!activeCanvas) return
    setCanvases((current) => current.map((canvas) => (
      canvas.id === activeCanvas.id ? updater(canvas) : canvas
    )))
  }

  const updateSection = (sectionId: SectionId, updater: (section: CanvasSectionData) => CanvasSectionData) => {
    updateActiveCanvas((canvas) => ({
      ...canvas,
      sections: canvas.sections.map((section) => section.id === sectionId ? updater(section) : section),
    }))
  }

  const addCard = (sectionId: SectionId) => {
    const text = cardDraft.trim()
    if (!text) return
    updateSection(sectionId, (section) => ({ ...section, cards: [...section.cards, text] }))
    setCardDraft('')
    setAddingSectionId(null)
    notify('Card added')
  }

  const editCard = (sectionId: SectionId, index: number, value: string) => {
    setAddingSectionId(null)
    setEditingCard({ sectionId, index, value })
  }

  const saveEditedCard = () => {
    const value = editingCard?.value.trim()
    if (!editingCard || !value) return
    updateSection(editingCard.sectionId, (section) => ({
      ...section,
      cards: section.cards.map((card, index) => index === editingCard.index ? value : card),
    }))
    setEditingCard(null)
    notify('Card updated')
  }

  const deleteCard = (sectionId: SectionId, index: number) => {
    updateSection(sectionId, (section) => ({
      ...section,
      cards: section.cards.filter((_, cardIndex) => cardIndex !== index),
    }))
    if (editingCard?.sectionId === sectionId) setEditingCard(null)
    notify('Card deleted')
  }

  const startAddingCard = (sectionId: SectionId) => {
    setEditingCard(null)
    setAddingSectionId(sectionId)
  }

  const createCanvas = (name: string) => {
    const canvas = createBlankCanvas(name)
    setCanvases((current) => [...current, canvas])
    setActiveId(canvas.id)
    setAddingSectionId(null)
    setEditingCard(null)
    notify('Canvas created')
  }

  const loadSampleData = () => {
    const samples = createExampleCanvases()
    const sampleIds = new Set(samples.map((canvas) => canvas.id))
    setCanvases((current) => [
      ...samples,
      ...current.filter((canvas) => !sampleIds.has(canvas.id)),
    ])
    setActiveId(samples[0]?.id ?? null)
    setAddingSectionId(null)
    setEditingCard(null)
    notify('Sample data loaded')
  }

  const renameCanvas = (name: string) => {
    updateActiveCanvas((canvas) => ({ ...canvas, name, title: name }))
    notify('Canvas renamed')
  }

  const deleteCanvas = () => {
    if (!activeCanvas || !window.confirm(`Delete “${activeCanvas.name}”? This cannot be undone.`)) return
    const nextCanvases = canvases.filter((canvas) => canvas.id !== activeCanvas.id)
    setCanvases(nextCanvases)
    setActiveId(nextCanvases[0]?.id ?? null)
    setAddingSectionId(null)
    setEditingCard(null)
    notify('Canvas deleted')
  }

  const importYaml = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    try {
      const fallbackName = file.name.replace(/\.ya?ml$/i, '') || 'Imported canvas'
      const imported = yamlToCanvas(await file.text(), createBlankCanvas(fallbackName))
      setCanvases((current) => [...current, imported])
      setActiveId(imported.id)
      setAddingSectionId(null)
      setEditingCard(null)
      notify(`Imported ${file.name}`)
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Could not import YAML')
    } finally {
      event.target.value = ''
    }
  }

  const dragHandlers: CanvasDragHandlers = {
    onDragStart(event, sectionId, index) {
      event.dataTransfer.effectAllowed = 'move'
      event.dataTransfer.setData('text/plain', `${sectionId}:${index}`)
      draggedCardRef.current = { sectionId, index }
    },
    onDragEnd() {
      draggedCardRef.current = null
    },
    onDrop(event, targetSectionId) {
      event.preventDefault()
      const draggedCard = draggedCardRef.current
      if (!draggedCard || draggedCard.sectionId === targetSectionId) return
      updateActiveCanvas((canvas) => {
        const source = canvas.sections.find((section) => section.id === draggedCard.sectionId)
        const card = source?.cards[draggedCard.index]
        if (!card) return canvas
        return {
          ...canvas,
          sections: canvas.sections.map((section) => {
            if (section.id === draggedCard.sectionId) {
              return { ...section, cards: section.cards.filter((_, index) => index !== draggedCard.index) }
            }
            if (section.id === targetSectionId) return { ...section, cards: [...section.cards, card] }
            return section
          }),
        }
      })
      draggedCardRef.current = null
      notify('Card moved')
    },
  }

  const sectionsById = (activeCanvas
    ? Object.fromEntries(activeCanvas.sections.map((section) => [section.id, section]))
    : {}) as Record<SectionId, CanvasSectionData>
  const sectionProps: Omit<CanvasSectionProps, 'section' | 'bottom'> = {
    addingSectionId,
    setAddingSectionId,
    cardDraft,
    setCardDraft,
    addCard,
    editCard,
    deleteCard,
    editingCard,
    setEditingCard,
    saveEditedCard,
    startAddingCard,
    dragHandlers,
  }

  return (
    <div className="app-shell h-dvh min-h-[640px] overflow-hidden bg-linear-[130deg,#0c66e4_0%,#338bfa_100%]">
      <header className="topbar relative z-20 flex h-12 items-center bg-[#0b4a6f] text-white shadow-[0_1px_0_rgba(9,30,66,0.25)]">
        <button
          className={`desktop-sidebar-button ms-2 me-[7px] ${toolbarButtonClass} max-[760px]:hidden`}
          onClick={() => setSidebarCollapsed((collapsed) => !collapsed)}
          aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          aria-expanded={!sidebarCollapsed}
          aria-controls="canvas-sidebar"
        >
          <Menu size={19} />
        </button>
        <div className={`topbar-brand flex h-full items-center gap-2 overflow-hidden px-3 transition-[flex-basis] duration-180 ease-out max-[760px]:gap-1.5 max-[760px]:px-2.5 ${sidebarCollapsed ? 'basis-[145px]' : 'basis-[201px] max-[760px]:basis-[132px]'}`}>
          <Brand />
          <button
            type="button"
            className={`${brandActionButtonClass} new-canvas-button ms-auto`}
            onClick={() => setCanvasDialog({ heading: 'Create canvas', submitLabel: 'Create canvas', value: '' })}
            aria-label="Add canvas"
            title="New canvas"
          >
            <Plus size={20} />
          </button>
        </div>
        <div className="board-toolbar flex h-full min-w-0 flex-1 items-center border-s border-white/14 px-3 text-white max-[760px]:px-1.5">
          <button
            className={`mobile-sidebar-button me-[7px] hidden max-[760px]:grid ${toolbarButtonClass}`}
            onClick={() => setSidebarOpen(true)}
            aria-label="Open sidebar"
            aria-expanded={sidebarOpen}
            aria-controls="canvas-sidebar"
          >
            <Menu size={19} />
          </button>
          {activeCanvas && <BoardTitle key={activeCanvas.id} canvas={activeCanvas} onRename={renameCanvas} />}
          <span className="toolbar-spacer flex-1" />
          {activeCanvas && (
            <>
              <IconButton label="Favorite canvas" onClick={() => updateActiveCanvas((canvas) => ({ ...canvas, favorite: !canvas.favorite }))} active={activeCanvas.favorite} pressed={activeCanvas.favorite}>
                <Star size={17} fill={activeCanvas.favorite ? 'currentColor' : 'none'} />
              </IconButton>
              <IconButton label="Download canvas data as YAML" title="Download YAML" onClick={() => {
                downloadYaml(activeCanvas)
                notify(`${activeCanvas.name}.yaml downloaded`)
              }}><Download size={17} /></IconButton>
              <IconButton label="Upload another canvas from YAML" title="Upload YAML" onClick={() => importInputRef.current?.click()}><Upload size={17} /></IconButton>
              <IconButton label="Delete board" onClick={deleteCanvas}><Trash2 size={17} /></IconButton>
            </>
          )}
          <input ref={importInputRef} className="file-input hidden" type="file" accept=".yaml,.yml,text/yaml,application/yaml" aria-label="Upload canvas YAML file" onChange={importYaml} />
        </div>
      </header>
      <div className="workspace-layout flex h-[calc(100dvh-48px)] min-h-[592px]">
        <Sidebar
          canvases={canvases}
          activeId={activeCanvas?.id ?? null}
          onSelect={(canvasId) => {
            setActiveId(canvasId)
            setAddingSectionId(null)
            setEditingCard(null)
          }}
          onLoadSamples={loadSampleData}
          open={sidebarOpen}
          collapsed={sidebarCollapsed}
          onClose={() => setSidebarOpen(false)}
        />
        <main className="main-area h-full min-w-0 flex-1">
          {activeCanvas ? (
            <div className="board-scroll h-[calc(100dvh-48px)] min-h-[592px] w-full overflow-auto p-3 [scrollbar-color:rgba(255,255,255,0.35)_rgba(0,0,0,0.12)]">
              <div className="lean-grid grid min-h-full w-full min-w-[1000px] grid-cols-10 grid-rows-[auto_auto_auto] content-stretch gap-2.5 max-[760px]:min-w-[1100px]">
                {columnGroups.map(([topId, bottomId]) => (
                  <div className={`canvas-column ${topId} ${panelClass} ${columnGridClass[topId] ?? ''} row-[1/3] grid min-h-0 grid-rows-subgrid gap-y-0 [&>section+section]:border-t-2 [&>section+section]:border-[#d6dce5]`} key={topId}>
                    <CanvasSection section={sectionsById[topId]} {...sectionProps} />
                    <CanvasSection section={sectionsById[bottomId]} {...sectionProps} />
                  </div>
                ))}
                <div className={`bottom-panel cost ${panelClass} col-[1/6] row-start-3 flex min-h-0`}><CanvasSection section={sectionsById.cost} bottom {...sectionProps} /></div>
                <div className={`bottom-panel revenue ${panelClass} col-[6/11] row-start-3 flex min-h-0`}><CanvasSection section={sectionsById.revenue} bottom {...sectionProps} /></div>
              </div>
            </div>
          ) : null}
        </main>
      </div>
      <Dialog
        dialog={canvasDialog}
        setDialog={setCanvasDialog}
        onSubmit={(currentDialog) => {
          const name = currentDialog.value.trim()
          if (!name) return
          createCanvas(name)
          setCanvasDialog(null)
        }}
      />
      {notice && (
        <div
          className="toast fixed right-[18px] bottom-[18px] z-120 max-w-[min(420px,calc(100vw-36px))] rounded-[7px] bg-[#172b4d] px-[15px] py-[11px] text-sm text-white shadow-[0_6px_18px_rgba(9,30,66,0.3)]"
          role="status"
        >
          {notice}
        </div>
      )}
    </div>
  )
}
