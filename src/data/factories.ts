import type { LeanCanvas } from './types'
import { sectionTemplate } from './sections'

export function createBlankCanvas(name: string): LeanCanvas {
  const trimmedName = name.trim() || 'Imported canvas'
  return {
    id: crypto.randomUUID(),
    name: trimmedName,
    title: trimmedName,
    favorite: false,
    notes: '',
    sections: sectionTemplate.map((section) => ({ ...section, cards: [] })),
  }
}
