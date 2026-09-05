import type { ChangeEvent } from 'react'
import { yamlToCanvasBundle } from '../data/yaml'
import { downloadYaml } from '../data/download'
import { createBlankCanvas } from '../data/factories'
import type { CanvasState } from './useCanvasState'

export function canvasTransfer(state: CanvasState, clearEditing: () => void, notify: (message: string) => void) {
  const importYaml = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    let staged = false
    try {
      const fallbackName =
        file.name.replace(/\.ya?ml$/i, '') || 'Imported canvas'
      const imported = yamlToCanvasBundle(
        await file.text(),
        createBlankCanvas(fallbackName),
      )
      state.boards.stageImport(imported.canvas, imported.board)
      staged = true
      state.setCanvases((current) => [...current, imported.canvas])
      state.setActiveId(imported.canvas.id)
      clearEditing()
      await state.flushCanvases()
      notify(`Imported ${file.name}`)
    } catch (error) {
      const detail = error instanceof Error ? error.message : 'Could not import YAML'
      notify(staged ? `Import retained for retry on reload. ${detail}` : detail)
    } finally {
      event.target.value = ''
    }
  }
  const exportYaml = async () => {
    const canvas = state.activeCanvas
    if (!canvas) return
    try {
      await state.flushCanvases()
      const board = await state.boards.load(canvas.id)
      downloadYaml(canvas, board)
      notify(`${canvas.name}.yaml downloaded`)
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Could not export YAML')
    }
  }
  return { importYaml, exportYaml }
}
