interface TicketNode { id: string; parentTicketId?: string | null }

/** Iterative validation: depth is not limited by the JavaScript call stack. */
export function hierarchyError(cards: readonly TicketNode[]): string | undefined {
  const byId = new Map(cards.map((card) => [card.id, card]))
  const complete = new Set<string>()
  for (const card of cards) {
    const path = new Set<string>()
    let current: TicketNode | undefined = card
    while (current && !complete.has(current.id)) {
      if (path.has(current.id)) return 'Ticket hierarchy contains a cycle'
      path.add(current.id)
      if (!current.parentTicketId) break
      const parent = byId.get(current.parentTicketId)
      if (!parent) return 'Parent ticket does not exist in this project'
      current = parent
    }
    for (const id of path) complete.add(id)
  }
}

export function ticketAncestors<T extends TicketNode>(cards: readonly T[], id: string): T[] {
  const byId = new Map(cards.map((card) => [card.id, card]))
  const path: T[] = []
  const seen = new Set([id])
  let parentId = byId.get(id)?.parentTicketId
  while (parentId && !seen.has(parentId)) {
    const parent = byId.get(parentId)
    if (!parent) break
    seen.add(parentId)
    path.push(parent)
    parentId = parent.parentTicketId
  }
  return path.reverse()
}

/** Persist parents before children, even when an imported YAML is in reverse order. */
export function hierarchyLayers<T extends TicketNode>(cards: readonly T[]): T[][] {
  const error = hierarchyError(cards)
  if (error) throw new Error(error)
  const children = new Map<string | null, T[]>()
  for (const card of cards) {
    const parent = card.parentTicketId ?? null
    const siblings = children.get(parent) ?? []
    siblings.push(card)
    children.set(parent, siblings)
  }
  const layers: T[][] = []
  let layer = children.get(null) ?? []
  while (layer.length) {
    layers.push(layer)
    layer = layer.flatMap((card) => children.get(card.id) ?? [])
  }
  return layers
}
