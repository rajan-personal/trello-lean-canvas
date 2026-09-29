import { useEffect, useRef, useState } from 'react'
import { EditorContent, useEditor } from '@tiptap/react'
import { parseProjectText, projectTextExtensions } from './project-rich-text-document'
import { RichTextToolbar } from './RichTextToolbar'
import './project-rich-text-editor.css'

interface Props {
  id: string
  value: string
  disabled: boolean
  invalid: boolean
  focus?: boolean
  onChange: (value: string) => void
}

export default function ProjectRichTextEditor({ id, value, disabled, invalid, focus = false, onChange }: Props) {
  const lastValue = useRef(value)
  const [initialContent] = useState(() => parseProjectText(value))
  const editor = useEditor({
    extensions: projectTextExtensions,
    content: initialContent,
    editable: !disabled,
    onUpdate: ({ editor }) => {
      lastValue.current = editor.isEmpty ? '' : editor.getMarkdown()
      onChange(lastValue.current)
    },
  })
  // Apply cloud updates and discarded drafts without resetting the selection on each keystroke.
  useEffect(() => {
    if (editor && !editor.isDestroyed && value !== lastValue.current) {
      editor.commands.setContent(parseProjectText(value), { emitUpdate: false })
      lastValue.current = value
    }
  }, [editor, value])
  useEffect(() => {
    if (!editor || editor.isDestroyed) return
    editor.setEditable(!disabled, false)
    editor.setOptions({ editorProps: { attributes: {
      id, role: 'textbox', 'aria-multiline': 'true', 'aria-labelledby': `${id}-label`,
      'aria-describedby': `${id}-status`, 'aria-invalid': String(invalid),
      'aria-readonly': String(disabled), spellcheck: 'true',
    } } })
  }, [editor, id, disabled, invalid])
  useEffect(() => {
    if (editor && !editor.isDestroyed && focus) editor.commands.focus()
  }, [editor, focus])
  return <div className="project-rich-text-editor">
    {editor && <RichTextToolbar editor={editor} disabled={disabled} />}
    <EditorContent editor={editor} className="project-rich-text-content" />
  </div>
}
