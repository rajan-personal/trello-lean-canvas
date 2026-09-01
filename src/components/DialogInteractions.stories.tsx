import { expect } from 'storybook/test'
import {
  createDialog,
  dialogMeta,
  type DialogStory,
} from './Dialog.story-support'

const meta = { ...dialogMeta, title: 'Lean Canvas/Dialog' }
export default meta

export const Submit: DialogStory = {
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.type(
      canvas.getByRole('textbox', { name: 'Canvas name' }),
      'Launch plan',
    )
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
    await userEvent.click(canvas.getByRole('button', { name: 'Cancel' }))
    await expect(canvas.queryByRole('dialog')).not.toBeInTheDocument()
  },
}

export const CloseButton: DialogStory = {
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Close dialog' }))
    await expect(canvas.queryByRole('dialog')).not.toBeInTheDocument()
  },
}

export const BackdropDismiss: DialogStory = {
  play: async ({ canvasElement, canvas, userEvent }) => {
    const backdrop = canvasElement.querySelector('.dialog-backdrop')
    if (!(backdrop instanceof HTMLElement)) {
      throw new Error('Dialog backdrop is missing')
    }
    await userEvent.click(backdrop)
    await expect(canvas.queryByRole('dialog')).not.toBeInTheDocument()
  },
}
