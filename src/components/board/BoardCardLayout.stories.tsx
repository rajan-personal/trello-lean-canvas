import type { StoryObj } from '@storybook/react-vite'
import { expect, waitFor } from 'storybook/test'
import cardMeta from './BoardCardDialog.stories'
import { setBoardInput } from './board-story-events'

const meta = { ...cardMeta, title: 'Kanban/Card layout' }
export default meta
type Story = StoryObj<typeof meta>
export const ExpandingPlainDescription: Story = { play: async ({ canvas, userEvent }) => {
  const modal = canvas.getByRole('dialog')
  const description = canvas.getByRole('textbox', { name: 'Description' })
  await expect(description.getBoundingClientRect().height).toBeGreaterThanOrEqual(320)
  await expect(modal.querySelectorAll('form')).toHaveLength(2)
  await expect(modal.querySelectorAll('form form')).toHaveLength(0)
  await expect(canvas.queryByRole('combobox')).not.toBeInTheDocument()
  await expect(canvas.queryByText('Move card', { exact: true })).not.toBeInTheDocument()
  const text = '<strong>Plain text</strong>\n' + 'A long unbroken description: '.repeat(200)
  await setBoardInput(description, text)
  await waitFor(() => expect(description.getBoundingClientRect().height).toBeGreaterThan(1000))
  await expect(description.scrollHeight).toBeLessThanOrEqual(description.clientHeight + 1)
  await expect(modal.scrollHeight).toBeGreaterThan(modal.clientHeight)
  await expect(modal.scrollWidth).toBeLessThanOrEqual(modal.clientWidth)
  await userEvent.click(canvas.getByRole('button', { name: 'Save' }))
  await userEvent.click(canvas.getByRole('button', { name: 'Outline the launch plan' }))
  const reopened = canvas.getByRole('textbox', { name: 'Description' })
  await expect(reopened).toHaveValue(text)
  await setBoardInput(reopened, 'Short again')
  await waitFor(() => expect(reopened.getBoundingClientRect().height).toBeLessThan(400))
} }
export const MobileStacking: Story = { globals: { viewport: { value: 'mobile1', isRotated: false } },
  play: async ({ canvas, userEvent }) => {
    await expect(window.innerWidth).toBe(320)
    const modal = canvas.getByRole('dialog')
    const editor = modal.querySelector('.kanban-card-editor')!
    const comments = canvas.getByRole('region', { name: 'Comments' })
    await expect(comments.getBoundingClientRect().top).toBeGreaterThan(editor.getBoundingClientRect().bottom)
    await expect(modal.scrollWidth).toBeLessThanOrEqual(modal.clientWidth)
    const remove = canvas.getByRole('button', { name: 'Delete card' })
    const close = canvas.getByRole('button', { name: 'Close dialog' })
    await expect(remove.parentElement).toBe(close.parentElement)
    await expect(remove.getBoundingClientRect().width).toBeLessThanOrEqual(44)
    await setBoardInput(canvas.getByRole('textbox', { name: 'New comment' }), 'Mobile discussion')
    await userEvent.click(canvas.getByRole('button', { name: 'Add comment' }))
    await expect(canvas.getByText('Mobile discussion')).toBeVisible()
  } }
