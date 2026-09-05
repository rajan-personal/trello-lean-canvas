# Storybook and screen reliability audit

This finishes the restored audit patch. Authentication, reconciliation, and persistence implementations are unchanged. Fixtures use synthetic users, local storage, and deterministic transports; no real sign-in or production data was used. No commit, push, deployment, or PR was made.

## Fixes and validation boundaries

- **PWA build isolation:** the previous builder inherited the production Vite PWA plugin, which attempted to precache a reported 3.29 MB Storybook manager asset against Workbox's 2 MiB limit. [Storybook configuration](../.storybook/main.ts) selects [an isolated Vite config](../.storybook/vite.config.ts); the production [PWA config](../vite.config.ts) is untouched. Tailwind runs through `viteFinal`, shared by the builder and test addon. Both builds pass; production still generates `sw.js` and a 17-entry precache (943.96 KiB). Storybook emits no service worker, Workbox bundle, or web manifest. No asset limit was raised.
- **Real interaction runner:** [vitest.storybook.config.ts](../vitest.storybook.config.ts) uses the Storybook 10 addon with Vitest 3's Playwright browser provider and full `defineConfig` typing. Sharing Tailwind through Storybook avoids mixing the root Vite 8 plugin types with Vitest 3's Vite 7 config types. Only the required `@storybook/addon-vitest` and `@vitest/browser` dependencies and their dependency graph were added; unrelated lockfile platform metadata was retained.
- **Viewport and accessibility:** [preview.tsx](../.storybook/preview.tsx) registers `MINIMAL_VIEWPORTS`, keeps `a11y.test: 'error'`, and removes global axe rule exclusions. Mobile screen/feedback plays assert `window.innerWidth === 320`. The installed addon automatically loads project/addon annotations, runs plays, applies `page.viewport`, and executes accessibility checks. See the official [Vitest addon](https://storybook.js.org/docs/writing-tests/integrations/vitest-addon/index) and [accessibility testing](https://storybook.js.org/docs/writing-tests/accessibility-testing) documentation. Existing per-story exclusions in two other tickets' stories remain disclosed below.
- **Tab routing:** [WorkspaceTabs](../src/components/WorkspaceTabs.tsx) uses local button refs for focus and unique default IDs. Rejected navigation restores the selected tab's focus. The screen supplies its existing panel IDs; [WorkspaceViewPanel](../src/app/WorkspaceViewPanel.tsx) makes the active panel keyboard-focusable. Standalone plays check selection, roving tab stops, Arrow/Home/End keys, panel relationships, and rejected changes. Workspace plays check routing and isolated board contents when switching canvases.
- **Auth and pending controls:** [App](../src/app/App.tsx) now presents authenticated session errors and preserves sign-out promises through the workspace. [usePendingAction](../src/components/usePendingAction.ts) locks duplicate invocation, resets pending state, catches synchronous throws and asynchronous rejections, and avoids state updates after unmount. Account and loading-error controls display retryable failures. Plays check disabled controls, callback counts, rejection/retry, late rejection after unmount, successful sign-out to LoginScreen, and failure retaining the workspace. The real AuthProvider already catches sign-out errors; its behavior was only read.
- **Feedback:** LoginScreen announces connecting state; AccountButton exposes truncated synthetic account fields through titles and handles missing fields. Toast keeps a persistent atomic status region and wraps long messages; SyncError also wraps within the viewport. [useNotice](../src/app/useNotice.ts) cancels previous timeouts and cleans up on unmount, so an earlier notice cannot erase a newer one. Plays verify the full replacement duration, timer cancellation, and long mobile feedback bounds.
- **Fixture fidelity and cleanup:** screen fixtures seed both canvases and boards after mount, cancel obsolete async seed completion, and use stateful callback outcomes. Preview hooks snapshot/clear/restore only `lean-canvas:*` storage. Storage-backed screen docs render in separate iframes. Remote-deletion fixture listeners and confirmation/timeout spies have cleanup; no real auth or remote repository is needed. Board save/retry, login retry, sign-out, and deleted-canvas dismissal assert visible transitions as well as callback contracts.

## Validation commands

Environment setup: `npm ci`, `npx playwright install chromium`, and `npx playwright install-deps chromium` succeeded. Initial browser launch attempts failed on missing Chromium and then `libnspr4.so`; those were environment failures, not interaction results. Validation below was rerun after setup.

The command for later tickets is **`npm run test:storybook`**. Neither rendering a story nor `build-storybook` is a substitute. To run just this scope:

```bash
npm run test:storybook -- src/app src/auth/LoginScreen.stories.tsx \
  src/components/AccountButton src/components/AppStatus \
  src/components/SyncError.stories.tsx src/components/Toast \
  src/components/FeedbackInteractions.stories.tsx \
  src/components/WorkspaceTabs.stories.tsx
```

Result: **44/44 tests in 17 story files passed**, including plays and configured accessibility checks.

Final full run, `npm run test:storybook`: **129/130 tests passed across 38 files** (37 files passed, one failed). The only failure is `Lean Canvas/NotepadPanel → Mobile`, detailed below. Comparing the built `storybook-static/index.json` against all `src/**/*.stories.{ts,tsx}` files found **130 indexed stories, all 38 source files, zero missing files, and no skipped tests**. This final run includes the added long-mobile-toast case; an earlier full run was 128/129 before that case was added.

Screen/browser checks:

```bash
npx playwright test tests/workspace-layout.spec.ts tests/workspace-header.spec.ts \
  tests/canvas-lifecycle.spec.ts tests/board-polish.spec.ts \
  tests/board-polish-keyboard.spec.ts tests/notepad.spec.ts --workers=2
npx playwright test tests/board-recovery.spec.ts tests/board-persistence.spec.ts --workers=2
npx playwright test --config playwright.remote.config.ts --workers=2
```

Results: **17/17 + 5/5 screen/browser tests passed; 2/2 remote-deletion tests passed**. These cover responsive layout, collapsed panels, keyboard focus, canvas creation/import/export, persisted notes, board save/recovery, delayed remote updates, and read-only description/comment drafts after another session deletes either one of several canvases or the last canvas. The remote suite uses local deterministic transport, not live Firestore.

| Check | Result |
| --- | --- |
| `npm run test:storybook` | 129 passed, 1 known ticket 2 failure; no skips |
| Affected Storybook command above | 44/44 passed |
| `npm run typecheck` | Passed, including Storybook and Vitest configs |
| `npm run lint` | Passed, including the 100-line TS/TSX policy |
| `npm test` | 34/34 unit tests passed |
| `npm run build` | Passed; production PWA generated |
| `npm run build-storybook` | Passed; no PWA precaching |
| `git diff --check` | Passed |
| `npx --yes react-doctor@latest . --diff HEAD` | Blocked by AI/ML written-permission notice; cancelled, no completed scan claimed |

React Doctor's notice was honored without changing detection, installing a bypass version, or accepting license permission on the user's behalf. Its [published changelog](https://www.react.doctor/docs/community/changelog) describes this restriction and notice. The CLI also reports `--diff` deprecated in favor of `--scope changed --base HEAD`; this does not remove the permission limitation.

## Remaining cross-scope findings

1. **Ticket 2 — mobile Notepad story query fails.** [NotepadPanel.stories.tsx:94](../src/components/NotepadPanel.stories.tsx#L94) uses `getByRole('separator', { name: 'Resize notepad' })` before asserting invisibility. [NotepadPanel.tsx:58](../src/components/NotepadPanel.tsx#L58) intentionally hides that separator at widths ≤900px, so the accessible-role query throws. Keep the mobile hiding assertion; the owning ticket should query the DOM element in a way that can find hidden content and assert both presence and invisibility. No story was skipped or weakened here.
2. **Ticket 2 — hidden sidebar controls remain focusable.** [Sidebar.tsx:44](../src/components/Sidebar.tsx#L44) hides with translation or zero width, without `inert`/accessibility hiding. A Chromium probe at 320×700 measured its closed right edge at −4.96px, yet the account sign-out button accepted focus. At 1280×800 the collapsed sidebar measured 0px wide and its sign-out button still accepted focus. The owning ticket should synchronize focusability with responsive visibility and restore focus when closing.
3. **Ticket 2 — mobile Notepad covers Canvas/Board tabs.** At 320×700, after waiting for the opening animation to settle, the Notepad occupies y=48…700 ([NotepadPanel.tsx:49](../src/components/NotepadPanel.tsx#L49)), while tabs occupy y=48…92 ([WorkspaceTabs](../src/components/WorkspaceTabs.tsx)). `document.elementFromPoint` at the Board tab center returns the notes textarea. Coordinate the Notepad's mobile offset with the two-row screen header in ticket 2; changing tab semantics would not fix the panel overlap.
4. **Canvas editing owner — drafts cross canvas boundaries.** [useCardEditing.ts:62](../src/app/useCardEditing.ts#L62) clears editor visibility but retains the single shared `cardDraft`; [useCanvasCommands.ts:63](../src/app/useCanvasCommands.ts#L63) uses that reset when switching canvases. A local screen probe typed `Draft from first canvas`, switched to a second canvas, reopened its Problem composer, and found the first canvas's text. This is separate from the board-draft navigation guard, whose rejection/acceptance plays pass. Resolve draft ownership in the editing ticket rather than rewriting its hook here.
5. **Existing accessibility and test hygiene limits.** The Dragged stories in [CanvasCardSlot.stories.tsx:49](../src/components/CanvasCardSlot.stories.tsx#L49) and [SidebarCanvasItem.stories.tsx:54](../src/components/SidebarCanvasItem.stories.tsx#L54) still exclude contrast and landmark rules. They were not added by this patch and need their owners' review. The full run also logs an unawaited React `act` warning from CardComposer's CancelWithEscape story. Passing configured axe checks is not a manual assistive-technology audit.

Storybook's large-chunk warning remains informational; its manager assets no longer enter the production precache. The known Notepad failure and React Doctor permission restriction remain explicit blockers to claiming every requested check is green.
