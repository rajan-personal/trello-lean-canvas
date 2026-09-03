import { expect, fireEvent } from 'storybook/test'
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
    fireEvent.change(canvas.getByRole('textbox', { name: 'Edit card' }), {
      target: { value: 'Updated customer problem' },
    })
    await userEvent.click(canvas.getByRole('button', { name: 'Save' }))
    await expect(args.onSave).toHaveBeenCalledOnce()
  },
}

export const SaveWithKeyboardShortcut: Story = {
  play: async ({ args, canvas, userEvent }) => {
    const editor = canvas.getByRole('textbox', { name: 'Edit card' })
    fireEvent.change(editor, {
      target: { value: 'Saved from the keyboard' },
    })
    await userEvent.keyboard('{Control>}{Enter}{/Control}')
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
