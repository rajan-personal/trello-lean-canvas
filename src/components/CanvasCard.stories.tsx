import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn } from 'storybook/test'
import { CanvasCard } from './CanvasCard'

const meta = {
  title: 'Lean Canvas/CanvasCard',
  component: CanvasCard,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'A draggable hypothesis card. A newline separates an optional bold heading from its body.',
      },
    },
  },
  decorators: [
    (Story) => <div className="storybook-card-frame"><Story /></div>,
  ],
  args: {
    sectionId: 'problem',
    index: 0,
    onEdit: fn(),
    onDelete: fn(),
    onDragStart: fn(),
    onDragEnd: fn(),
  },
} satisfies Meta<typeof CanvasCard>

export default meta
type Story = StoryObj<typeof meta>

export const Plain: Story = {
  args: {
    text: 'Decisions disappear across chat, docs, and meetings',
  },
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button'))
    await expect(args.onEdit).toHaveBeenCalledWith('problem', 0, args.text)
  },
}

export const HeadingAndBody: Story = {
  args: {
    text: 'North star\nTeams completing 3+ check-ins weekly',
  },
}
