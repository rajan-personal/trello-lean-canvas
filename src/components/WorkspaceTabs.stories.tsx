import { useId, useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn } from 'storybook/test'
import { WorkspaceTabs, type WorkspaceView } from './WorkspaceTabs'

const meta = {
  title: 'Lean Canvas/WorkspaceTabs', component: WorkspaceTabs,
  args: { view: 'canvas', onChange: fn(() => true) },
  render: function Stateful(args) {
    const [view, setView] = useState<WorkspaceView>(args.view)
    const id = useId()
    return <div className="bg-[#0b4a6f] p-3 text-white">
      <WorkspaceTabs {...args} idPrefix={id} view={view} onChange={(next) => {
        const allowed = args.onChange(next)
        if (allowed) setView(next)
        return allowed
      }} />
      {(['canvas', 'board'] as const).map((tab) => <div key={tab}
        id={`${id}-${tab}-panel`} role="tabpanel" aria-labelledby={`${id}-${tab}-tab`}
        tabIndex={0} hidden={tab !== view}>{tab === 'canvas' ? 'Canvas content' : 'Board content'}</div>)}
    </div>
  },
} satisfies Meta<typeof WorkspaceTabs>
export default meta
type Story = StoryObj<typeof meta>

export const KeyboardRouting: Story = {
  play: async ({ canvas, userEvent, args }) => {
    const first = canvas.getByRole('tab', { name: 'Canvas' })
    const second = canvas.getByRole('tab', { name: 'Board' })
    await userEvent.click(first)
    for (const key of ['{ArrowRight}', '{ArrowLeft}', '{End}', '{Home}']) {
      await userEvent.keyboard(key)
      const active = key === '{ArrowRight}' || key === '{End}' ? second : first
      await expect(active).toHaveFocus()
      await expect(active).toHaveAttribute('aria-selected', 'true')
      await expect(active).toHaveAttribute('tabindex', '0')
      const panel = canvas.getByRole('tabpanel')
      await expect(panel).toHaveAttribute('id', active.getAttribute('aria-controls'))
      await expect(panel).toHaveAccessibleName(active.textContent!)
    }
    await expect(args.onChange).toHaveBeenLastCalledWith('canvas')
    await userEvent.tab()
    await expect(canvas.getByRole('tabpanel')).toHaveFocus()
  },
}
export const RejectedNavigation: Story = {
  args: { onChange: fn(() => false) },
  play: async ({ canvas, userEvent, args }) => {
    await userEvent.click(canvas.getByRole('tab', { name: 'Board' }))
    await expect(args.onChange).toHaveBeenCalledWith('board')
    await expect(canvas.getByRole('tab', { name: 'Canvas' })).toHaveFocus()
    await expect(canvas.getByRole('tabpanel')).toHaveTextContent('Canvas content')
    await userEvent.keyboard('{End}')
    await expect(canvas.getByRole('tab', { name: 'Canvas' })).toHaveFocus()
    await expect(canvas.getByRole('tab', { name: 'Board' })).toHaveAttribute('tabindex', '-1')
  },
}
