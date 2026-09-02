import { useState, type ComponentProps } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fireEvent, fn, waitFor } from 'storybook/test'
import { NotepadPanel } from './NotepadPanel'
import { storyCanvas } from './component-story-fixtures'

type Props = ComponentProps<typeof NotepadPanel>

function NotepadHarness(args: Props) {
  const [canvas, setCanvas] = useState(args.canvas)
  return (
    <NotepadPanel
      {...args}
      canvas={canvas}
      onChange={(notes) => {
        args.onChange(notes)
        setCanvas((current) => ({ ...current, notes }))
      }}
    />
  )
}

const meta = {
  title: 'Lean Canvas/NotepadPanel',
  component: NotepadPanel,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
  decorators: [
    (Story) => (
      <div className="flex h-dvh min-h-[640px] justify-end bg-[#0c66e4]">
        <Story />
      </div>
    ),
  ],
  args: { canvas: storyCanvas, open: true, onChange: fn() },
  render: (args) => <NotepadHarness key={args.canvas.id} {...args} />,
} satisfies Meta<typeof NotepadPanel>

export default meta
type Story = StoryObj<typeof meta>

export const Open: Story = {
  play: async ({ args, canvas, userEvent }) => {
    const panel = canvas.getByRole('complementary', { name: 'Notepad' })
    const notes = canvas.getByRole('textbox', { name: 'Canvas notes' })
    await expect(panel).toHaveStyle({ backgroundColor: 'rgb(12, 102, 228)' })
    await waitFor(() => expect(notes).toHaveFocus())
    await expect(notes).toHaveStyle({
      borderWidth: '2px',
      borderColor: 'rgb(12, 102, 228)',
    })
    await userEvent.clear(notes)
    await userEvent.type(notes, 'A concise research note')
    await expect(args.onChange).toHaveBeenLastCalledWith(
      'A concise research note',
    )
  },
}

export const KeyboardResized: Story = {
  play: async ({ canvas }) => {
    const separator = canvas.getByRole('separator', { name: 'Resize notepad' })
    separator.focus()
    fireEvent.keyDown(separator, { key: 'End' })
    await waitFor(() =>
      expect(separator).toHaveAttribute('aria-valuenow', '640'),
    )
    fireEvent.keyDown(separator, { key: 'ArrowRight' })
    await waitFor(() =>
      expect(separator).toHaveAttribute('aria-valuenow', '620'),
    )
  },
}

export const Closed: Story = {
  args: { open: false },
  play: async ({ canvasElement }) => {
    await expect(canvasElement.querySelector('#canvas-notepad')).toHaveAttribute(
      'aria-hidden',
      'true',
    )
  },
}

export const Mobile: Story = {
  globals: { viewport: { value: 'mobile1', isRotated: false } },
}
