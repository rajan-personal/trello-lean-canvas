/* eslint-disable react-refresh/only-export-components */
import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import { CardComposer } from './CardComposer'
interface Props {
  initialValue?: string
  showOutsideTarget?: boolean
  onSave: () => void
  onCancel: () => void
}
function Harness({
  initialValue = '',
  showOutsideTarget = false,
  onSave,
  onCancel,
}: Props) {
  const [value, setValue] = useState(initialValue)
  const [open, setOpen] = useState(true)
  const [saved, setSaved] = useState<string[]>([])
  return (
    <div className="storybook-composer-harness grid gap-3 [&>button]:justify-self-start [&>button]:rounded-[5px] [&>button]:border [&>button]:border-[#b7bec8] [&>button]:bg-white [&>button]:px-2 [&>button]:py-[5px] [&>button]:text-xs [&>button]:text-[#44546f]">
      {open ? (
        <CardComposer
          value={value}
          setValue={setValue}
          onSave={() => {
            onSave()
            if (!value.trim()) return
            setSaved((cards) => [...cards, value.trim()])
            setValue('')
            setOpen(false)
          }}
          onCancel={() => {
            onCancel()
            setOpen(false)
          }}
        />
      ) : (
        <button type="button" onClick={() => setOpen(true)}>
          Resume draft
        </button>
      )}
      {saved.map((card, index) => <p key={index}>{card}</p>)}
      {showOutsideTarget && (
        <button type="button" className="storybook-outside-target">
          Outside composer
        </button>
      )}
    </div>
  )
}
export const cardComposerMeta = {
  title: 'Lean Canvas/CardComposer',
  component: Harness,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Controlled inline editor for adding a card. Drafts survive dismissal and reopen focused at the end.',
      },
    },
  },
  decorators: [
    (Story) => (
      <div className="storybook-composer-frame w-[300px] rounded-xl bg-[#f1f2f4] p-3 text-[#172b4d]">
        <Story />
      </div>
    ),
  ],
  args: { onSave: fn(), onCancel: fn() },
  render: (args) => <Harness key={args.initialValue ?? ''} {...args} />,
} satisfies Meta<typeof Harness>
export type CardComposerStory = StoryObj<typeof cardComposerMeta>
