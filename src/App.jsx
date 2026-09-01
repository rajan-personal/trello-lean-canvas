import { useEffect, useRef, useState } from 'react'
import {
  Download,
  Menu,
  Plus,
  Star,
  Trash2,
  Upload,
  X,
} from 'lucide-react'
import { CanvasSection } from './components/CanvasSection.jsx'
import { Dialog } from './components/Dialog.jsx'
import { createBlankCanvas } from './data.js'
import { downloadYaml, yamlToCanvas } from './yaml.js'

const STORAGE_KEY = 'lean-canvas:v2'
const LEGACY_CANVAS_TITLE_PREFIX = 'Lean Canvas — '
const columnGroups = [
  ['problem', 'alternatives'],
  ['solution', 'metrics'],
  ['value', 'concept'],
  ['advantage', 'channels'],
  ['segments', 'adopters'],
]

function readStoredCanvases() {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY))
    return Array.isArray(stored) ? stored : []
  } catch {
    return []
  }
}

function Brand() {
  return <div className="brand" aria-label="Lean">Lean</div>
}

function IconButton({ label, title, onClick, children, active = false }) {
  return (
    <button
      className={`toolbar-icon${active ? ' active' : ''}`}
      aria-label={label}
      title={title ?? label}
      onClick={onClick}
    >
      {children}
    </button>
  )
}

function getCanvasDisplayTitle(canvas) {
  const title = canvas.title?.trim() || canvas.name
  if (title.startsWith(LEGACY_CANVAS_TITLE_PREFIX)) {
    return title.slice(LEGACY_CANVAS_TITLE_PREFIX.length).trim() || canvas.name
  }
  return title
}

