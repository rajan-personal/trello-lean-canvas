import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn } from 'storybook/test'
import { ProjectAbout } from './ProjectAbout'
import { storyCanvas } from './component-story-fixtures'

const meta = {
  title: 'Lean Canvas/ProjectAbout/Tabs',
  component: ProjectAbout,
  parameters: { layout: 'fullscreen' },
  decorators: [(Story) => <div className="flex h-dvh"><Story /></div>],
  args: { canvas: storyCanvas, onSave: fn().mockResolvedValue(undefined), register: () => () => {} },
} satisfies Meta<typeof ProjectAbout>
export default meta
type Story = StoryObj<typeof meta>

export const MultipleTabs: Story = {
  args: { canvas: { ...storyCanvas, about: 'Overview text', aboutTabs: [{ id: 'goals', title: 'Goals', content: 'Goal text' }] } },
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('tab', { name: 'Goals' }))
    await expect(await canvas.findByRole('textbox', { name: 'Goals' })).toHaveTextContent('Goal text')
    await userEvent.click(canvas.getByRole('button', { name: 'Add tab' }))
    const name = canvas.getByRole('textbox', { name: 'Tab name' })
    await userEvent.clear(name)
    await userEvent.type(name, 'Links')
    await expect(canvas.getByRole('tab', { name: 'Links' })).toHaveAttribute('aria-selected', 'true')
    await userEvent.click(canvas.getByRole('tab', { name: 'Goals' }))
    await userEvent.click(canvas.getByRole('button', { name: 'Delete tab' }))
    await userEvent.click(canvas.getByRole('button', { name: 'Save' }))
    await expect(args.onSave).toHaveBeenCalledWith({ about: 'Overview text',
      aboutTabs: [expect.objectContaining({ title: 'Links', content: '' })] })
  },
}
