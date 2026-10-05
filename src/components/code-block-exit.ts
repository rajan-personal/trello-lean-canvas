import { Extension, type Editor } from '@tiptap/react'
import { closeHistory } from '@tiptap/pm/history'
import { Plugin, TextSelection } from '@tiptap/pm/state'

function exitAtCodeEdge(editor: Editor): boolean {
  const { empty, $from } = editor.state.selection
  if (!editor.isEditable || editor.view.composing || !empty || $from.parent.type.name !== 'codeBlock') return false

  const atEnd = $from.parentOffset === $from.parent.content.size && $from.parent.textContent.endsWith('\n\n')
  const atStart = $from.parentOffset === 1 && $from.parentOffset < $from.parent.content.size
    && $from.parent.textContent.startsWith('\n')
  if (!atEnd && !atStart) return false

  // An empty block has no distinct top or bottom; keep its existing downward exit.
  if (!atEnd) {
    const paragraph = editor.schema.nodes.paragraph
    const index = $from.index(-1)
    if (!$from.node(-1).canReplaceWith(index, index, paragraph)) return false
    return editor.commands.command(({ tr }) => {
      closeHistory(tr)
      tr.delete($from.pos - 1, $from.pos)
      const before = $from.before()
      tr.insert(before, paragraph.create())
      tr.setSelection(TextSelection.create(tr.doc, before + 1))
      tr.scrollIntoView()
      return true
    })
  }
  if (!editor.can().exitCode()) return false

  return editor.chain().command(({ tr }) => {
    closeHistory(tr)
    tr.delete($from.pos - 2, $from.pos)
    return true
  }).exitCode().run()
}

/** Two Enters at the top or three at the bottom leave the code block on that side. */
export const CodeBlockExit = Extension.create({
  name: 'codeBlockExit',
  priority: 110,
  addKeyboardShortcuts() {
    return { Enter: () => exitAtCodeEdge(this.editor) }
  },
  addProseMirrorPlugins() {
    return [new Plugin({
      props: {
        handleDOMEvents: {
          // Soft keyboards may send beforeinput without a usable Enter keydown.
          beforeinput: (_view, event) => {
            if (event.inputType !== 'insertParagraph' || event.isComposing || !event.cancelable
              || !exitAtCodeEdge(this.editor)) return false
            event.preventDefault()
            return true
          },
        },
      },
    })]
  },
})
