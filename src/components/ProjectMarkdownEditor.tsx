import { useState } from 'react'
import MDEditor, { commands } from '@uiw/react-md-editor/nohighlight'
import rehypeSanitize from 'rehype-sanitize'
import { Heading2 } from 'lucide-react'
import './project-markdown-editor.css'

const formatting = [
  { ...commands.title2, icon: <Heading2 size={16} /> }, commands.bold, commands.italic, commands.strikethrough,
  commands.link, commands.quote, commands.unorderedListCommand,
  commands.orderedListCommand, commands.checkedListCommand, commands.code, commands.codeBlock,
].map((command) => ({ ...command, icon: <span aria-hidden="true">{command.icon}</span> }))

interface Props {
  id: string
  value: string
  disabled: boolean
  invalid: boolean
  onChange: (value: string) => void
}

export default function ProjectMarkdownEditor({ id, value, disabled, invalid, onChange }: Props) {
  const [preview, setPreview] = useState(false)
  return <fieldset disabled={disabled} className="project-markdown-editor" data-color-mode="light">
    <legend className="sr-only">Project details editor</legend>
    <div className="project-markdown-modes" role="group" aria-label="Editor view">
      <button type="button" aria-pressed={!preview} onClick={() => setPreview(false)}>Write</button>
      <button type="button" aria-pressed={preview} onClick={() => setPreview(true)}>Preview</button>
      <span id={`${id}-hint`}>Markdown supported</span>
    </div>
    <MDEditor value={value} onChange={(next) => onChange(next ?? '')}
      preview={preview ? 'preview' : 'edit'} commands={formatting} extraCommands={[]}
      height="100%" visibleDragbar={false} defaultTabEnable hideToolbar={preview}
      textareaProps={{ id, name: 'about', maxLength: 100000, readOnly: disabled, spellCheck: true,
        'aria-describedby': `${id}-hint ${id}-status`, 'aria-invalid': invalid,
        placeholder: 'Project overview, goals, and useful links.',
      }}
      previewOptions={{ rehypePlugins: [rehypeSanitize], skipHtml: true,
        wrapperElement: { 'aria-label': 'Project details preview', role: 'region' },
      }}
    />
  </fieldset>
}
