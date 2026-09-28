import { useEffect, useRef } from 'react'
import { EditorContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { Markdown } from '@tiptap/markdown'
import { TaskItem, TaskList } from '@tiptap/extension-list'
import { RichTextToolbar } from './RichTextToolbar'
import './project-rich-text-editor.css'

const extensions = [
  StarterKit.configure({ underline: false, link: { openOnClick: false }, trailingNode: false }),
  TaskList, TaskItem.configure({ nested: true }), Markdown,
]

interface Props {
  id: string
  value: string
  disabled: boolean
  invalid: boolean
  onChange: (value: string) => void
}

export default function ProjectRichTextEditor({ id, value, disabled, invalid, onChange }: Props) {
  const lastValue = useRef(value)
  const editor = useEditor({
    extensions,
    content: value,
    contentType: 'markdown',
    editable: !disabled,
    onUpdate: ({ editor }) => {
      lastValue.current = editor.isEmpty ? '' : editor.getMarkdown()
      onChange(lastValue.current)
    },
  })
  // Apply cloud updates and discarded drafts without resetting the selection on each keystroke.
  useEffect(() => {
    if (editor && value !== lastValue.current) {
      editor.commands.setContent(value, { contentType: 'markdown', emitUpdate: false })
      lastValue.current = value
    }
  }, [editor, value])
  useEffect(() => {
    if (!editor) return
    editor.setEditable(!disabled, false)
    editor.setOptions({ editorProps: { attributes: {
      id, role: 'textbox', 'aria-multiline': 'true', 'aria-labelledby': `${id}-label`,
      'aria-describedby': `${id}-status`, 'aria-invalid': String(invalid),
      'aria-readonly': String(disabled), spellcheck: 'true',
    } } })
  }, [editor, id, disabled, invalid])
  return <div className="project-rich-text-editor">
    {editor && <RichTextToolbar editor={editor} disabled={disabled} />}
    <EditorContent editor={editor} className="project-rich-text-content" />
  </div>
}
