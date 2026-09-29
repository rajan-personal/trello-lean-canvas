import { expect, test } from 'vitest'
import { parseProjectText } from '../src/components/project-rich-text-document'

test('joins consecutive standalone code paragraphs and keeps their whitespace', () => {
  const document = parseProjectText(' `methods:  get`\n\n `schema:   title`')
  expect(document.content).toEqual([{ type: 'codeBlock', content: [{ type: 'text', text: ' methods:  get\n schema:   title' }] }])
})

test('keeps sentence snippets, lists, and explicitly separated code blocks distinct', () => {
  const document = parseProjectText('Use `title` here.\n\n- `first`\n- `second`\n\n```js\nconst x = 1\n```\n\n`separate block`')
  expect(document.content?.map((node) => node.type)).toEqual(['paragraph', 'bulletList', 'codeBlock', 'codeBlock'])
  expect(document.content?.[0].content?.[1].marks).toEqual([{ type: 'code' }])
  expect(document.content?.[2].attrs?.language).toBe('js')
})

test('does not merge standalone code across normal paragraphs or empty lines', () => {
  const document = parseProjectText('`first`\n\n**Heading**\n\n`second`\n\n&nbsp;\n\n`third`')
  expect(document.content?.map((node) => node.type)).toEqual(['codeBlock', 'paragraph', 'codeBlock', 'paragraph', 'codeBlock'])
})
