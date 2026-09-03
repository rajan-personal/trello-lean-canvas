import type { Meta, StoryObj } from '@storybook/react-vite'
import { NotebookPen, Star } from 'lucide-react'
import { expect, fn } from 'storybook/test'
import { ToolbarIconButton } from './ToolbarIconButton'

const meta = {
  title: 'Lean Canvas/ToolbarIconButton',
  component: ToolbarIconButton,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  decorators: [
    (Story, context) => (
      <div className="rounded-md bg-[#0b4a6f] p-3 text-white">
        <Story />
        {context.args.controls && <div id={context.args.controls} hidden />}
      </div>
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
    const button = canvas.getByRole('button', { name: 'Favorite canvas' })
    await expect(button).toHaveAttribute('aria-pressed', 'true')
    await expect(getComputedStyle(button).color).toBe('rgb(245, 205, 71)')
    await expect(getComputedStyle(button).backgroundColor).toBe(
      'rgba(0, 0, 0, 0)',
    )
  },
}

export const ExpandedControl: Story = {
  args: {
    label: 'Notepad',
    active: true,
    expanded: true,
    controls: 'controlled-panel',
    children: <NotebookPen size={17} />,
  },
  play: async ({ canvas }) => {
    const button = canvas.getByRole('button', { name: 'Notepad' })
    await expect(button).toHaveAttribute('aria-expanded', 'true')
    await expect(button).toHaveAttribute('aria-controls', 'controlled-panel')
    await expect(getComputedStyle(button).color).toBe('rgb(245, 205, 71)')
    await expect(getComputedStyle(button).backgroundColor).not.toBe(
      'rgba(0, 0, 0, 0)',
    )
  },
}
