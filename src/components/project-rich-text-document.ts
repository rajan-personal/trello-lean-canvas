import type { JSONContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { Markdown, MarkdownManager } from '@tiptap/markdown'
import { TaskItem, TaskList } from '@tiptap/extension-list'
import { CodeBlockExit } from './code-block-exit'

export const projectTextExtensions = [
  StarterKit.configure({ underline: false, link: { openOnClick: false }, trailingNode: false }),
  TaskList, TaskItem.configure({ nested: true }), Markdown, CodeBlockExit,
]

const markdown = new MarkdownManager({ extensions: projectTextExtensions })

function standaloneCode(node: JSONContent): string | null {
  if (node.type !== 'paragraph' || !node.content?.some((part) => part.marks?.some((mark) => mark.type === 'code'))) return null
  if (!node.content.every((part) => part.type === 'hardBreak' || (part.type === 'text'
    && (!part.text?.trim() || part.marks?.some((mark) => mark.type === 'code'))))) return null
  return node.content.map((part) => part.type === 'hardBreak' ? '\n' : part.text ?? '').join('')
}

/** Read legacy code-only paragraphs as one block without writing back on open. */
export function parseProjectText(value: string): JSONContent {
  const document = markdown.parse(value)
  const content: JSONContent[] = []
  let lines: string[] = []
  const flush = () => {
    if (lines.length) content.push({ type: 'codeBlock', content: [{ type: 'text', text: lines.join('\n') }] })
    lines = []
  }
  for (const node of document.content ?? []) {
    const code = standaloneCode(node)
    if (code !== null) lines.push(code)
    else { flush(); content.push(node) }
  }
  flush()
  return { ...document, content }
}
