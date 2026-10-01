import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect } from 'storybook/test'
import { Toast } from './Toast'
import { WorkspaceBoard } from '../app/WorkspaceBoard'
import { boardStoryData, boardStoryUser } from './board/board-story-fixtures'

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

export const WithPendingSave: Story = {
  args: { notice: 'Card moved' },
  render: (args) => <div className="flex h-dvh flex-col">
    <div className="h-12 shrink-0 text-white">Tickets</div>
    <WorkspaceBoard state={{ board: boardStoryData, pending: true, loading: false, error: null,
      dispatch: async () => {}, reload: async () => {} }} user={boardStoryUser} blocked={false}
      register={() => () => {}} notify={() => {}} onDismissDeleted={() => {}} />
    <Toast {...args} />
  </div>,
  play: async ({ canvas }) => {
    const toast = canvas.getByText('Card moved', { exact: true })
    const sync = canvas.getByText('Saving board…', { exact: true })
    await expect(toast).toBeVisible()
    await expect(sync).toBeVisible()
    const box = toast.getBoundingClientRect()
    const pill = sync.getBoundingClientRect()
    await expect(box.left + box.width / 2).toBeCloseTo(window.innerWidth / 2, 1)
    await expect(window.innerHeight - box.bottom).toBeCloseTo(16, 1)
    await expect(box.left).toBeGreaterThanOrEqual(0)
    await expect(box.right).toBeLessThanOrEqual(window.innerWidth)
    await expect(getComputedStyle(toast).pointerEvents).toBe('none')
    await expect(getComputedStyle(sync).bottom).toBe(window.innerWidth <= 360 ? '64px' : '12px')
    await expect(box.right <= pill.left || box.left >= pill.right || box.bottom <= pill.top || box.top >= pill.bottom).toBe(true)
  },
}

export const MobileWithPendingSave: Story = {
  ...WithPendingSave,
  globals: { viewport: { value: 'mobile1', isRotated: false } },
}
