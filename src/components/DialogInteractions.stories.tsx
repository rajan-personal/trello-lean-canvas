import { expect, fireEvent, waitFor } from 'storybook/test'
import {
  createDialog,
  dialogMeta,
  type DialogStory,
} from './Dialog.story-support'

const meta = { ...dialogMeta, title: 'Lean Canvas/Dialog' }
export default meta

export const Submit: DialogStory = {
  play: async ({ args, canvas, userEvent }) => {
    const input = await canvas.findByRole('textbox', { name: 'Canvas name' })
    fireEvent.change(input, { target: { value: 'Launch plan' } })
    await userEvent.click(canvas.getByRole('button', { name: 'Create canvas' }))
    await expect(args.onSubmit).toHaveBeenCalledWith({
      ...createDialog,
      value: 'Launch plan',
    })
    await expect(canvas.queryByRole('dialog')).not.toBeInTheDocument()
  },
}

export const Cancel: DialogStory = {
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(
      await canvas.findByRole('button', { name: 'Cancel' }),
    )
    await expect(canvas.queryByRole('dialog')).not.toBeInTheDocument()
  },
}

export const CloseButton: DialogStory = {
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(
      await canvas.findByRole('button', { name: 'Close dialog' }),
    )
    await expect(canvas.queryByRole('dialog')).not.toBeInTheDocument()
  },
}

export const BackdropDismiss: DialogStory = {
  play: async ({ canvasElement, canvas }) => {
    await canvas.findByRole('dialog', { name: 'Create canvas' })
    const backdrop = canvasElement.querySelector('.dialog-backdrop')
    if (!(backdrop instanceof HTMLElement)) {
      throw new Error('Dialog backdrop is missing')
    }
    fireEvent.mouseDown(backdrop)
    await waitFor(() =>
      expect(canvas.queryByRole('dialog')).not.toBeInTheDocument(),
    )
  },
}

export const EscapeDismiss: DialogStory = {
  play: async ({ canvas }) => {
    const dialog = await canvas.findByRole('dialog', { name: 'Create canvas' })
    fireEvent(dialog, new Event('cancel', { cancelable: true }))
    await waitFor(() =>
      expect(canvas.queryByRole('dialog')).not.toBeInTheDocument(),
    )
  },
}
