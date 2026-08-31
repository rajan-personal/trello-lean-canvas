import { useEffect, useRef, useState } from 'react'
import {
  Download,
  MoreHorizontal,
  PanelLeftOpen,
  Pencil,
  Plus,
  Star,
  Trash2,
  Upload,
  X,
} from 'lucide-react'
import { createBlankCanvas, initialCanvases } from './data.js'
import { downloadYaml, yamlToCanvas } from './yaml.js'

const STORAGE_KEY = 'trello-lean-canvas:v1'
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
    return Array.isArray(stored) && stored.length ? stored : initialCanvases
  } catch {
    return initialCanvases
  }
}

function Brand() {
  return (
    <div className="brand" aria-label="Trello">
      <span className="trello-mark" aria-hidden="true"><i /><i /></span>
      <span>Trello</span>
    </div>
  )
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

function Sidebar({ canvases, activeId, onSelect, onAdd, open, onClose }) {
  return (
    <>
      {open && <button className="sidebar-scrim" onClick={onClose} aria-label="Close sidebar" />}
      <aside className={`sidebar${open ? ' open' : ''}`}>
        <div className="sidebar-heading">
          <strong>startups</strong>
          <button className="add-canvas" onClick={onAdd} aria-label="Add startup canvas"><Plus size={20} /></button>
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

function CanvasCard({ text, sectionId, index, onEdit, onDragStart, onDragEnd }) {
  const [heading, ...body] = String(text).split('\n')
  const hasHeading = body.length > 0
  return (
    <button
      className="canvas-card"
      onClick={() => onEdit(sectionId, index, text)}
      draggable
      onDragStart={(event) => onDragStart(event, sectionId, index)}
      onDragEnd={onDragEnd}
      title="Click to edit; drag to move"
    >
      {hasHeading && <strong>{heading}</strong>}
      <span>{hasHeading ? body.join('\n') : heading}</span>
    </button>
  )
}

function CardComposer({ value, setValue, onSave, onCancel }) {
  return (
    <div className="card-composer">
      <textarea
        autoFocus
        value={value}
        onChange={(event) => setValue(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault()
            onSave()
          }
          if (event.key === 'Escape') onCancel()
        }}
        placeholder="Enter card text…"
      />
      <div><button onClick={onSave}>Add card</button><button onClick={onCancel} aria-label="Cancel"><X size={19} /></button></div>
    </div>
  )
}

function CanvasSection({
  section,
  bottom = false,
  addingSectionId,
  setAddingSectionId,
  cardDraft,
  setCardDraft,
  addCard,
  editCard,
  clearSection,
  dragHandlers,
}) {
  return (
    <section
      className={`canvas-cell${bottom ? ' bottom-cell' : ''}`}
      onDragOver={(event) => event.preventDefault()}
      onDrop={(event) => dragHandlers.onDrop(event, section.id)}
    >
      <header className="cell-heading">
        <strong>{section.number && <span>{section.number}. </span>}{section.title}</strong>
        {(section.number || bottom) && (
          <button onClick={() => clearSection(section.id)} aria-label={`Clear ${section.title}`} title="Clear section">
            <MoreHorizontal size={20} />
          </button>
        )}
      </header>
      <p className="cell-hint">{section.hint}</p>
      <div className="canvas-cards">
        {section.cards.map((card, index) => (
          <CanvasCard
            key={`${section.id}-${index}-${card}`}
            text={card}
            sectionId={section.id}
            index={index}
            onEdit={editCard}
            onDragStart={dragHandlers.onDragStart}
            onDragEnd={dragHandlers.onDragEnd}
          />
        ))}
      </div>
      {addingSectionId === section.id ? (
        <CardComposer
          value={cardDraft}
          setValue={setCardDraft}
          onSave={() => addCard(section.id)}
          onCancel={() => {
            setAddingSectionId(null)
            setCardDraft('')
          }}
        />
      ) : (
        <button className="add-card-button" onClick={() => setAddingSectionId(section.id)}>＋ Add a card</button>
      )}
    </section>
  )
}

function Dialog({ dialog, setDialog, onSubmit }) {
  if (!dialog) return null
  const isCard = dialog.type === 'card'
  return (
    <div className="dialog-backdrop" role="presentation" onMouseDown={() => setDialog(null)}>
      <form
        className="dialog"
        role="dialog"
        aria-modal="true"
        aria-label={dialog.heading}
        onSubmit={(event) => {
          event.preventDefault()
          onSubmit(dialog)
        }}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="dialog-header">
          <h2>{dialog.heading}</h2>
          <button type="button" onClick={() => setDialog(null)} aria-label="Close dialog"><X size={20} /></button>
        </div>
        {isCard ? (
          <textarea
            autoFocus
            value={dialog.value}
            onChange={(event) => setDialog({ ...dialog, value: event.target.value })}
            rows="5"
          />
        ) : (
          <input
            autoFocus
            value={dialog.value}
            onChange={(event) => setDialog({ ...dialog, value: event.target.value })}
          />
        )}
        <div className="dialog-actions">
          {dialog.type === 'card' && <button type="button" className="danger" onClick={() => onSubmit({ ...dialog, remove: true })}>Delete</button>}
          <button type="button" className="secondary" onClick={() => setDialog(null)}>Cancel</button>
          <button type="submit">{dialog.submitLabel}</button>
        </div>
      </form>
    </div>
  )
}

export default function App() {
  const [canvases, setCanvases] = useState(readStoredCanvases)
  const [activeId, setActiveId] = useState(() => readStoredCanvases()[0].id)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [addingSectionId, setAddingSectionId] = useState(null)
  const [cardDraft, setCardDraft] = useState('')
  const [dialog, setDialog] = useState(null)
  const [notice, setNotice] = useState('')
  const [draggedCard, setDraggedCard] = useState(null)
  const importInputRef = useRef(null)

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
    setDialog({ type: 'card', heading: 'Edit card', submitLabel: 'Save card', sectionId, index, value })
  }

  const clearSection = (sectionId) => {
    const section = activeCanvas.sections.find((item) => item.id === sectionId)
    if (!section?.cards.length) return notify('This section is already empty')
    if (window.confirm(`Clear every card from ${section.title}?`)) {
      updateSection(sectionId, (item) => ({ ...item, cards: [] }))
      notify(`${section.title} cleared`)
    }
  }

  const submitDialog = (currentDialog) => {
    const value = currentDialog.value.trim()
    if (currentDialog.type === 'new') {
      if (!value) return
      const canvas = createBlankCanvas(value)
      setCanvases((current) => [...current, canvas])
      setActiveId(canvas.id)
      notify('Lean canvas created')
    }
    if (currentDialog.type === 'rename') {
      if (!value) return
      updateActiveCanvas((canvas) => ({ ...canvas, name: value, title: `Lean Canvas — ${value}` }))
      notify('Canvas renamed')
    }
    if (currentDialog.type === 'card') {
      updateSection(currentDialog.sectionId, (section) => ({
        ...section,
        cards: currentDialog.remove
          ? section.cards.filter((_, index) => index !== currentDialog.index)
          : section.cards.map((card, index) => index === currentDialog.index ? value : card),
      }))
      notify(currentDialog.remove ? 'Card deleted' : 'Card updated')
    }
    setDialog(null)
  }

  const deleteCanvas = () => {
    if (canvases.length === 1) return notify('Keep at least one lean canvas')
    if (!window.confirm(`Delete “${activeCanvas.name}”? This cannot be undone.`)) return
    const nextCanvases = canvases.filter((canvas) => canvas.id !== activeCanvas.id)
    setCanvases(nextCanvases)
    setActiveId(nextCanvases[0].id)
    notify('Canvas deleted')
  }

  const importYaml = async (event) => {
    const file = event.target.files?.[0]
    if (!file) return
    try {
      const imported = yamlToCanvas(await file.text(), activeCanvas)
      updateActiveCanvas(() => imported)
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
      setDraggedCard({ sectionId, index })
    },
    onDragEnd() {
      setDraggedCard(null)
    },
    onDrop(event, targetSectionId) {
      event.preventDefault()
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
      setDraggedCard(null)
      notify('Card moved')
    },
  }

  const sectionsById = Object.fromEntries(activeCanvas.sections.map((section) => [section.id, section]))
  const sectionProps = {
    addingSectionId,
    setAddingSectionId,
    cardDraft,
    setCardDraft,
    addCard,
    editCard,
    clearSection,
    dragHandlers,
  }

  return (
    <div className="app-shell">
      <header className="topbar"><Brand /></header>
      <div className="workspace-layout">
        <Sidebar
          canvases={canvases}
          activeId={activeCanvas.id}
          onSelect={setActiveId}
          onAdd={() => setDialog({ type: 'new', heading: 'Create lean canvas', submitLabel: 'Create canvas', value: '' })}
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />
        <main className="main-area">
          <div className="board-toolbar">
            <button className="mobile-sidebar-button" onClick={() => setSidebarOpen(true)} aria-label="Open sidebar"><PanelLeftOpen size={18} /></button>
            <h1>{activeCanvas.title}</h1>
            <span className="toolbar-spacer" />
            <IconButton label="Favorite canvas" onClick={() => updateActiveCanvas((canvas) => ({ ...canvas, favorite: !canvas.favorite }))} active={activeCanvas.favorite}>
              <Star size={17} fill={activeCanvas.favorite ? 'currentColor' : 'none'} />
            </IconButton>
            <IconButton label="Download canvas data as YAML" title="Download YAML" onClick={() => {
              downloadYaml(activeCanvas)
              notify(`${activeCanvas.name}.yaml downloaded`)
            }}><Download size={17} /></IconButton>
            <IconButton label="Import canvas data from YAML" title="Import YAML" onClick={() => importInputRef.current?.click()}><Upload size={17} /></IconButton>
            <input ref={importInputRef} className="file-input" type="file" accept=".yaml,.yml,text/yaml,application/yaml" onChange={importYaml} />
            <IconButton label="Edit board" onClick={() => setDialog({ type: 'rename', heading: 'Rename lean canvas', submitLabel: 'Save', value: activeCanvas.name })}><Pencil size={17} /></IconButton>
            <IconButton label="Delete board" onClick={deleteCanvas}><Trash2 size={17} /></IconButton>
          </div>
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
        </main>
      </div>
      <Dialog dialog={dialog} setDialog={setDialog} onSubmit={submitDialog} />
      {notice && <div className="toast" role="status">{notice}</div>}
    </div>
  )
}
