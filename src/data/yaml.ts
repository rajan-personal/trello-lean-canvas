import { dump, load } from 'js-yaml'
import type { LeanCanvas } from './types'
import { sectionTemplate } from './sections'

type UnknownRecord = Record<string, unknown>

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === 'object' && value !== null
}

function normalizeCard(card: unknown): string {
  if (typeof card === 'string') return card
  if (isRecord(card)) {
    const heading = card.heading ?? card.title ?? ''
    const body = card.text ?? card.body ?? ''
    return [heading, body].filter(Boolean).map(String).join('\n')
  }
  return String(card ?? '')
}

function normalizeCards(cards: unknown): string[] {
  if (!Array.isArray(cards)) return []
  return cards.reduce<string[]>((normalized, card) => {
    const value = normalizeCard(card)
    if (value) normalized.push(value)
    return normalized
  }, [])
}

export function canvasToYaml(canvas: LeanCanvas): string {
  return dump(
    {
      version: 1,
      canvas: {
        id: canvas.id,
        name: canvas.name,
        title: canvas.title,
        favorite: canvas.favorite,
        notes: canvas.notes,
        sections: canvas.sections.map(({ id, number, title, hint, cards }) => ({
          id,
          ...(number ? { number } : {}),
          title,
          hint,
          cards,
        })),
      },
    },
    { noRefs: true, lineWidth: 100, quotingType: '"', forceQuotes: false },
  )
}

export function yamlToCanvas(
  source: string,
  fallbackCanvas: LeanCanvas,
): LeanCanvas {
  const parsed: unknown = load(source)
  const input =
    isRecord(parsed) && isRecord(parsed.canvas) ? parsed.canvas : parsed
  if (!isRecord(input))
    throw new Error('The YAML file does not contain a canvas object.')

  const suppliedSections = Array.isArray(input.sections) ? input.sections : []
  if (!suppliedSections.length)
    throw new Error('The YAML file does not contain any sections.')

  const sections = sectionTemplate.map((template, index) => {
    const incoming =
      suppliedSections.find(
        (section) => isRecord(section) && section.id === template.id,
      ) ??
      suppliedSections.find(
        (section) => isRecord(section) && section.title === template.title,
      ) ??
      suppliedSections[index]

    if (!isRecord(incoming)) return { ...template, cards: [] }

    return {
      ...template,
      title: String(incoming.title ?? template.title),
      hint: String(incoming.hint ?? template.hint),
      cards: normalizeCards(incoming.cards),
    }
  })

  return {
    ...fallbackCanvas,
    id: fallbackCanvas.id,
    name: String(input.name ?? fallbackCanvas.name),
    title: String(input.title ?? fallbackCanvas.title),
    favorite: Boolean(input.favorite ?? fallbackCanvas.favorite),
    notes: String(input.notes ?? fallbackCanvas.notes),
    sections,
  }
}
