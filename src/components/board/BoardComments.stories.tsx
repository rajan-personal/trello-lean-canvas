import { useState, type ComponentProps } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn } from 'storybook/test'
import { BoardComments } from './BoardComments'
import { boardStoryData, boardStoryUser } from './board-story-fixtures'
import { setBoardInput, submitBoardForm } from './board-story-events'
import './kanban.css'

function CommentsStory(args: ComponentProps<typeof BoardComments>) {
  const [text, setText] = useState(args.text)
  const [comments, setComments] = useState(args.comments)
  return <div className="kanban-dialog" style={{ position: 'static' }}>
    <BoardComments {...args} text={text} comments={comments} onText={setText} onAdd={async () => {
      await args.onAdd()
      setComments([...comments, { id: crypto.randomUUID(), cardId: 'plan', authorId: boardStoryUser.uid,
        authorName: boardStoryUser.displayName!, createdAt: new Date().toISOString(), text: text.trim() }])
      setText('')
    }} />
  </div>
}
const meta = {
  decorators: [(Story) => <div style={{ background: 'white', color: '#172b4d', padding: 16 }}><Story /></div>],
  title: 'Kanban/Comments', component: BoardComments,
  args: { comments: [], text: '', onText: fn(), onAdd: fn(async () => {}), pending: false },
  render: (args) => <CommentsStory {...args} />,
} satisfies Meta<typeof BoardComments>
export default meta
type Story = StoryObj<typeof meta>
export const AddPlainText: Story = { play: async ({ canvas, args, userEvent }) => {
  const input = canvas.getByRole('textbox') as HTMLTextAreaElement
  await expect(canvas.getByText('No comments yet.')).toBeVisible()
  await setBoardInput(input, '   ')
  await submitBoardForm(input.form!)
  await expect(args.onAdd).not.toHaveBeenCalled()
  await setBoardInput(input, '  <b>Plain comment</b>\nSecond line  ')
  await userEvent.click(canvas.getByRole('button', { name: 'Add comment' }))
  const comment = canvas.getByRole('listitem')
  await expect(comment).toHaveTextContent('<b>Plain comment</b> Second line')
  await expect(comment.querySelector('b')).toBeNull()
  await expect(comment.querySelector('strong')).toHaveTextContent('Alex Morgan')
  await expect(comment.querySelector('time')).toHaveAttribute('datetime', expect.stringMatching(/^\d{4}-/))
  await expect(input).toHaveValue('')
  await expect(args.onAdd).toHaveBeenCalledOnce()
} }
export const Pending: Story = { args: { pending: true, text: 'Waiting comment' }, play: async ({ canvas, args }) => {
  const input = canvas.getByRole('textbox') as HTMLTextAreaElement
  await expect(input).toBeDisabled()
  await submitBoardForm(input.form!)
  await expect(args.onAdd).not.toHaveBeenCalled()
} }
export const ReadOnly: Story = { args: { readOnly: true, text: 'Copy this draft', comments: boardStoryData.comments },
  play: async ({ canvas, args }) => {
    const input = canvas.getByRole('textbox') as HTMLTextAreaElement
    await expect(input).toHaveAttribute('readonly')
    await expect(input).toHaveValue('Copy this draft')
    await expect(canvas.getByRole('button')).toBeDisabled()
    await submitBoardForm(input.form!)
    await expect(args.onAdd).not.toHaveBeenCalled()
  } }
