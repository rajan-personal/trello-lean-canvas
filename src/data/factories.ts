import type { LeanCanvas } from './types'
import { sectionTemplate } from './sections'

export function createBlankCanvas(name: string): LeanCanvas {
  const trimmedName = name.trim() || 'Imported canvas'
  return {
    id: `${
      trimmedName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '') || 'canvas'
    }-${Date.now()}`,
    name: trimmedName,
    title: trimmedName,
    favorite: false,
    sections: sectionTemplate.map((section) => ({ ...section, cards: [] })),
  }
}
