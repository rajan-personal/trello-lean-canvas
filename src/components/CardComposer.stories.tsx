import { expect } from 'storybook/test'
import {
  cardComposerMeta,
  type CardComposerStory as Story,
} from './CardComposer.story-support'
const meta = { ...cardComposerMeta, title: 'Lean Canvas/CardComposer' }
export default meta

export const Empty: Story = {
  play: async ({ canvas }) => {
    await expect(
      canvas.getByRole('textbox', { name: 'New card' }),
    ).toHaveFocus()
    await expect(
      canvas.queryByRole('button', { name: 'Cancel adding card' }),
    ).not.toBeInTheDocument()
  },
}

export const Editing: Story = {
  args: { initialValue: 'Automatic blocker digest' },
  play: async ({ args, canvas, userEvent }) => {
    const textbox = canvas.getByRole('textbox', { name: 'New card' })
    await expect(textbox).toHaveFocus()
    await expect(textbox).toHaveProperty(
      'selectionStart',
      'Automatic blocker digest'.length,
    )
    await userEvent.type(textbox, '{enter}')
    await expect(args.onSave).toHaveBeenCalledOnce()
  },
}

export const CancelWithEscape: Story = {
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.type(
      canvas.getByRole('textbox', { name: 'New card' }),
      'Draft hypothesis{escape}',
    )
    await expect(args.onCancel).toHaveBeenCalledOnce()
    await expect(
      canvas.getByRole('button', { name: 'Resume draft' }),
    ).toBeInTheDocument()
  },
}

export const MultilineWithShiftEnter: Story = {
  play: async ({ canvas, userEvent }) => {
    const textbox = canvas.getByRole('textbox', { name: 'New card' })
    await userEvent.type(
      textbox,
      'North star{shift>}{enter}{/shift}Weekly active teams',
    )
    await expect(textbox).toHaveValue('North star\nWeekly active teams')
  },
}

export const DismissAndResumeDraft: Story = {
  args: { showOutsideTarget: true },
  play: async ({ args, canvas, userEvent }) => {
    const textbox = canvas.getByRole('textbox', { name: 'New card' })
    await userEvent.type(textbox, 'A draft worth keeping')
    await userEvent.click(
      canvas.getByRole('button', { name: 'Outside composer' }),
    )
    await expect(args.onCancel).toHaveBeenCalledOnce()
    await userEvent.click(canvas.getByRole('button', { name: 'Resume draft' }))

    const reopened = canvas.getByRole('textbox', { name: 'New card' })
    await expect(reopened).toHaveValue('A draft worth keeping')
    await expect(reopened).toHaveFocus()
    await expect(reopened).toHaveProperty(
      'selectionStart',
      'A draft worth keeping'.length,
    )
  },
}
