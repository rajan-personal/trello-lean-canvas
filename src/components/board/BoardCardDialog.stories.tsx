import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn } from 'storybook/test'
import { BoardCardDialog } from './BoardCardDialog'
import { CardDialogStory } from './Board.story-support'
import type { RunBoardCommand } from './board-ui'
import { boardStoryData, boardStoryUser } from './board-story-fixtures'
import './kanban.css'

const meta = {
  decorators: [(Story) => <div style={{ background: 'white', color: '#172b4d', padding: 16 }}><Story /></div>],
  title: 'Kanban/Card details', component: BoardCardDialog, tags: ['autodocs'],
  args: { card: boardStoryData.cards[0], board: boardStoryData, user: boardStoryUser,
    pending: false, error: null, run: fn<RunBoardCommand>(async () => true), onClose: fn(), register: () => () => undefined },
  render: (args) => <CardDialogStory {...args} />,
  play: async ({ canvas, args }) => {
    const modal = canvas.getByRole('dialog', { name: 'Card details' })
    await expect(canvas.getByRole('textbox', { name: 'Title' })).toHaveValue(args.card.title)
    await expect(canvas.getByRole('textbox', { name: 'Description' })).toHaveValue(args.card.description)
    await expect(modal.querySelectorAll('form')).toHaveLength(2)
    await expect(modal.querySelectorAll('form form')).toHaveLength(0)
    await expect(canvas.queryByRole('combobox')).not.toBeInTheDocument()
    await expect(modal.querySelectorAll('li')).toHaveLength(args.board.comments.filter(({ cardId }) => cardId === args.card.id).length)
    if (args.pending || args.deleted) for (const name of ['Save', 'Delete card', 'Add comment'])
      await expect(canvas.getByRole('button', { name })).toBeDisabled()
    if (args.deleted) for (const input of canvas.getAllByRole('textbox')) await expect(input).toHaveAttribute('readonly')
    if (args.error) await expect(canvas.getByRole('alert')).toHaveTextContent(args.error)
  },
} satisfies Meta<typeof BoardCardDialog>
export default meta
type Story = StoryObj<typeof meta>
export const Discussion: Story = {}
export const EmptyDiscussion: Story = { args: { card: boardStoryData.cards[1] } }
export const MobileDiscussion: Story = { globals: { viewport: { value: 'mobile1', isRotated: false } } }
export const LongDiscussion: Story = { args: { board: { ...boardStoryData,
  comments: Array.from({ length: 8 }, (_, index) => ({ ...boardStoryData.comments[0], id: `comment-${index}`,
    authorName: index % 2 ? 'Sam Rivera' : 'Alex Morgan',
    text: index % 2 ? 'Agreed. Let’s keep the first milestone small and review what we learn.' : 'The pilot is ready for a closer look.\nWhat should we test first?' })) } } }
export const Saving: Story = { args: { pending: true } }
export const SaveFailure: Story = { args: { error: 'Changes could not be saved. Your draft is still here.', run: fn<RunBoardCommand>(async () => false) } }
export const LongPlainText: Story = { args: { card: { ...boardStoryData.cards[0],
  title: 'A long card title that wraps across lines without icons, badges, or hidden metadata',
  description: '<strong>This is plain text, not HTML.</strong>\n\n' + 'A detailed note. '.repeat(100) } } }

export const DeletedCanvas: Story = { args: { deleted: true } }
