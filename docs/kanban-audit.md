# Kanban component and Storybook audit

This audit starts from the [142-story Lean Canvas baseline](lean-canvas-audit.md). It reads every implementation, hook, stylesheet and story in `src/components/board`, plus the board command/schema/repository, workspace mounting and navigation-guard contracts. Changes are limited to board UI, board stories/support, matching browser tests and this report. Persistence, security, authentication, routing and global Storybook configuration are unchanged. No commit, push, PR, merge, deployment or live Firebase access was performed.

## Confirmed defects and fixes

| Finding and evidence | Fix and regression coverage |
| --- | --- |
| Closing either inline composer with Escape loses its Add trigger's keyboard focus. Both new browser regressions fail against the original implementations. | [useComposerFocus](../src/components/board/useComposerFocus.ts) restores the newly rendered trigger after save/cancel/Escape when focus was lost; it preserves outside focus and falls back to the board tab if the column disappeared. [KanbanBoard](../src/components/board/KanbanBoard.tsx) and [KanbanColumn](../src/components/board/KanbanColumn.tsx) share it. [Browser regressions](../tests/board-audit-regressions.spec.ts) verify Escape and successful-save continuation for both composers. |
| An open column rename remains writable after a subscription removes that column. The original browser regression finds no `readonly` attribute. | [KanbanBoard](../src/components/board/KanbanBoard.tsx) passes the missing-column state into [BoardTitleDialog](../src/components/board/BoardTitleDialog.tsx). The dialog retains the draft, announces the deletion, makes the title read-only and disables submission; rejected dismissal preserves the draft. Browser coverage verifies fallback focus after the original trigger disappears. |
| Scrolling a long column while its actions are open positions the popup at **y = -82px** in a 390×500 viewport. This reproduces with both native Popover and the fallback on the original code. | [BoardColumnMenu](../src/components/board/BoardColumnMenu.tsx) clamps the vertical position as well as the horizontal position. [Native/fallback regressions](../tests/board-menu-bounds.spec.ts) assert bounds, actionable visible content and Escape focus restoration after the header scrolls away. |
| Tab leaves the action panel open when pending disables every action. The new standalone play fails against the original navigation helper. Its boundary check also assumes the active action is still enabled. | [column-menu-navigation](../src/components/board/column-menu-navigation.ts) dismisses an all-disabled panel when Tab leaves its trigger, and derives panel exits from the remaining enabled controls' document order. [Standalone plays](../src/components/board/BoardColumnMenu.stories.tsx) cover disabled boundaries, trigger-relative navigation and action command/dismissal. Existing native/fallback browser Tab tests remain intact. |
| Title-dialog and comment form handlers do not consistently enforce their own disabled/blank contracts: direct form submission reaches `onSave` while pending or whitespace-only, and reaches `onAdd` while pending or blank. Parent command guards normally mask these callback inconsistencies. | [BoardTitleDialog](../src/components/board/BoardTitleDialog.tsx) checks pending, deletion and trimmed title in its submit handler. [BoardComments](../src/components/board/BoardComments.tsx) checks pending, read-only and trimmed comment. Their standalone plays submit the actual form and assert that callbacks are not invoked. |
| Most inherited Kanban stories are snapshots; multiple interactive paths report success without applying commands. The browser description fallback also stops forcing fixed field sizing after reload. | [Stateful board fixture](../src/components/board/useBoardStory.ts) applies the real mutation contract, exposes pending/failure, and supports cleaned-up local subscription events. Editor fixtures render saved results and close/reopen transitions. [Description browser coverage](../tests/board-description.spec.ts) installs fallback CSS on every navigation and asserts the computed mode before and after reload, plus width-driven growth/shrink. |

No card-front metadata, column selector, Move card section, footer deletion row or new feature was added. The compact, accessibly labeled Delete icon stays beside Close and retains confirmation. Existing six-column defaults, custom columns, inline creation, drag ordering and floating actions remain intact.

## Coverage and checked-correct behavior

The final index contains **174 stories in 54 files**, up from **142 in 43 files**. Kanban grows from **16 to 48 stories**. All previously unrepresented public board components now have standalone stories: column, inline composer, column actions, title dialog, comments and modal shell. The additional files separate meaningful interactions and recovery cases under the 100-line TS/TSX limit.

- [Board interactions](../src/components/board/KanbanBoardInteractions.stories.tsx) exercise creation from zero columns, custom rename/order/empty deletion, disabled pending controls and retained drafts after remote column deletion. Existing populated, empty, mobile and composer stories now use stateful commands and assert rendered outcomes.
- [Column stories](../src/components/board/KanbanColumn.stories.tsx) check count changes, creation and the open-card callback, title-only fronts, unbroken text wrapping and narrow-screen fit. [Drag plays](../src/components/board/BoardDrag.stories.tsx) assert self-drop rejection, before/after insertion, cross-column outcomes and exact stable-ID/index commands. [Real browser drag coverage](../tests/board-movement.spec.ts) now checks both halves of a card, movement and reload order with unchanged IDs.
- [Inline composer stories](../src/components/board/BoardInlineComposer.stories.tsx) verify card/column retry IDs, trimmed command values, visible saved results, whitespace rejection, pending/read-only controls and rejected/accepted dirty dismissal. Existing [browser composer tests](../tests/board-composers.spec.ts) retain the real storage-failure, navigation-guard and persisted-ID checks.
- [Details interactions](../src/components/board/BoardCardInteractions.stories.tsx) assert independent comment submission while title/description remain dirty, failed comment retry identity, author/timestamp command fields, actual appended comments, saved/reopened details, unsent-comment retention, Enter/IME/whitespace handling and confirmed deletion.
- [Recovery stories](../src/components/board/BoardCardRecovery.stories.tsx) verify failed saves, observed remote conflicts, a remote edit arriving while a save is pending, blocked Close while pending, and read-only remote-deleted cards. The fixture validates the dispatched expected baseline against its latest snapshot. Existing [browser recovery tests](../tests/board-recovery.spec.ts) independently verify delayed title/description notifications at the actual local repository boundary.
- [Layout plays](../src/components/board/BoardCardLayout.stories.tsx) verify expanding/shrinking plain descriptions, save/reopen, separate forms, scrolling and 320px stacking. Existing [layout browser tests](../tests/board-polish.spec.ts), [delete-header tests](../tests/board-delete-layout.spec.ts) and the corrected native/fallback description suite validate production CSS. Description, title, comments and all inherited visual variants retain their actual controlled values.
- [Dialog plays](../src/components/board/BoardDialog.stories.tsx) verify initial focus, explicit exit, inside-click retention and restoration. Native Escape and modal focus containment are checked by Chromium browser tests; synthetic `cancel` events and IME flags are not presented as native browser-default or manual IME testing.

