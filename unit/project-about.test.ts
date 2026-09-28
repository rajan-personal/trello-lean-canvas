import { describe, expect, it } from 'vitest'
import { parseCanvasArray } from '../src/data/canvas-schema'
import { canvasPayload, decodeCanvas } from '../src/data/firestore-model'
import { canvasToYaml, yamlToCanvas } from '../src/data/yaml'
import { canvas, timestamp } from './fixtures'

describe('project about data', () => {
  it('defaults older local and Firestore projects to empty details', () => {
    const legacy = canvas()
    Reflect.deleteProperty(legacy, 'about')
    expect(parseCanvasArray([legacy])).toEqual({ ok: true, value: [canvas()] })
    const { id, ...payload } = legacy
    expect(decodeCanvas(id, { ...payload, schemaVersion: 1, revision: 1, updatedAt: timestamp }).canvas).toEqual(canvas())
  })
  it('preserves multiline details through Firestore and YAML round trips', () => {
    const original = { ...canvas(), about: '# Project overview\n\n**Goals**\n- [ ] Validate demand\n\n[Plan](https://example.com)\n\n```js\nconst goal = 3\n```' }
    expect(decodeCanvas(original.id, { ...canvasPayload(original), schemaVersion: 1, revision: 2, updatedAt: timestamp }).canvas).toEqual(original)
    expect(yamlToCanvas(canvasToYaml(original), canvas())).toEqual(original)
  })
  it('keeps older YAML compatible and validates new details', () => {
    expect(yamlToCanvas('canvas:\n  sections:\n    - id: problem', canvas()).about).toBe('')
    for (const about of [123, null, 'x'.repeat(100001)]) {
      expect(parseCanvasArray([{ ...canvas(), about }]).ok).toBe(false)
    }
    expect(() => yamlToCanvas('canvas:\n  about: 123\n  sections:\n    - id: problem', canvas())).toThrow()
  })
})
