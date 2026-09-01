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
  args: { text: 'Decisions disappear across chat, docs, and meetings' },
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.dblClick(canvas.getByRole('button', { name: args.text }))
    await expect(args.onEdit).toHaveBeenCalledWith('problem', 0, args.text)
  },
}

export const HeadingAndBody: Story = {
  args: { text: 'North star\nTeams completing 3+ check-ins weekly' },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('North star')).toHaveStyle({ fontWeight: '700' })
    await expect(canvas.getByText('Teams completing 3+ check-ins weekly')).toBeInTheDocument()
  },
}

export const DeleteInteraction: Story = {
  args: { text: 'A hypothesis ready to remove' },
  play: async ({ args, canvas, userEvent }) => {
    const deleteButton = canvas.getByRole('button', { name: 'Delete “A hypothesis ready to remove”' })
    deleteButton.focus()
    await expect(deleteButton).toHaveStyle({ opacity: '1' })
    await userEvent.click(deleteButton)
    await expect(args.onDelete).toHaveBeenCalledWith('problem', 0)
  },
}

export const KeyboardEdit: Story = {
  args: { text: 'Keyboard-accessible hypothesis' },
  play: async ({ args, canvas, userEvent }) => {
    canvas.getByRole('button', { name: args.text }).focus()
    await userEvent.keyboard('{enter}')
    await expect(args.onEdit).toHaveBeenCalledWith('problem', 0, args.text)
  },
}
