import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn } from 'storybook/test'
import { CardComposer } from './CardComposer'

interface ComposerHarnessProps {
  initialValue?: string
  onSave: () => void
  onCancel: () => void
}

function ComposerHarness({ initialValue = '', onSave, onCancel }: ComposerHarnessProps) {
  const [value, setValue] = useState(initialValue)
  return <CardComposer value={value} setValue={setValue} onSave={onSave} onCancel={onCancel} />
}

const meta = {
  title: 'Lean Canvas/CardComposer',
  component: ComposerHarness,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Controlled inline editor for adding a card. Enter saves, Shift+Enter adds a line, and Escape cancels.',
      },
    },
  },
  decorators: [
    (Story) => <div className="storybook-composer-frame"><Story /></div>,
  ],
  args: {
    onSave: fn(),
    onCancel: fn(),
  },
  render: (args) => <ComposerHarness {...args} />,
} satisfies Meta<typeof ComposerHarness>

export default meta
type Story = StoryObj<typeof meta>

export const Empty: Story = {}

export const Editing: Story = {
  args: {
    initialValue: 'Automatic blocker digest',
  },
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.type(canvas.getByRole('textbox'), '{enter}')
    await expect(args.onSave).toHaveBeenCalledOnce()
  },
}

export const CancelWithEscape: Story = {
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.type(canvas.getByRole('textbox'), 'Draft hypothesis{escape}')
    await expect(args.onCancel).toHaveBeenCalledOnce()
  },
}
