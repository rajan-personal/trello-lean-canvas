import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, spyOn, waitFor } from 'storybook/test'
import { useNotice } from '../app/useNotice'
import { Toast } from './Toast'

function Notices() {
  const { notice, notify } = useNotice()
  return <><button onClick={() => notify('First save')}>First save</button>
    <button onClick={() => notify('Latest save')}>Latest save</button><Toast notice={notice} /></>
}
const meta = {
  title: 'Lean Canvas/ToastTiming', component: Toast,
  args: { notice: '' },
  render: function Fixture() {
    const [mounted, setMounted] = useState(true)
    return <div className="bg-white p-4"><button onClick={() => setMounted((value) => !value)}>Toggle notices</button>
      {mounted && <Notices />}</div>
  },
} satisfies Meta<typeof Toast>
export default meta
type Story = StoryObj<typeof meta>
const delay = (milliseconds: number) => new Promise((resolve) => setTimeout(resolve, milliseconds))

export const LatestNoticeGetsFullDuration: Story = {
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'First save' }))
    await expect(canvas.getByRole('status')).toHaveTextContent('First save')
    await delay(1300)
    await userEvent.click(canvas.getByRole('button', { name: 'Latest save' }))
    await delay(1100)
    await expect(canvas.getByRole('status')).toHaveTextContent('Latest save')
    await waitFor(() => expect(canvas.getByRole('status')).toBeEmptyDOMElement())
  },
}
export const UnmountCancelsTimer: Story = {
  play: async ({ canvas, userEvent }) => {
    const scheduled = spyOn(window, 'setTimeout')
    const cancelled = spyOn(window, 'clearTimeout')
    try {
      await userEvent.click(canvas.getByRole('button', { name: 'First save' }))
      const index = scheduled.mock.calls.findIndex((call) => call[1] === 2200)
      await expect(index).toBeGreaterThanOrEqual(0)
      const timer = scheduled.mock.results[index].value
      await userEvent.click(canvas.getByRole('button', { name: 'Toggle notices' }))
      await expect(cancelled).toHaveBeenCalledWith(timer)
      await expect(canvas.queryByRole('status')).not.toBeInTheDocument()
      await userEvent.click(canvas.getByRole('button', { name: 'Toggle notices' }))
      await expect(canvas.getByRole('status')).toBeEmptyDOMElement()
    } finally { scheduled.mockRestore(); cancelled.mockRestore() }
  },
}
