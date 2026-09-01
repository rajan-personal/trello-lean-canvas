import type { LeanCanvas } from './types'
import { canvasToYaml } from './yaml'

function canvasFileName(name: string): string {
  return (
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || 'lean-canvas'
  )
}

export function downloadYaml(canvas: LeanCanvas): void {
  const blob = new Blob([canvasToYaml(canvas)], {
    type: 'application/yaml;charset=utf-8',
  })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = `${canvasFileName(canvas.name)}.yaml`
  anchor.click()
  URL.revokeObjectURL(url)
}
