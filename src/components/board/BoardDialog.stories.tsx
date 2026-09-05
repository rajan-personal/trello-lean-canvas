import { useState, type ComponentProps } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, fireEvent } from 'storybook/test'
import { BoardDialog } from './BoardDialog'
import { canvasStoryAct } from '../canvas-story-act'
import './kanban.css'

function DialogStory(args: ComponentProps<typeof BoardDialog>) {
  const [open, setOpen] = useState(false)
  return <><button onClick={() => setOpen(true)}>Open dialog</button>
    {open && <BoardDialog {...args} onClose={() => { args.onClose(); setOpen(false) }} />}</>
}
const meta = {
  decorators: [(Story) => <div style={{ background: 'white', color: '#172b4d', padding: 16 }}><Story /></div>],
  title: 'Kanban/Dialog', component: BoardDialog,
  args: { title: 'Board dialog', onClose: fn(), children: <label>Draft<input defaultValue="Keep this" /></label> },
  render: (args) => <DialogStory {...args} />,
} satisfies Meta<typeof BoardDialog>
export default meta
type Story = StoryObj<typeof meta>
export const FocusAndExplicitExit: Story = { play: async ({ canvas, args, userEvent }) => {
  const trigger = canvas.getByRole('button', { name: 'Open dialog' })
  await userEvent.click(trigger)
  await expect(canvas.getByRole('textbox')).toHaveFocus()
  const modal = canvas.getByRole('dialog')
  await userEvent.click(modal)
  await expect(modal).toBeVisible()
  // Native Escape is exercised by Chromium browser tests; this checks React's cancel contract.
  await canvasStoryAct(() => { fireEvent(modal, new Event('cancel', { cancelable: true })) })
  await expect(args.onClose).toHaveBeenCalledOnce()
  await expect(trigger).toHaveFocus()
  await userEvent.click(trigger)
  await userEvent.click(canvas.getByRole('button', { name: 'Close dialog' }))
  await expect(trigger).toHaveFocus()
} }
