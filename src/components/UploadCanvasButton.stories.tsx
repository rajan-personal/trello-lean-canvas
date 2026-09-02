import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn } from 'storybook/test'
import { UploadCanvasButton } from './UploadCanvasButton'

const meta = {
  title: 'Lean Canvas/UploadCanvasButton',
  component: UploadCanvasButton,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  decorators: [
    (Story) => (
      <div className="rounded-md bg-[#0b4a6f] p-3 text-white"><Story /></div>
    ),
  ],
  args: { onImport: fn() },
} satisfies Meta<typeof UploadCanvasButton>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  play: async ({ args, canvas, userEvent }) => {
    const input = canvas.getByLabelText('Upload canvas YAML file')
    await expect(input).toHaveAttribute(
      'accept',
      '.yaml,.yml,text/yaml,application/yaml',
    )
    await userEvent.upload(
      input,
      new File(['canvas: {}'], 'canvas.yaml', { type: 'application/yaml' }),
    )
    await expect(args.onImport).toHaveBeenCalledOnce()
  },
}
