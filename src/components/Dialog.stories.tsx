import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn } from 'storybook/test'
import { Dialog, type CanvasDialogState } from './Dialog'

interface DialogHarnessProps {
  initialDialog: CanvasDialogState
  onSubmit: (dialog: CanvasDialogState) => void
}

function DialogHarness({ initialDialog, onSubmit }: DialogHarnessProps) {
  const [dialog, setDialog] = useState<CanvasDialogState | null>(initialDialog)
  return (
    <Dialog
      dialog={dialog}
      setDialog={setDialog}
      onSubmit={(submittedDialog) => {
        onSubmit(submittedDialog)
        setDialog(null)
      }}
    />
  )
}

const createDialog: CanvasDialogState = {
  heading: 'Create canvas',
  submitLabel: 'Create canvas',
  value: '',
}

const meta = {
  title: 'Lean Canvas/Dialog',
  component: DialogHarness,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'Modal form used to name and create a Lean Canvas.',
      },
    },
  },
  args: {
    initialDialog: createDialog,
    onSubmit: fn(),
  },
  render: (args) => <DialogHarness key={JSON.stringify(args.initialDialog)} {...args} />,
} satisfies Meta<typeof DialogHarness>

export default meta
type Story = StoryObj<typeof meta>

export const Open: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('dialog', { name: 'Create canvas' })).toBeInTheDocument()
    await expect(canvas.getByRole('textbox', { name: 'Canvas name' })).toHaveFocus()
  },
}

export const Submit: Story = {
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.type(canvas.getByRole('textbox', { name: 'Canvas name' }), 'Launch plan')
    await userEvent.click(canvas.getByRole('button', { name: 'Create canvas' }))
    await expect(args.onSubmit).toHaveBeenCalledWith({ ...createDialog, value: 'Launch plan' })
    await expect(canvas.queryByRole('dialog')).not.toBeInTheDocument()
  },
}

export const Cancel: Story = {
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Cancel' }))
    await expect(canvas.queryByRole('dialog')).not.toBeInTheDocument()
  },
}

export const CloseButton: Story = {
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Close dialog' }))
    await expect(canvas.queryByRole('dialog')).not.toBeInTheDocument()
  },
}

export const BackdropDismiss: Story = {
  play: async ({ canvasElement, canvas, userEvent }) => {
    const backdrop = canvasElement.querySelector('.dialog-backdrop')
    if (!(backdrop instanceof HTMLElement)) throw new Error('Dialog backdrop is missing')
    await userEvent.click(backdrop)
    await expect(canvas.queryByRole('dialog')).not.toBeInTheDocument()
  },
}
