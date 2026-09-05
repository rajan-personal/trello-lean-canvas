import { expect, test } from '@playwright/test'
import { canvas } from '../../unit/fixtures'
import { populatedBoard } from '../../unit/board-fixtures'

const transport = `
export const prepareWorkspace = async () => ({ consumedLocal: false });
export function subscribeToWorkspace(uid, value, error) {
  const publish = () => {
    const remote = JSON.parse(localStorage.getItem('test-remote-workspace'));
    if (!remote.canvases.some(c => c.id === 'a')) error(new Error('Canvas a is missing from the workspace.'));
    value(remote);
  };
  publish(); window.addEventListener('storage', publish);
  return () => window.removeEventListener('storage', publish);
}
export async function saveWorkspaceDiff(uid, previous, next) {
  const value = { canvases: next, revisions: Object.fromEntries(next.map(c => [c.id, (previous.revisions[c.id] || 0) + 1])),
    orderRevision: previous.orderRevision + 1 };
  localStorage.setItem('test-remote-workspace', JSON.stringify(value));
  return value;
}`
for (const remaining of [true, false]) test(`remote deletion retains read-only description/comment drafts (${remaining ? 'other canvas' : 'last canvas'})`, async ({ context }) => {
  // Both owner sessions share a deterministic transport; real Firestore deletion/rules run in emulator tests.
  await context.route(/\/src\/data\/firestore\.ts$/, (route) => route.fulfill({ contentType: 'text/javascript', body: transport }))
  await context.route(/\/src\/data\/board-repository\.ts$/, (route) => route.fulfill({ contentType: 'text/javascript', body: `
    import { createBoardRepository as actual } from '/src/data/board-repository.ts?actual';
    export const createBoardRepository = uid => actual(uid, 'local');` }))
  const first = await context.newPage()
  await first.goto('/')
  await first.evaluate(({ canvases, board }) => {
    localStorage.clear()
    localStorage.setItem('test-remote-workspace', JSON.stringify({ canvases,
      revisions: Object.fromEntries(canvases.map(c => [c.id, 1])), orderRevision: 1 }))
    localStorage.setItem('lean-canvas:boards:v1', JSON.stringify({ a: board }))
  }, { canvases: remaining ? [canvas('a'), { ...canvas('b'), name: 'Other', title: 'Other' }] : [canvas('a')], board: populatedBoard() })
  await first.goto('/tests/support/remote-workspace.html')
  await first.getByRole('tab', { name: 'Board', exact: true }).click()
  await first.locator('.kanban-card').first().click()
  const modal = first.getByRole('dialog')
  await modal.getByLabel('Description').fill('Unsaved description to copy')
  await modal.getByLabel('New comment').fill('Unsaved comment to copy')
  const second = await context.newPage()
  await second.goto('/tests/support/remote-workspace.html')
  await expect(second.getByRole('heading', { name: 'Test canvas', exact: true })).toBeVisible()
  second.once('dialog', dialog => dialog.accept())
  await second.getByRole('button', { name: 'Delete canvas', exact: true }).click()
  await expect(modal.getByRole('alert')).toContainText('canvas was deleted elsewhere')
  await expect(modal.getByLabel('Description')).toHaveValue('Unsaved description to copy')
  await expect(modal.getByLabel('New comment')).toHaveValue('Unsaved comment to copy')
  await expect(modal.getByLabel('Description')).toHaveAttribute('readonly', '')
  await expect(modal.getByRole('button', { name: 'Save', exact: true })).toBeDisabled()
  await expect(modal.getByRole('button', { name: 'Add comment', exact: true })).toBeDisabled()
  first.once('dialog', dialog => dialog.dismiss())
  await modal.getByRole('button', { name: 'Close dialog' }).click()
  await expect(modal).toBeVisible()
  first.once('dialog', dialog => dialog.accept())
  await modal.getByRole('button', { name: 'Close dialog' }).click()
  await first.getByRole('button', { name: 'Close deleted canvas' }).click()
  await expect(first.getByRole('button', { name: 'Close deleted canvas' })).toHaveCount(0)
  const saved = await second.evaluate(() => JSON.parse(localStorage.getItem('test-remote-workspace')!))
  expect(saved.canvases.map((c: { id: string }) => c.id)).toEqual(remaining ? ['b'] : [])
  expect(await second.evaluate(() => JSON.parse(localStorage.getItem('lean-canvas:boards:v1')!).a)).toBeUndefined()
})
