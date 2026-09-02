import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn } from 'storybook/test'
import { CanvasAddMenu } from './CanvasAddMenu'

const meta = {
  title: 'Lean Canvas/CanvasAddMenu',
  component: CanvasAddMenu,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  decorators: [
    (Story) => (
      <div className="flex h-12 w-56 items-center justify-end rounded-md bg-[#0b4a6f] px-3">
        <Story />
      </div>
    ),
  ],
  args: { onNew: fn(), onImport: fn(), onLoadSamples: fn() },
} satisfies Meta<typeof CanvasAddMenu>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  play: async ({ args, canvas, userEvent }) => {
    const trigger = canvas.getByRole('button', { name: 'Add canvas' })
    await userEvent.click(trigger)
    await expect(trigger).toHaveAttribute('aria-expanded', 'true')
    await userEvent.click(
      canvas.getByRole('button', { name: /^New$/ }),
    )
    await expect(args.onNew).toHaveBeenCalledOnce()
    await expect(trigger).toHaveAttribute('aria-expanded', 'false')
  },
}

export const UploadAndSample: Story = {
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.upload(
      canvas.getByLabelText('Upload canvas YAML file'),
      new File(['canvas: {}'], 'canvas.yaml', { type: 'application/yaml' }),
    )
    await expect(args.onImport).toHaveBeenCalledOnce()
    await userEvent.click(canvas.getByRole('button', { name: 'Add canvas' }))
    await userEvent.click(canvas.getByRole('button', { name: 'Sample' }))
    await expect(args.onLoadSamples).toHaveBeenCalledOnce()
  },
}
