import type { Meta, StoryObj } from '@storybook/react-vite'
import { Star } from 'lucide-react'
import { expect, fn } from 'storybook/test'
import { ToolbarIconButton } from './ToolbarIconButton'

const meta = {
  title: 'Lean Canvas/ToolbarIconButton',
  component: ToolbarIconButton,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  decorators: [
    (Story) => (
      <div className="rounded-md bg-[#0b4a6f] p-3 text-white"><Story /></div>
    ),
  ],
  args: {
    label: 'Favorite canvas',
    onClick: fn(),
    children: <Star size={17} />,
  },
} satisfies Meta<typeof ToolbarIconButton>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  play: async ({ args, canvas, userEvent }) => {
    const button = canvas.getByRole('button', { name: 'Favorite canvas' })
    await userEvent.click(button)
    await expect(args.onClick).toHaveBeenCalledOnce()
  },
}

export const ActivePressed: Story = {
  args: { active: true, pressed: true, title: 'Remove favorite' },
  play: async ({ canvas }) => {
    await expect(
      canvas.getByRole('button', { name: 'Favorite canvas' }),
    ).toHaveAttribute('aria-pressed', 'true')
  },
}

export const ExpandedControl: Story = {
  args: { expanded: true, controls: 'controlled-panel' },
}
