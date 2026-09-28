import { useEditorState, type Editor } from '@tiptap/react'
import { Bold, Italic, Strikethrough, Heading2, List, ListOrdered, ListChecks, Quote, Code, SquareCode, Undo2, Redo2 } from 'lucide-react'
import { RichTextLinkControl } from './RichTextLinkControl'

const formatting = [
  { label: 'Heading', icon: Heading2, active: 'heading', run: (e: Editor) => e.chain().focus().toggleHeading({ level: 2 }).run() },
  { label: 'Bold', icon: Bold, active: 'bold', run: (e: Editor) => e.chain().focus().toggleBold().run() },
  { label: 'Italic', icon: Italic, active: 'italic', run: (e: Editor) => e.chain().focus().toggleItalic().run() },
  { label: 'Strikethrough', icon: Strikethrough, active: 'strike', run: (e: Editor) => e.chain().focus().toggleStrike().run() },
  { label: 'Bullet list', icon: List, active: 'bulletList', run: (e: Editor) => e.chain().focus().toggleBulletList().run() },
  { label: 'Numbered list', icon: ListOrdered, active: 'orderedList', run: (e: Editor) => e.chain().focus().toggleOrderedList().run() },
  { label: 'Checklist', icon: ListChecks, active: 'taskList', run: (e: Editor) => e.chain().focus().toggleTaskList().run() },
  { label: 'Quote', icon: Quote, active: 'blockquote', run: (e: Editor) => e.chain().focus().toggleBlockquote().run() },
  { label: 'Inline code', icon: Code, active: 'code', run: (e: Editor) => e.chain().focus().toggleCode().run() },
  { label: 'Code block', icon: SquareCode, active: 'codeBlock', run: (e: Editor) => e.chain().focus().toggleCodeBlock().run() },
]

export function RichTextToolbar({ editor, disabled }: { editor: Editor; disabled: boolean }) {
  const state = useEditorState({ editor, selector: ({ editor }) => ({
    active: formatting.map(({ active }) => editor.isActive(active)),
    link: editor.isActive('link'), undo: editor.can().undo(), redo: editor.can().redo(),
  }) })
  return <fieldset disabled={disabled} className="rich-text-toolbar">
    <legend className="sr-only">Text formatting</legend>
    <div className="rich-text-buttons">
      {formatting.map(({ label, icon: Icon, run }, index) =>
        <button key={label} type="button" aria-label={label} title={label} aria-pressed={state.active[index]}
          onClick={() => run(editor)}><Icon size={18} aria-hidden="true" /></button>)}
      <RichTextLinkControl editor={editor} active={state.link} />
      <button type="button" aria-label="Undo" title="Undo" disabled={!state.undo}
        onClick={() => editor.chain().focus().undo().run()}><Undo2 size={18} aria-hidden="true" /></button>
      <button type="button" aria-label="Redo" title="Redo" disabled={!state.redo}
        onClick={() => editor.chain().focus().redo().run()}><Redo2 size={18} aria-hidden="true" /></button>
    </div>
  </fieldset>
}
