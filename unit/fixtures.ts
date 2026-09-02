import { sectionTemplate } from '../src/data/sections'
import type { LeanCanvas } from '../src/data/types'

export function canvas(id = 'canvas-a'): LeanCanvas {
  return {
    id,
    name: 'Test canvas',
    title: 'Test canvas',
    favorite: false,
    notes: '',
    sections: sectionTemplate.map((section) => ({ ...section, cards: [] })),
  }
}
export const timestamp = { seconds: 1, nanoseconds: 0 }
