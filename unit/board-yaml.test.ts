import { describe, expect, it } from 'vitest'
import { dump } from 'js-yaml'
import { canvasToYaml, yamlToCanvas, yamlToCanvasBundle } from '../src/data/yaml'
import { createBoard } from '../src/data/board'
import { populatedBoard } from './board-fixtures'
import { canvas } from './fixtures'

describe('board YAML transfer', () => {
  it('round-trips separate board data with stable ids/order/comments into a new canvas id', () => {
    const source = canvas('original')
    source.sections[0].cards = ['Lean Canvas note, not a board card']
    const board = populatedBoard()
    const yaml = canvasToYaml(source, board)
    const result = yamlToCanvasBundle(yaml, canvas('imported'))
    expect(result.canvas).toEqual({ ...source, id: 'imported' })
    expect(result.board).toEqual(board)
    expect(result.board.cards.some(({ title }) => title.includes('Lean Canvas note'))).toBe(false)
    expect(yamlToCanvas(yaml, canvas('imported'))).toEqual(result.canvas)
  })
  it('accepts old canvas-only YAML and initializes defaults', () => {
    const source = canvas('old')
    const result = yamlToCanvasBundle(canvasToYaml(source), canvas('new'))
    expect(result.canvas).toEqual({ ...source, id: 'new' })
    expect(result.board).toEqual(createBoard())
  })
  it('rejects malformed board data rather than silently dropping it', () => {
    expect(() => yamlToCanvasBundle(dump({ canvas: canvas(), board: { columns: [] } }), canvas('new'))).toThrow()
    const board = populatedBoard()
    board.comments[0].cardId = 'missing'
    expect(() => canvasToYaml(canvas(), board)).toThrow()
  })
})
