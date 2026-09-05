import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect } from 'storybook/test'
import { Toast } from './Toast'

const meta = {
  title: 'Lean Canvas/Toast',
  component: Toast,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
  args: { notice: 'Canvas saved automatically' },
} satisfies Meta<typeof Toast>

export default meta
type Story = StoryObj<typeof meta>

export const Visible: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('status')).toHaveTextContent(
      'Canvas saved automatically',
    )
  },
}

export const Hidden: Story = {
  args: { notice: '' },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('status')).toBeEmptyDOMElement()
    await expect(canvas.getByRole('status').getBoundingClientRect().height).toBe(0)
    await expect(canvas.getByRole('status')).toHaveAttribute('aria-atomic', 'true')
  },
}

export const MobileLongMessage: Story = {
  globals: { viewport: { value: 'mobile1', isRotated: false } },
  args: { notice: `Saved ${'synthetic-identifier'.repeat(20)}` },
  play: async ({ canvas }) => {
    const status = canvas.getByRole('status')
    await expect(window.innerWidth).toBe(320)
    await expect(status).toBeVisible()
    await expect(status.scrollWidth).toBeLessThanOrEqual(status.clientWidth)
    await expect(status.getBoundingClientRect().left).toBeGreaterThanOrEqual(0)
    await expect(status.getBoundingClientRect().right).toBeLessThanOrEqual(window.innerWidth)
  },
}
