import type { Editor } from '@tiptap/react'

/** Keep block formatting from expanding a text selection to its whole paragraph. */
export function toggleSelectedCodeBlock(editor: Editor) {
  if (editor.state.selection.empty || editor.isActive('codeBlock')) {
    return editor.chain().focus().toggleCodeBlock().run()
  }

  return editor.chain().focus().command(({ tr, state }) => {
    const { from, to } = tr.selection
    const text = tr.doc.textBetween(from, to, '\n', (node) => node.type.name === 'hardBreak' ? '\n' : '')
    if (!text) return false
    const codeBlock = state.schema.nodes.codeBlock.create(null, state.schema.text(text))
    // ProseMirror splits the surrounding blocks and preserves their content/marks.
    // One transaction also makes the entire conversion a single undo step.
    tr.replaceSelectionWith(codeBlock, false)
    return true
  }).run()
}
