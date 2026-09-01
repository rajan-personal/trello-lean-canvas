import { useState } from 'react'
import { expect, fn } from 'storybook/test'
import { CardComposer } from './CardComposer.jsx'

function ComposerHarness({ initialValue = '', onSave, onCancel }) {
  const [value, setValue] = useState(initialValue)
  return <CardComposer value={value} setValue={setValue} onSave={onSave} onCancel={onCancel} />
}

const meta = {
  title: 'Lean Canvas/CardComposer',
  component: CardComposer,
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
}

export default meta

export const Empty = {}

export const Editing = {
  args: {
    initialValue: 'Automatic blocker digest',
  },
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.type(canvas.getByRole('textbox'), '{enter}')
    await expect(args.onSave).toHaveBeenCalledOnce()
  },
}

export const CancelWithEscape = {
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.type(canvas.getByRole('textbox'), 'Draft hypothesis{escape}')
    await expect(args.onCancel).toHaveBeenCalledOnce()
  },
}
