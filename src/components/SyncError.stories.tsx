import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect } from 'storybook/test'
import { SyncError } from './SyncError'

const meta = {
  title: 'Lean Canvas/SyncError',
  component: SyncError,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
  args: { message: 'Changes could not be synchronized.' },
} satisfies Meta<typeof SyncError>

export default meta
type Story = StoryObj<typeof meta>

export const Visible: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('alert')).toHaveTextContent(
      'Changes could not be synchronized.',
    )
  },
}

export const MobileLongMessage: Story = {
  globals: { viewport: { value: 'mobile1', isRotated: false } },
  args: { message: `Cannot synchronize ${'synthetic-identifier'.repeat(25)}. Please try again.` },
  play: async ({ canvas }) => {
    const alert = canvas.getByRole('alert')
    await expect(window.innerWidth).toBe(320)
    await expect(alert).toBeVisible()
    await expect(alert.getBoundingClientRect().left).toBeGreaterThanOrEqual(0)
    await expect(alert.getBoundingClientRect().right).toBeLessThanOrEqual(window.innerWidth)
    await expect(alert.scrollWidth).toBeLessThanOrEqual(alert.clientWidth)
  },
}
