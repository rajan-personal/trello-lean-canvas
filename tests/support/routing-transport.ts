import type { BrowserContext } from '@playwright/test'
import { canvas } from '../../unit/fixtures'
import { populatedBoard } from '../../unit/board-fixtures'

export async function routingTransport(context: BrowserContext, flags: string[] = []) {
  await context.route(/https:\/\/[^/]*(googleapis|firebaseio)\.com\//, (route) => route.abort())
  await context.addInitScript(({ canvases, board, flags }) => {
    if (localStorage.getItem('test:seeded')) return
    localStorage.clear()
    localStorage.setItem('test:seeded', 'true')
    localStorage.setItem('test:workspace', JSON.stringify({ canvases, revisions: { a: 1, b: 1 }, orderRevision: 1 }))
    localStorage.setItem('lean-canvas:boards:v1', JSON.stringify({ a: board }))
    flags.forEach((flag) => localStorage.setItem(`test:${flag}`, 'true'))
  }, { canvases: [canvas('a'), { ...canvas('b'), name: 'Other', title: 'Other' }], board: populatedBoard(), flags })
  await context.route(/\/src\/auth\/AuthProvider\.tsx$/, async (route) => {
    const source = await (await route.fetch()).text()
    const reactPath = source.match(/\/node_modules\/\.vite\/deps\/react\.js[^"']*/)?.[0]
    if (!reactPath) throw new Error('Vite React import not found')
    await route.fulfill({ contentType: 'text/javascript', body: `
    import React from '${reactPath}';
    const { createElement, useState } = React;
    import { AuthContext } from '/src/auth/auth-context.ts';
    const user = { uid: 'routing-user', displayName: 'Route User', email: 'route@example.test', photoURL: null };
    export function AuthProvider({ children }) {
      const [signedIn, setSignedIn] = useState(!localStorage.getItem('test:logged-out'));
      return createElement(AuthContext.Provider, { value: { user: signedIn ? user : null, loading: false,
        busy: false, error: null, signIn: async () => { localStorage.removeItem('test:logged-out'); setSignedIn(true) },
        signOut: async () => { localStorage.setItem('test:logged-out', 'true'); setSignedIn(false) } } }, children);
    }` })
  })
  await context.route(/\/src\/data\/firestore\.ts$/, (route) => route.fulfill({ contentType: 'text/javascript', body: `
    export const prepareWorkspace = async () => ({ consumedLocal: false });
    export function subscribeToWorkspace(uid, value, error) {
      localStorage.setItem('test:subscribed', 'true');
      const publish = () => value(JSON.parse(localStorage.getItem('test:workspace')));
      const fail = () => error(new Error('Test access denied'));
      if (!localStorage.getItem('test:hold-canvases')) publish();
      window.addEventListener('test:canvases', publish);
      window.addEventListener('test:access-error', fail);
      return () => { window.removeEventListener('test:canvases', publish); window.removeEventListener('test:access-error', fail) };
    }
    export async function saveWorkspaceDiff(uid, previous, next) {
      localStorage.setItem('test:save-started', 'true');
      if (localStorage.getItem('test:hold-save')) await new Promise(resolve => window.addEventListener('test:finish-save', resolve, { once: true }));
      const value = { canvases: next, revisions: Object.fromEntries(next.map(c => [c.id, (previous.revisions[c.id] || 0) + 1])), orderRevision: previous.orderRevision + 1 };
      localStorage.setItem('test:workspace', JSON.stringify(value)); return value;
    }` }))
  await context.route(/\/src\/data\/board-repository\.ts$/, (route) => route.fulfill({ contentType: 'text/javascript', body: `
    import { createBoardRepository as actual } from '/src/data/board-repository.ts?actual';
    export function createBoardRepository(uid) {
      const repository = actual(uid, 'local');
      return { ...repository, load: async (id) => {
        if (localStorage.getItem('test:hold-board')) await new Promise(resolve => window.addEventListener('test:board', resolve, { once: true }));
        return repository.load(id);
      }, dispatch: async (id, command) => {
        if (localStorage.getItem('test:hold-board-save')) await new Promise(resolve => window.addEventListener('test:finish-board-save', resolve, { once: true }));
        return repository.dispatch(id, command);
      } };
    }` }))
}
