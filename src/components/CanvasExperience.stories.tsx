import { canvasStoryAct } from './canvas-story-act'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fireEvent, waitFor, within } from 'storybook/test'
import { CanvasExperience } from './CanvasExperience.story-support'

const meta = {
  title: 'Lean Canvas/Experience', component: CanvasExperience,
  parameters: { layout: 'fullscreen', docs: { story: { inline: false } } },
} satisfies Meta<typeof CanvasExperience>
export default meta
type Story = StoryObj<typeof meta>

export const DraftOwnership: Story = {
  play: async ({ canvas, canvasElement, userEvent }) => {
    await canvas.findByRole('heading', { name: 'Team alignment' })
    const section = within(canvasElement.querySelector('.canvas-cell')! as HTMLElement)
    await userEvent.click(section.getByRole('button', { name: '＋ Add a card' }))
    const editor = canvas.getByRole('textbox', { name: 'New card' })
    await canvasStoryAct(() => {
      fireEvent.change(editor, { target: { value: 'First canvas draft' } })
      fireEvent.keyDown(editor, { key: 'Escape' })
    })
    await userEvent.click(section.getByRole('button', { name: '＋ Add a card' }))
    await expect(canvas.getByRole('textbox', { name: 'New card' })).toHaveValue('First canvas draft')
    await userEvent.click(canvas.getByRole('button', { name: 'Favorite canvas with a deliberately long name' }))
    await userEvent.click(section.getByRole('button', { name: '＋ Add a card' }))
    await expect(canvas.getByRole('textbox', { name: 'New card' })).toHaveValue('')
    fireEvent.change(canvas.getByRole('textbox', { name: 'New card' }), { target: { value: 'Second canvas card' } })
    await userEvent.keyboard('{Enter}')
    await expect(section.getByRole('button', { name: 'Second canvas card' })).toBeVisible()
    await userEvent.click(within(canvas.getByRole('navigation')).getByRole('button', { name: 'Team alignment' }))
    await expect(canvas.queryByRole('button', { name: 'Second canvas card' })).not.toBeInTheDocument()
  },
}

export const MobilePanels: Story = {
  globals: { viewport: { value: 'mobile1', isRotated: false } },
  play: async ({ canvas, canvasElement, userEvent }) => {
    await canvas.findByRole('heading', { name: 'Team alignment' })
    await expect(window.innerWidth).toBe(320)
    const sidebar = canvasElement.querySelector<HTMLElement>('#canvas-sidebar')!
    await expect(sidebar).toHaveAttribute('inert')
    sidebar.querySelector('button')!.focus()
    await expect(sidebar.contains(document.activeElement)).toBe(false)
    const opener = canvas.getByRole('button', { name: 'Open sidebar' })
    await userEvent.click(opener)
    await expect(sidebar).not.toHaveAttribute('inert')
    await userEvent.keyboard('{Escape}')
    await expect(opener).toHaveFocus()
    await userEvent.click(canvas.getByRole('button', { name: 'Notepad' }))
    const notes = canvas.getByRole('textbox', { name: 'Canvas notes' })
    fireEvent.change(notes, { target: { value: 'First canvas notes' } })
    const board = canvas.getByRole('tab', { name: 'Board' })
    await waitFor(() => {
      const rect = board.getBoundingClientRect()
      expect(board.contains(document.elementFromPoint(rect.x + rect.width / 2, rect.y + rect.height / 2))).toBe(true)
    })
    await userEvent.click(board)
    await expect(board).toHaveAttribute('aria-selected', 'true')
    await userEvent.click(opener)
    await userEvent.click(canvas.getByRole('button', { name: 'Favorite canvas with a deliberately long name' }))
    await expect(canvas.getByRole('textbox', { name: 'Canvas notes' })).toHaveValue('Interview five customers before Friday.')
    await userEvent.click(opener)
    await userEvent.click(within(sidebar).getByRole('button', { name: 'Team alignment' }))
    await expect(canvas.getByRole('textbox', { name: 'Canvas notes' })).toHaveValue('First canvas notes')
  },
}
