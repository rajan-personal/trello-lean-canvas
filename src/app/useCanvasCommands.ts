import { loadExampleCanvases } from '../data/examples'
import { createBlankCanvas } from '../data/factories'
import { canvasTransfer } from './canvas-transfer'
import type { CanvasState } from './useCanvasState'

export function useCanvasCommands(
  state: CanvasState,
  clearEditing: () => void,
  notify: (message: string) => void,
) {
  const createCanvas = (name: string) => {
    const canvas = createBlankCanvas(name)
    state.setCanvases((current) => [...current, canvas])
    state.setActiveId(canvas.id)
    clearEditing()
    notify('Canvas created')
  }
  const moveCanvas = (id: string, target: number) => {
    const source = state.canvases.findIndex((canvas) => canvas.id === id)
    const bounded = Math.max(0, Math.min(target, state.canvases.length - 1))
    if (source < 0 || source === bounded) return
    state.setCanvases((current) => {
      const next = [...current]
      const [moved] = next.splice(source, 1)
      next.splice(bounded, 0, moved)
      return next
    })
    notify('Canvas moved')
  }
  const loadSampleData = async () => {
    try {
      const samples = await loadExampleCanvases()
      const ids = new Set(samples.map((canvas) => canvas.id))
      state.setCanvases((current) => [
        ...samples,
        ...current.filter((canvas) => !ids.has(canvas.id)),
      ])
      state.setActiveId(samples[0]?.id ?? null)
      clearEditing()
      notify('Sample data loaded')
    } catch {
      notify('Could not load sample data')
    }
  }
  const renameCanvas = (name: string) => {
    state.updateActiveCanvas((canvas) => ({ ...canvas, name, title: name }))
    notify('Canvas renamed')
  }
  const deleteCanvas = () => {
    const active = state.activeCanvas
    if (
      !active ||
      !window.confirm(`Delete “${active.name}”? This cannot be undone.`)
    )
      return
    const next = state.canvases.filter((canvas) => canvas.id !== active.id)
    state.setCanvases(next)
    state.setActiveId(next[0]?.id ?? null)
    clearEditing()
    notify('Canvas deleted')
  }
  const { importYaml, exportYaml } = canvasTransfer(state, clearEditing, notify)
  const selectCanvas = (id: string) => {
    state.setActiveId(id)
    clearEditing()
  }
  return {
    createCanvas,
    moveCanvas,
    loadSampleData,
    renameCanvas,
    deleteCanvas,
    importYaml,
    exportYaml,
    selectCanvas,
  }
}