Portalled column actions are queried from the owning document body. Native dialogs are queried from their actual rendered root. Confirmation spies use `finally`, subscription listeners are removed on unmount, and delayed promises are settled. Asynchronous drag/save completion uses the existing awaited React interaction helper, without console filtering or warning suppression. Fixture-only contrast and metadata-indexing errors found during development were corrected in the fixtures. No global configuration, accessibility exclusion, skipped story or weakened assertion was introduced.

## Validation

Environment setup used `npm ci`, Playwright's Chromium/browser-library installers and a temporary Temurin Java 21 runtime for the Firestore emulator. Initial missing-browser errors were setup failures; all behavior counts below come from installed-browser runs.

| Check | Result |
| --- | --- |
| Full Storybook interaction/accessibility suite | **174/174 passed in 54 files**; no skips or React `act` warnings |
| Affected Storybook command | **51/51 passed in 14 files** (48 Kanban stories plus 3 matching shared BoardTitle stories); final async recovery/drag follow-up **6/6 passed** without warnings |
| All default Chromium browser tests | **66/66 passed**, including **33 board tests** |
| Local deterministic remote-canvas-deletion browser suite | **2/2 passed**; **68/68 Chromium tests total** across both configurations |
| `npm run build-storybook` | Passed; **174 indexed stories / all 54 source files**, none missing |
| `npm test` | **34/34 passed in 9 files** |
| `npm run typecheck` | Passed |
| `npm run lint` | Passed without warnings, including the 100-line policy |
| `npm run build` | Passed; production PWA generated with 17 precache entries |
| Repository local Firestore-emulator script | **18/18 passed in 6 files** on the unchanged isolated rerun; initial concurrent run **16/18 passed** |
| `git diff --check` | Passed |
| React Doctor changed-file check | Written-permission restriction; not accepted as a licensed validation |

Commands:

```bash
npm run test:storybook -- src/components/board
npm run test:storybook
npx playwright test --workers=2
npx playwright test --config playwright.remote.config.ts --workers=2
npm run build-storybook
npm test
npm run typecheck
npm run lint
npm run build
```

The unchanged emulator script does not pass a project override and the repository's `.firebaserc` names its normal Firebase project. To ensure demo-only execution without changing either file, a temporary `npx` wrapper appended `--project demo-kanban-audit` to the script's Firebase invocation:

```sh
#!/bin/sh
exec /usr/local/bin/npx "$@" --project demo-kanban-audit
```

It was invoked as `PATH="/tmp/kanban-emulator-bin:$PATH" npm run test:firestore`; that temporary directory also exposes the downloaded Java runtime. Firebase explicitly reported the demo project and disabled access to non-emulated services. All test data came from the repository's local emulator fixtures. The first run overlapped browser/build work: `emulator/board-recovery.test.ts:43` exceeded its existing 5000ms timeout, and the following failure-injection assertion at line 73 resolved instead of rejecting. The isolated rerun passed all 18 tests in 13.03 seconds, including all three recovery tests. No emulator test, timeout, persistence code or rule was edited to make that run pass. The initial failures did not reproduce in isolation; concurrent-load timing is the likely explanation, not a proven diagnosis.

Production and Storybook builds retain advisory bundle-size warnings. The Storybook output contains no service worker, Workbox bundle or web manifest. The production build retains its PWA output.

## Residuals and boundaries

- **Column rename conflict contract:** [BoardCommand](../src/data/board-mutations.ts) gives `rename-column` only an ID and title; unlike `edit-card`, it has no expected editor baseline. [KanbanBoard](../src/components/board/KanbanBoard.tsx) keeps the original rename title while the dialog is open. Thus a stale rename can replace a newer title already present before dispatch. The Firestore transaction's snapshot revision check does not compare that old dialog title. Atomic stale-rename protection requires a data/repository contract change outside this audit's authorized scope. Card title/description/movement conflict safeguards are preserved and tested.
- **React Doctor permission:** `npx --yes react-doctor@latest . --scope changed --base HEAD` emitted the AI/ML written-permission restriction. The CLI continued automatically and printed an eight-file result/score before exiting; no permission was accepted, detection bypassed or alternate version used. That output is not treated as an authorized licensed scan, and no completed licensed check is claimed.
- Tests use Chromium, automated axe checks, synthetic users and local deterministic/emulator data. They do not establish other-browser, manual screen-reader, real IME or live Firebase/auth behavior.
