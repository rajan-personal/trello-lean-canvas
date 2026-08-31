import { dump, load } from 'js-yaml'
import { sectionTemplate } from './data.js'

function normalizeCard(card) {
  if (typeof card === 'string') return card
  if (card && typeof card === 'object') {
    const heading = card.heading ?? card.title ?? ''
    const body = card.text ?? card.body ?? ''
    return [heading, body].filter(Boolean).join('\n')
  }
  return String(card ?? '')
}

export function canvasToYaml(canvas) {
  return dump({
    version: 1,
    canvas: {
      id: canvas.id,
      name: canvas.name,
      title: canvas.title,
      favorite: Boolean(canvas.favorite),
      sections: canvas.sections.map(({ id, number, title, hint, cards }) => ({
        id,
        ...(number ? { number } : {}),
        title,
        hint,
        cards,
      })),
    },
  }, { noRefs: true, lineWidth: 100, quotingType: '"', forceQuotes: false })
}

export function yamlToCanvas(source, fallbackCanvas) {
  const parsed = load(source)
  const input = parsed?.canvas ?? parsed
  if (!input || typeof input !== 'object') throw new Error('The YAML file does not contain a canvas object.')

  const suppliedSections = Array.isArray(input.sections) ? input.sections : []
  if (!suppliedSections.length) throw new Error('The YAML file does not contain any sections.')

  const sections = sectionTemplate.map((template, index) => {
    const incoming = suppliedSections.find((section) => section?.id === template.id)
      ?? suppliedSections.find((section) => section?.title === template.title)
      ?? suppliedSections[index]
    return {
      ...template,
      ...(incoming && typeof incoming === 'object' ? {
        title: String(incoming.title ?? template.title),
        hint: String(incoming.hint ?? template.hint),
        cards: Array.isArray(incoming.cards) ? incoming.cards.map(normalizeCard).filter(Boolean) : [],
      } : {}),
    }
  })

  return {
    ...fallbackCanvas,
    name: String(input.name ?? fallbackCanvas.name),
    title: String(input.title ?? fallbackCanvas.title),
    favorite: Boolean(input.favorite ?? fallbackCanvas.favorite),
    sections,
  }
}

export function downloadYaml(canvas) {
  const blob = new Blob([canvasToYaml(canvas)], { type: 'application/yaml;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = `${canvas.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'lean-canvas'}.yaml`
  anchor.click()
  URL.revokeObjectURL(url)
}
