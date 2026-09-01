import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn } from 'storybook/test'
import { InlineCardEditor } from './InlineCardEditor'

interface EditorHarnessProps {
  initialValue?: string
  showOutsideTarget?: boolean
  onSave: () => void
  onCancel: () => void
}

function EditorHarness({ initialValue = '', showOutsideTarget = false, onSave, onCancel }: EditorHarnessProps) {
  const [value, setValue] = useState(initialValue)
  const [open, setOpen] = useState(true)

  return (
    <div className="storybook-inline-editor-frame">
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
      ) : <p>Editor closed</p>}
      {showOutsideTarget && <button type="button" className="storybook-outside-target">Outside editor</button>}
    </div>
  )
}

const meta = {
  title: 'Lean Canvas/InlineCardEditor',
  component: EditorHarness,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Focused in-place editor for updating an existing canvas card.',
      },
    },
  },
  args: {
    initialValue: 'A concise customer problem',
    onSave: fn(),
    onCancel: fn(),
  },
  render: (args) => <EditorHarness key={args.initialValue ?? ''} {...args} />,
} satisfies Meta<typeof EditorHarness>

export default meta
type Story = StoryObj<typeof meta>

export const Editing: Story = {
  play: async ({ canvas }) => {
    const editor = canvas.getByRole('textbox', { name: 'Edit card' })
    await expect(editor).toHaveValue('A concise customer problem')
    await expect(editor).toHaveFocus()
  },
}

export const Save: Story = {
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.clear(canvas.getByRole('textbox', { name: 'Edit card' }))
    await userEvent.type(canvas.getByRole('textbox', { name: 'Edit card' }), 'Updated customer problem')
    await userEvent.click(canvas.getByRole('button', { name: 'Save' }))
    await expect(args.onSave).toHaveBeenCalledOnce()
  },
}

export const SaveWithKeyboardShortcut: Story = {
  play: async ({ args, canvas, userEvent }) => {
    const editor = canvas.getByRole('textbox', { name: 'Edit card' })
    await userEvent.clear(editor)
    await userEvent.type(editor, 'Saved from the keyboard{control>}{enter}{/control}')
    await expect(args.onSave).toHaveBeenCalledOnce()
  },
}

export const EmptyDisablesSave: Story = {
  args: { initialValue: '' },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('button', { name: 'Save' })).toBeDisabled()
  },
}

export const CancelWithEscape: Story = {
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.type(canvas.getByRole('textbox', { name: 'Edit card' }), '{escape}')
    await expect(args.onCancel).toHaveBeenCalledOnce()
    await expect(canvas.getByText('Editor closed')).toBeInTheDocument()
  },
}

export const DismissOutside: Story = {
  args: { showOutsideTarget: true },
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Outside editor' }))
    await expect(args.onCancel).toHaveBeenCalledOnce()
    await expect(canvas.getByText('Editor closed')).toBeInTheDocument()
  },
}
