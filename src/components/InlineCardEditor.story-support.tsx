/* eslint-disable react-refresh/only-export-components */
import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import { InlineCardEditor } from './InlineCardEditor'
interface Props {
  initialValue?: string
  showOutsideTarget?: boolean
  onSave: () => void
  onCancel: () => void
}
function Harness({
  initialValue = '',
  showOutsideTarget = false,
  onSave,
  onCancel,
}: Props) {
  const [value, setValue] = useState(initialValue)
  const [open, setOpen] = useState(true)
  return (
    <div className="storybook-inline-editor-frame grid w-[300px] gap-3 rounded-xl bg-[#f1f2f4] p-3 text-[#172b4d]">
      {open ? (
        <InlineCardEditor
          value={value}
          setValue={setValue}
          onSave={onSave}
          onCancel={() => {
            onCancel()
            setOpen(false)
          }}
        />
      ) : (
        <p>Editor closed</p>
      )}
      {showOutsideTarget && (
        <button
          type="button"
          className="storybook-outside-target justify-self-start rounded-[5px] border border-[#b7bec8] bg-white px-2 py-[5px] text-xs text-[#44546f]"
        >
          Outside editor
        </button>
      )}
    </div>
  )
}
export const inlineEditorMeta = {
  title: 'Lean Canvas/InlineCardEditor',
  component: Harness,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Focused in-place editor for updating an existing canvas card.',
      },
    },
  },
  args: {
    initialValue: 'A concise customer problem',
    onSave: fn(),
    onCancel: fn(),
  },
  render: (args) => <Harness key={args.initialValue ?? ''} {...args} />,
} satisfies Meta<typeof Harness>
export type InlineEditorStory = StoryObj<typeof inlineEditorMeta>
