import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fireEvent, fn } from 'storybook/test'
import { CreateCanvasDialog } from './CreateCanvasDialog'
import type { CanvasDialogState } from './Dialog'

const initialDialog: CanvasDialogState = {
  heading: 'Create canvas',
  submitLabel: 'Create canvas',
  value: '',
}

function Harness({ onCreate }: { onCreate: (name: string) => void }) {
  const [dialog, setDialog] = useState<CanvasDialogState | null>(initialDialog)
  return (
    <CreateCanvasDialog
      dialog={dialog}
      setDialog={setDialog}
      onCreate={onCreate}
    />
  )
}

const meta = {
  title: 'Lean Canvas/CreateCanvasDialog',
  component: Harness,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
  args: { onCreate: fn() },
  render: (args, context) => <Harness key={context.id} {...args} />,
} satisfies Meta<typeof Harness>

export default meta
type Story = StoryObj<typeof meta>

export const SubmitTrimmedName: Story = {
  play: async ({ args, canvas, userEvent }) => {
    const input = await canvas.findByRole('textbox', { name: 'Canvas name' })
    fireEvent.change(input, { target: { value: '  Customer research  ' } })
    await userEvent.click(canvas.getByRole('button', { name: 'Create canvas' }))
    await expect(args.onCreate).toHaveBeenCalledWith('Customer research')
    await expect(canvas.queryByRole('dialog')).not.toBeInTheDocument()
  },
}

export const RejectBlankName: Story = {
  play: async ({ args, canvas, userEvent }) => {
    const input = await canvas.findByRole('textbox', { name: 'Canvas name' })
    fireEvent.change(input, { target: { value: '   ' } })
    await userEvent.click(canvas.getByRole('button', { name: 'Create canvas' }))
    await expect(args.onCreate).not.toHaveBeenCalled()
    await expect(canvas.getByRole('dialog')).toBeInTheDocument()
  },
}
