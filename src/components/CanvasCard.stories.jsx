import { expect, fn } from 'storybook/test'
import { CanvasCard } from './CanvasCard.jsx'

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
    onDragStart: fn(),
    onDragEnd: fn(),
  },
}

export default meta

export const Plain = {
  args: {
    text: 'Decisions disappear across chat, docs, and meetings',
  },
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button'))
    await expect(args.onEdit).toHaveBeenCalledWith('problem', 0, args.text)
  },
}

export const HeadingAndBody = {
  args: {
    text: 'North star\nTeams completing 3+ check-ins weekly',
  },
}
