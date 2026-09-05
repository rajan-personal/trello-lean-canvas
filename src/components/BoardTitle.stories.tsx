import { BoardTitleHarness } from './BoardTitle.story-support'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fireEvent, fn } from 'storybook/test'
import { BoardTitle } from './BoardTitle'
import { storyCanvas } from './component-story-fixtures'

const meta = {
  title: 'Lean Canvas/BoardTitle',
  component: BoardTitle,
  render: (args) => <BoardTitleHarness {...args} />,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  decorators: [
    (Story) => (
      <div className="flex h-12 w-[720px] items-center bg-[#0b4a6f] px-4 text-white">
        <Story />
      </div>
    ),
  ],
  args: { canvas: storyCanvas, onRename: fn() },
} satisfies Meta<typeof BoardTitle>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Team alignment' }))
    const input = canvas.getByRole('textbox', { name: 'Rename canvas' })
    await expect(input).toHaveFocus()
    fireEvent.change(input, { target: { value: 'Customer discovery' } })
    await userEvent.tab()
    await expect(args.onRename).toHaveBeenCalledWith('Customer discovery')
    await expect(canvas.getByRole('heading', { name: 'Customer discovery' })).toBeVisible()
  },
}

export const NameFallback: Story = {
  args: { canvas: { ...storyCanvas, title: '' } },
}

export const LongTitle: Story = {
  args: {
    canvas: {
      ...storyCanvas,
      title: 'A very long canvas title that demonstrates toolbar truncation',
    },
  },
}
