import { storySections } from './component-story-fixtures'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fireEvent, within } from 'storybook/test'
import { CanvasExperience } from './CanvasExperience.story-support'

const meta = {
  title: 'Lean Canvas/Experience', component: CanvasExperience,
  parameters: { layout: 'fullscreen', docs: { story: { inline: false } } },
} satisfies Meta<typeof CanvasExperience>
export default meta
type Story = StoryObj<typeof meta>

export const HeaderEditingAndCreation: Story = {
  play: async ({ canvas, userEvent }) => {
    const heading = await canvas.findByRole('heading', { name: 'Team alignment' })
    await userEvent.click(within(heading).getByRole('button'))
    const rename = canvas.getByRole('textbox', { name: 'Rename canvas' })
    fireEvent.change(rename, { target: { value: '  Research plan  ' } })
    await userEvent.keyboard('{Enter}')
    const renamed = canvas.getByRole('heading', { name: 'Research plan' })
    await expect(within(renamed).getByRole('button')).toHaveFocus()
    const item = within(canvas.getByRole('navigation')).getByRole('button', { name: 'Research plan' })
    await expect(item).toBeVisible()
    await userEvent.keyboard('{Enter}')
    fireEvent.change(canvas.getByRole('textbox', { name: 'Rename canvas' }), { target: { value: 'Discarded title' } })
    await userEvent.keyboard('{Escape}')
    await expect(renamed).toHaveTextContent('Research plan')
    await userEvent.click(canvas.getByRole('button', { name: 'Favorite canvas' }))
    await expect(item.querySelector('.canvas-nav-favorite')).toBeVisible()
    await userEvent.click(canvas.getByRole('button', { name: 'Add canvas' }))
    await userEvent.click(canvas.getByRole('button', { name: 'New' }))
    const input = canvas.getByRole('textbox', { name: 'Canvas name' })
    fireEvent.change(input, { target: { value: '  ' } })
    await userEvent.click(canvas.getByRole('button', { name: 'Create canvas' }))
    await expect(canvas.getByRole('dialog')).toBeVisible()
    fireEvent.change(input, { target: { value: '  New research  ' } })
    await userEvent.click(canvas.getByRole('button', { name: 'Create canvas' }))
    await expect(canvas.getByRole('heading', { name: 'New research' })).toBeVisible()
    await expect(canvas.queryByRole('dialog')).not.toBeInTheDocument()
    await expect(canvas.getAllByRole('button', { name: '＋ Add a card' })).toHaveLength(12)
  },
}

export const UploadFailureAndRetry: Story = {
  play: async ({ canvas, userEvent }) => {
    await canvas.findByRole('heading', { name: 'Team alignment' })
    const input = canvas.getByLabelText('Upload canvas YAML file')
    await userEvent.upload(input, new File(['canvas: ['], 'invalid.yaml', { type: 'application/yaml' }))
    await expect(await canvas.findByText(/unexpected end/)).toBeVisible()
    await expect(canvas.getByRole('heading', { name: 'Team alignment' })).toBeVisible()
    await expect(input).toHaveValue('')
    await userEvent.upload(input, new File([JSON.stringify({ canvas: { name: 'Uploaded research', title: 'Uploaded research', sections: storySections } })], 'retry.yaml', { type: 'application/yaml' }))
    await expect(await canvas.findByRole('heading', { name: 'Uploaded research' })).toBeVisible()
    await expect(within(canvas.getByRole('navigation')).getByRole('button', { name: 'Uploaded research' })).toBeVisible()
    await expect(input).toHaveValue('')
  },
}
