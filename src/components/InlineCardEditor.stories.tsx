import { expect } from 'storybook/test'
import {
  inlineEditorMeta,
  type InlineEditorStory as Story,
} from './InlineCardEditor.story-support'
const meta = { ...inlineEditorMeta, title: 'Lean Canvas/InlineCardEditor' }
export default meta

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
    await userEvent.type(
      canvas.getByRole('textbox', { name: 'Edit card' }),
      'Updated customer problem',
    )
    await userEvent.click(canvas.getByRole('button', { name: 'Save' }))
    await expect(args.onSave).toHaveBeenCalledOnce()
  },
}

export const SaveWithKeyboardShortcut: Story = {
  play: async ({ args, canvas, userEvent }) => {
    const editor = canvas.getByRole('textbox', { name: 'Edit card' })
    await userEvent.clear(editor)
    await userEvent.type(
      editor,
      'Saved from the keyboard{control>}{enter}{/control}',
    )
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
    await userEvent.type(
      canvas.getByRole('textbox', { name: 'Edit card' }),
      '{escape}',
    )
    await expect(args.onCancel).toHaveBeenCalledOnce()
    await expect(canvas.getByText('Editor closed')).toBeInTheDocument()
  },
}

export const DismissOutside: Story = {
  args: { showOutsideTarget: true },
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.click(
      canvas.getByRole('button', { name: 'Outside editor' }),
    )
    await expect(args.onCancel).toHaveBeenCalledOnce()
    await expect(canvas.getByText('Editor closed')).toBeInTheDocument()
  },
}
