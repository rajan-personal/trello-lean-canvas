import { canvasStoryAct } from './canvas-story-act'
import { expect, fireEvent } from 'storybook/test'
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
    await expect(canvas.getByText('Automatic blocker digest')).toBeVisible()
    await expect(canvas.queryByRole('textbox')).not.toBeInTheDocument()
  },
}

export const CancelWithEscape: Story = {
  play: async ({ args, canvas, userEvent }) => {
    await canvasStoryAct(async () => {
      await userEvent.type(canvas.getByRole('textbox', { name: 'New card' }), 'Draft hypothesis')
      await userEvent.keyboard('{Escape}')
    })
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
    fireEvent.change(textbox, {
      target: { value: 'A draft worth keeping' },
    })
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

export const RejectWhitespace: Story = {
  play: async ({ args, canvas, userEvent }) => {
    const input = canvas.getByRole('textbox', { name: 'New card' })
    await userEvent.type(input, '   {Enter}')
    await userEvent.click(canvas.getByRole('button', { name: 'Add card' }))
    await expect(args.onSave).not.toHaveBeenCalled()
    await expect(input).toHaveValue('   ')
  },
}
