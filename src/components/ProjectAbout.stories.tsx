import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, waitFor } from 'storybook/test'
import { ProjectAbout } from './ProjectAbout'
import { storyCanvas } from './component-story-fixtures'

const meta = {
  title: 'Lean Canvas/ProjectAbout',
  component: ProjectAbout,
  parameters: { layout: 'fullscreen' },
  decorators: [(Story) => <div className="flex h-dvh"><Story /></div>],
  args: {
    canvas: { ...storyCanvas, about: 'Keep this introduction. Run npm test before saving. Keep this conclusion.' },
    onSave: fn().mockResolvedValue(undefined),
    register: () => () => {},
  },
} satisfies Meta<typeof ProjectAbout>
export default meta
type Story = StoryObj<typeof meta>

async function selectText(editor: HTMLElement, start: Node, from: number, end: Node, to: number) {
  editor.focus()
  const range = document.createRange()
  range.setStart(start, from)
  range.setEnd(end, to)
  const selection = window.getSelection()!
  selection.removeAllRanges()
  selection.addRange(range)
  document.dispatchEvent(new Event('selectionchange'))
  await waitFor(() => {
    expect(selection.anchorNode).toBe(start)
    expect(selection.anchorOffset).toBe(from)
    expect(selection.focusNode).toBe(end)
    expect(selection.focusOffset).toBe(to)
  })
}

export const SelectedText: Story = {
  play: async ({ args, canvas, userEvent }) => {
    const editor = await canvas.findByRole('textbox', { name: 'Project details' })
    const text = editor.querySelector('p')!.firstChild!
    const from = text.textContent!.indexOf('Run npm test')
    await selectText(editor, text, from, text, from + 'Run npm test before saving.'.length)
    await userEvent.click(canvas.getByRole('button', { name: 'Code block' }))
    await waitFor(() => expect(editor.querySelector('pre')).toHaveTextContent(/^Run npm test before saving\.$/))
    await expect([...editor.querySelectorAll('p')].map((p) => p.textContent)).toEqual([
      'Keep this introduction. ', ' Keep this conclusion.',
    ])
    await userEvent.click(canvas.getByRole('button', { name: 'Undo' }))
    await expect(editor.querySelector('pre')).toBeNull()
    await expect(editor).toHaveTextContent(args.canvas.about)
    await userEvent.click(canvas.getByRole('button', { name: 'Redo' }))
    await expect(editor.querySelector('pre')).toHaveTextContent(/^Run npm test before saving\.$/)
    await userEvent.click(canvas.getByRole('button', { name: 'Save' }))
    await expect(args.onSave).toHaveBeenCalledWith('Keep this introduction. \n\n```\nRun npm test before saving.\n```\n\n Keep this conclusion.')
  },
}

export const SoftBreakSelection: Story = {
  args: { canvas: { ...storyCanvas, about: 'Introduction  \nconst answer = 42  \nconsole.log(answer)  \nConclusion' } },
  play: async ({ canvas, userEvent }) => {
    const editor = await canvas.findByRole('textbox', { name: 'Project details' })
    const nodes = editor.querySelector('p')!.childNodes
    await selectText(editor, nodes[2], 0, nodes[4], nodes[4].textContent!.length)
    await userEvent.click(canvas.getByRole('button', { name: 'Code block' }))
    await waitFor(() => expect(editor.querySelector('pre')?.textContent).toBe('const answer = 42\nconsole.log(answer)'))
    await expect([...editor.querySelectorAll('p')].map((p) => p.textContent)).toEqual(['Introduction', 'Conclusion'])
  },
}

export const MultipleParagraphs: Story = {
  args: { canvas: { ...storyCanvas, about: 'Keep **bold introduction**. first line\n\nsecond line. Keep *italic conclusion*.' } },
  play: async ({ canvas, userEvent }) => {
    const editor = await canvas.findByRole('textbox', { name: 'Project details' })
    const paragraphs = editor.querySelectorAll('p')
    const start = paragraphs[0].lastChild!
    const end = paragraphs[1].firstChild!
    await selectText(editor, start, start.textContent!.indexOf('first line'), end, 'second line.'.length)
    await userEvent.click(canvas.getByRole('button', { name: 'Code block' }))
    await waitFor(() => expect(editor.querySelector('pre')?.textContent).toBe('first line\nsecond line.'))
    await expect(editor.querySelector('strong')).toHaveTextContent('bold introduction')
    await expect(editor.querySelector('em')).toHaveTextContent('italic conclusion')
  },
}

export const CursorAndToggleOff: Story = {
  args: { canvas: { ...storyCanvas, about: 'First paragraph.\n\nCurrent paragraph.\n\nLast paragraph.' } },
  play: async ({ canvas, userEvent }) => {
    const editor = await canvas.findByRole('textbox', { name: 'Project details' })
    const text = editor.querySelectorAll('p')[1].firstChild!
    await selectText(editor, text, 3, text, 3)
    const button = canvas.getByRole('button', { name: 'Code block' })
    await userEvent.click(button)
    await waitFor(() => expect(editor.querySelector('pre')).toHaveTextContent(/^Current paragraph\.$/))
    await userEvent.click(button)
    await expect(editor.querySelector('pre')).toBeNull()
    await expect(editor.querySelectorAll('p')).toHaveLength(3)
  },
}
