import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, within } from 'storybook/test'
import { CanvasAddMenuHarness } from './CanvasAddMenu.story-support'

const meta = {
  title: 'Lean Canvas/CanvasAddMenu', component: CanvasAddMenuHarness,
  args: { onNew: fn(), onImport: fn(), onLoadSamples: fn() },
} satisfies Meta<typeof CanvasAddMenuHarness>
export default meta
type Story = StoryObj<typeof meta>

export const IndependentPopovers: Story = {
  render: (args) => <div className="flex justify-between overflow-hidden h-14 bg-[#0b4a6f]">
    <div aria-label="First menu" role="group"><CanvasAddMenuHarness {...args} /></div>
    <div aria-label="Second menu" role="group"><CanvasAddMenuHarness {...args} /></div>
  </div>,
  play: async ({ canvas, userEvent }) => {
    const first = within(canvas.getByRole('group', { name: 'First menu' }))
    const second = within(canvas.getByRole('group', { name: 'Second menu' }))
    const trigger = second.getByRole('button', { name: 'Add canvas' })
    await userEvent.click(trigger)
    const popup = second.getByRole('group', { name: 'Add canvas options' })
    await expect(first.queryByRole('group', { name: 'Add canvas options' })).not.toBeInTheDocument()
    const box = popup.getBoundingClientRect()
    await expect(box.left).toBeGreaterThanOrEqual(0)
    await expect(box.right).toBeLessThanOrEqual(window.innerWidth)
    await userEvent.tab()
    await expect(second.getByRole('button', { name: 'New' })).toHaveFocus()
    await userEvent.click(trigger)
    await expect(trigger).toHaveFocus()
    await expect(trigger).toHaveAttribute('aria-expanded', 'false')
    await userEvent.click(trigger)
    await userEvent.click(second.getByRole('button', { name: 'New' }))
    await expect(second.getByText('New canvas requested')).toBeInTheDocument()
  },
}
