/* eslint-disable react-refresh/only-export-components */
import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
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

export const createDialog: CanvasDialogState = {
  heading: 'Create canvas',
  submitLabel: 'Create canvas',
  value: '',
}

export const dialogMeta = {
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
  args: { initialDialog: createDialog, onSubmit: fn() },
  render: (args) => (
    <DialogHarness key={JSON.stringify(args.initialDialog)} {...args} />
  ),
} satisfies Meta<typeof DialogHarness>

export type DialogStory = StoryObj<typeof dialogMeta>
