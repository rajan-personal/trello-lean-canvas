import { Extension, type Editor } from '@tiptap/react'
import { closeHistory } from '@tiptap/pm/history'
import { Plugin } from '@tiptap/pm/state'

function exitOnSecondEnter(editor: Editor): boolean {
  const { empty, $from } = editor.state.selection
  if (!editor.isEditable || editor.view.composing || !empty || $from.parent.type.name !== 'codeBlock'
    || $from.parentOffset !== $from.parent.content.size || !$from.parent.textContent.endsWith('\n')
    || !editor.can().exitCode()) return false

  return editor.chain().command(({ tr }) => {
    closeHistory(tr)
    tr.delete($from.pos - 1, $from.pos)
    return true
  }).exitCode().run()
}

/** Keep one Enter for code; a second Enter on its final empty line leaves the block. */
export const CodeBlockExit = Extension.create({
  name: 'codeBlockExit',
  priority: 110,
  addKeyboardShortcuts() {
    return { Enter: () => exitOnSecondEnter(this.editor) }
  },
  addProseMirrorPlugins() {
    return [new Plugin({
      props: {
        handleDOMEvents: {
          // Soft keyboards may send beforeinput without a usable Enter keydown.
          beforeinput: (_view, event) => {
            if (event.inputType !== 'insertParagraph' || event.isComposing || !event.cancelable
              || !exitOnSecondEnter(this.editor)) return false
            event.preventDefault()
            return true
          },
        },
      },
    })]
  },
})