function BoardTitle({ canvas, onRename }) {
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
    <h1 className={`board-title${editing ? ' editing' : ''}`}>
      {editing ? (
        <input
          className="board-title-input"
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
          className="board-title-button"
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

function Sidebar({ canvases, activeId, onSelect, open, onClose }) {
  return (
    <>
      {open && <button className="sidebar-scrim" onClick={onClose} aria-label="Close sidebar" />}
      <aside id="canvas-sidebar" className={`sidebar${open ? ' open' : ''}`}>
        <div className="sidebar-heading">
          <button className="mobile-close" onClick={onClose} aria-label="Close sidebar"><X size={18} /></button>
        </div>
        <nav aria-label="Lean canvases">
          {canvases.map((canvas) => (
            <button
              className={`canvas-nav-item${canvas.id === activeId ? ' active' : ''}`}
              key={canvas.id}
              onClick={() => {
                onSelect(canvas.id)
                onClose()
              }}
            >
              {canvas.name}
            </button>
          ))}
        </nav>
      </aside>
    </>
  )
}

export default function App() {
  const [canvases, setCanvases] = useState(readStoredCanvases)
  const [activeId, setActiveId] = useState(() => readStoredCanvases()[0]?.id ?? null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [addingSectionId, setAddingSectionId] = useState(null)
  const [cardDraft, setCardDraft] = useState('')
  const [editingCard, setEditingCard] = useState(null)
  const [notice, setNotice] = useState('')
  const [canvasDialog, setCanvasDialog] = useState(null)
  const importInputRef = useRef(null)
  const draggedCardRef = useRef(null)

  const activeCanvas = canvases.find((canvas) => canvas.id === activeId) ?? canvases[0]

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(canvases))
  }, [canvases])

  const notify = (message) => {
    setNotice(message)
    window.setTimeout(() => setNotice(''), 2200)
  }

  const updateActiveCanvas = (updater) => {
    setCanvases((current) => current.map((canvas) => (
      canvas.id === activeCanvas.id ? updater(canvas) : canvas
    )))
  }

  const updateSection = (sectionId, updater) => {
    updateActiveCanvas((canvas) => ({
      ...canvas,
      sections: canvas.sections.map((section) => section.id === sectionId ? updater(section) : section),
    }))
  }

  const addCard = (sectionId) => {
    const text = cardDraft.trim()
    if (!text) return
    updateSection(sectionId, (section) => ({ ...section, cards: [...section.cards, text] }))
    setCardDraft('')
    setAddingSectionId(null)
    notify('Card added')
  }

  const editCard = (sectionId, index, value) => {
    setAddingSectionId(null)
    setCardDraft('')
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

  const deleteCard = (sectionId, index) => {
    updateSection(sectionId, (section) => ({
      ...section,
      cards: section.cards.filter((_, cardIndex) => cardIndex !== index),
    }))
    if (editingCard?.sectionId === sectionId) setEditingCard(null)
    notify('Card deleted')
  }

  const startAddingCard = (sectionId) => {
    setEditingCard(null)
    setCardDraft('')
    setAddingSectionId(sectionId)
  }

  const clearSection = (sectionId) => {
    const section = activeCanvas.sections.find((item) => item.id === sectionId)
    if (!section?.cards.length) return notify('This section is already empty')
    if (window.confirm(`Clear every card from ${section.title}?`)) {
      updateSection(sectionId, (item) => ({ ...item, cards: [] }))
      if (editingCard?.sectionId === sectionId) setEditingCard(null)
      notify(`${section.title} cleared`)
    }
  }

  const createCanvas = (name) => {
    const canvas = createBlankCanvas(name)
    setCanvases((current) => [...current, canvas])
    setActiveId(canvas.id)
    setAddingSectionId(null)
    setEditingCard(null)
    notify('Canvas created')
  }

  const renameCanvas = (name) => {
    updateActiveCanvas((canvas) => ({ ...canvas, name, title: name }))
    notify('Canvas renamed')
  }

  const deleteCanvas = () => {
    if (!window.confirm(`Delete “${activeCanvas.name}”? This cannot be undone.`)) return
    const nextCanvases = canvases.filter((canvas) => canvas.id !== activeCanvas.id)
    setCanvases(nextCanvases)
    setActiveId(nextCanvases[0]?.id ?? null)
    setAddingSectionId(null)
    setEditingCard(null)
    notify('Canvas deleted')
  }

  const importYaml = async (event) => {
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

  const dragHandlers = {
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

  const sectionsById = activeCanvas
    ? Object.fromEntries(activeCanvas.sections.map((section) => [section.id, section]))
    : {}
  const sectionProps = {
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
    clearSection,
    dragHandlers,
  }

  return (
    <div className={`app-shell${sidebarCollapsed ? ' sidebar-collapsed' : ''}`}>
      <header className="topbar">
        <button
          className="desktop-sidebar-button"
          onClick={() => setSidebarCollapsed((collapsed) => !collapsed)}
          aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          aria-expanded={!sidebarCollapsed}
          aria-controls="canvas-sidebar"
        >
          <Menu size={19} />
        </button>
        <div className="topbar-brand">
          <Brand />
          <button
            type="button"
            className="new-canvas-button"
            onClick={() => setCanvasDialog({ heading: 'Create canvas', submitLabel: 'Create canvas', value: '' })}
            aria-label="Add canvas"
            title="New canvas"
          >
            <Plus size={20} />
          </button>
        </div>
        <div className="board-toolbar">
          <button
            className="mobile-sidebar-button"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open sidebar"
            aria-expanded={sidebarOpen}
            aria-controls="canvas-sidebar"
          >
            <Menu size={19} />
          </button>
          {activeCanvas && <BoardTitle key={activeCanvas.id} canvas={activeCanvas} onRename={renameCanvas} />}
          <span className="toolbar-spacer" />
          {activeCanvas && (
            <>
              <IconButton label="Favorite canvas" onClick={() => updateActiveCanvas((canvas) => ({ ...canvas, favorite: !canvas.favorite }))} active={activeCanvas.favorite}>
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
          <input ref={importInputRef} className="file-input" type="file" accept=".yaml,.yml,text/yaml,application/yaml" aria-label="Upload canvas YAML file" onChange={importYaml} />
        </div>
      </header>
      <div className="workspace-layout">
        <Sidebar
          canvases={canvases}
          activeId={activeCanvas?.id ?? null}
          onSelect={(canvasId) => {
            setActiveId(canvasId)
            setAddingSectionId(null)
            setEditingCard(null)
          }}
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />
        <main className="main-area">
          {activeCanvas ? (
            <div className="board-scroll">
              <div className="lean-grid">
                {columnGroups.map(([topId, bottomId]) => (
                  <div className={`canvas-column ${topId}`} key={topId}>
                    <CanvasSection section={sectionsById[topId]} {...sectionProps} />
                    <CanvasSection section={sectionsById[bottomId]} {...sectionProps} />
                  </div>
                ))}
                <div className="bottom-panel cost"><CanvasSection section={sectionsById.cost} bottom {...sectionProps} /></div>
                <div className="bottom-panel revenue"><CanvasSection section={sectionsById.revenue} bottom {...sectionProps} /></div>
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
      {notice && <div className="toast" role="status">{notice}</div>}
    </div>
  )
}
