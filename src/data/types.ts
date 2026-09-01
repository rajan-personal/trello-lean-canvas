export type SectionId =
  | 'problem'
  | 'alternatives'
  | 'solution'
  | 'metrics'
  | 'value'
  | 'concept'
  | 'advantage'
  | 'channels'
  | 'segments'
  | 'adopters'
  | 'cost'
  | 'revenue'

export interface CanvasSectionData {
  id: SectionId
  number?: number
  title: string
  hint: string
  cards: string[]
}

export interface LeanCanvas {
  id: string
  name: string
  title: string
  favorite: boolean
  sections: CanvasSectionData[]
}
