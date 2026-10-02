import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect } from 'storybook/test'
import topBarMeta from './TopBar.stories'
import { TopBarHarness } from './TopBar.story-support'

const meta = {
  title: 'Lean Canvas/TopBarSwitcher', component: TopBarHarness,
  parameters: { layout: 'fullscreen' }, decorators: topBarMeta.decorators,
  args: { ...topBarMeta.args, initialView: 'canvas' },
} satisfies Meta<typeof TopBarHarness>
export default meta
type Story = StoryObj<typeof meta>

export const DesktopCanvas: Story = {
  play: async ({ args, canvas, userEvent }) => {
    const tabs = canvas.getByRole('tablist')
    const mobile = window.innerWidth <= 760
    const action = canvas.getByRole('button', { name: mobile ? 'More actions' : 'Favorite canvas' })
    const selected = canvas.getAllByRole('tab').find((tab) => tab.getAttribute('aria-selected') === 'true')!
    await expect(selected).toHaveAccessibleName(args.initialView === 'board' ? 'Tickets' : 'Canvas')
    const bounds = tabs.getBoundingClientRect()
    const star = action.getBoundingClientRect()
    await expect(mobile ? tabs.parentElement?.lastElementChild?.firstElementChild : tabs.nextElementSibling?.firstElementChild).toBe(action)
    await expect(star.left - bounds.right).toBeGreaterThanOrEqual(0)
    await expect(star.left - bounds.right).toBeLessThanOrEqual(8)
    await expect(star.top + star.height / 2).toBe(bounds.top + bounds.height / 2)
    await userEvent.click(selected)
    await userEvent.tab()
    await expect(action).toHaveFocus()
    for (const pressed of ['true', 'false']) {
      if (mobile) await userEvent.click(action)
      const favorite = canvas.getByRole('button', { name: 'Favorite canvas' })
      if (mobile) await userEvent.click(favorite)
      else await userEvent.keyboard(' ')
      if (mobile) await userEvent.click(action)
      await expect(canvas.getByRole('button', { name: 'Favorite canvas' })).toHaveAttribute('aria-pressed', pressed)
      if (mobile) await userEvent.click(action)
    }
    action.focus()
    await userEvent.tab({ shift: true })
    await expect(selected).toHaveFocus()
    for (const key of ['{End}', '{ArrowRight}', '{ArrowLeft}', '{Home}']) {
      await userEvent.keyboard(key)
      const label = key === '{End}' || key === '{ArrowLeft}' ? 'About' : 'Tickets'
      await expect(canvas.getByRole('tab', { name: label })).toHaveFocus()
      await expect(canvas.getByRole('tabpanel')).toHaveAccessibleName(label)
    }
    await userEvent.click(selected)
    await expect(selected).toHaveAttribute('aria-selected', 'true')
  },
}
export const DesktopBoard: Story = { ...DesktopCanvas, args: { initialView: 'board' } }
export const MobileCanvas: Story = {
  ...DesktopCanvas,
  args: { canvas: { ...topBarMeta.args.canvas, name: 'Long canvas title', title: 'Customer research and launch planning across teams' } },
  globals: { viewport: { value: 'mobile1', isRotated: false } },
}
export const MobileBoard: Story = { ...MobileCanvas, args: { ...MobileCanvas.args, initialView: 'board' } }
