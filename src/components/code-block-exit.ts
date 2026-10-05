import { Extension, type Editor } from '@tiptap/react'
import { closeHistory } from '@tiptap/pm/history'
import { Plugin } from '@tiptap/pm/state'

function exitOnThirdEnter(editor: Editor): boolean {
  const { empty, $from } = editor.state.selection
  if (!editor.isEditable || editor.view.composing || !empty || $from.parent.type.name !== 'codeBlock'
    || $from.parentOffset !== $from.parent.content.size || !$from.parent.textContent.endsWith('\n\n')
    || !editor.can().exitCode()) return false

  return editor.chain().command(({ tr }) => {
    closeHistory(tr)
    tr.delete($from.pos - 2, $from.pos)
    return true
  }).exitCode().run()
}

/** Keep two Enters for code; a third Enter at the end leaves the block. */
export const CodeBlockExit = Extension.create({
  name: 'codeBlockExit',
  priority: 110,
  addKeyboardShortcuts() {
    return { Enter: () => exitOnThirdEnter(this.editor) }
  },
  addProseMirrorPlugins() {
    return [new Plugin({
      props: {
        handleDOMEvents: {
          // Soft keyboards may send beforeinput without a usable Enter keydown.
          beforeinput: (_view, event) => {
            if (event.inputType !== 'insertParagraph' || event.isComposing || !event.cancelable
              || !exitOnThirdEnter(this.editor)) return false
            event.preventDefault()
            return true
          },
        },
      },
    })]
  },
})
