# Lean Canvas component and story audit

This is the ticket 2 resolution of [the ticket 1 handoff](storybook-audit.md). Work is limited to Lean Canvas UI, its editing state, stories, fixtures, and browser regressions. Workspace routing, authentication, persistence, Kanban implementations, and global Storybook configuration are unchanged. No production access, commit, push, PR, merge, or deployment was performed.

## Confirmed defects and fixes

| Finding and reproduction | Resolution and regression evidence |
| --- | --- |
| Mobile Notepad's accessible-role query throws because responsive CSS hides the separator. Reproduced with the verified Storybook runner. | [NotepadPanel stories](../src/components/NotepadPanel.stories.tsx) use the element's label to assert that it exists **and** is invisible. The component's intended mobile separator behavior is retained. |
| Closed mobile and collapsed desktop sidebars accept programmatic focus on Sign out, despite being offscreen/zero-width. Both browser baselines failed. | [Sidebar](../src/components/Sidebar.tsx) and its [visibility hook](../src/components/useSidebarVisibility.ts) derive `inert` and accessibility visibility from the same 760px breakpoint as CSS. Mobile opening focuses the close action; Escape closes; closing/resizing restores the visible header trigger when focus was inside. [Panel regressions](../tests/canvas-panels-regressions.spec.ts) cover 320px, 1280px, and crossing the breakpoint. |
| Mobile Notepad starts at y=48 and intercepts clicks on the Board tab at y=48–92. A real click timed out on the baseline. | The [scoped CSS rule](../src/styles.css) offsets Notepad to 92px only inside a workspace with the mobile tab row. Standalone Notepad stays at 48px; tablet/desktop layout is unchanged. Browser hit-testing and actual Canvas/Board clicks pass with notes open. |
| A first-canvas composer draft appears in a second canvas, also after creating another canvas. | [useCardEditing](../src/app/useCardEditing.ts) resets editing UI when the active canvas ID changes, before rendering a different owner's editor. Same-canvas dismissal and reselect retain the draft. [Editing regressions](../tests/canvas-editing-regressions.spec.ts) and [Experience plays](../src/components/CanvasExperience.stories.tsx) verify rendered cards and draft ownership. No navigation guard or persistence code changed. |
| Inline edit save/Escape, composer save/Escape, and header rename Enter/Escape leave focus on the document body. Separate browser baselines reproduced each case. | [CanvasCardSlot](../src/components/CanvasCardSlot.tsx) restores its card, [CanvasSection](../src/components/CanvasSection.tsx) restores its Add action, and [BoardTitle](../src/components/BoardTitle.tsx) restores its title button. Card/section restoration checks that focus was lost before moving it, preserving outside-click targets. Browser regressions exercise keyboard continuation. |
| Unbroken card text overflows its 194px mobile button to 3550px and gets clipped by the column. | [CanvasCard](../src/components/CanvasCard.tsx) wraps unbroken text. The [long-mobile board play](../src/components/CanvasBoardInteractions.stories.tsx) checks every card's scroll/client width and actual horizontal scrolling; browser coverage also creates a multiline bottom-panel card. |
| Clicking the create dialog's own padding is mistaken for backdrop dismissal and loses the draft. | [Dialog](../src/components/Dialog.tsx) checks pointer coordinates against its bounds. [Header browser tests](../tests/canvas-header-regressions.spec.ts) verify inside padding, real outside dismissal, native Escape, blank rejection, and an empty reopened dialog. The inherited backdrop play now supplies actual outside coordinates. |
| Both Dragged stories suppress real contrast failures: card text 2.65:1 and sidebar text 2.57:1, against the required 4.5:1. Removing the exclusions reproduced these failures; no landmark failure occurred. | Dragged card opacity increases to 0.8 in [CanvasCardSlot](../src/components/CanvasCardSlot.tsx). A selected-sidebar variant still failed at 3.56:1 with opacity 0.8, so [SidebarCanvasItem](../src/components/SidebarCanvasItem.tsx) uses an inset dashed outline while retaining full text contrast. Both selected and unselected dragged stories are checked. All four exclusions per story are removed. The drag shift/opacity assertions remain and accessibility checks pass. Sidebar selection also exposes its existing active state through `aria-current`. |
| Two Add menus share `canvas-add-menu`; clicking the second opens the first. Reproduced by the new two-instance story before the fix. | [CanvasAddMenu](../src/components/CanvasAddMenu.tsx) uses `useId` for the target/control relationship. The [interaction play](../src/components/CanvasAddMenuInteractions.stories.tsx) verifies the correct instance, bounded top-layer popup, keyboard order, dismissal, and the originating command result. Native Escape/outside dismissal are additionally checked in Chromium. |
| Composer submit accepts whitespace through the button, while Enter rejects it; inline Ctrl/Meta+Enter can invoke Save when its button is disabled. Workspace guards prevent data corruption, masking the inconsistent component callbacks. | [CardComposer](../src/components/CardComposer.tsx) and [InlineCardEditor](../src/components/InlineCardEditor.tsx) consistently reject blank trimmed values. Plays check no save callback, retained input, and the disabled editor action. |
| The canvas deletion action is named “Delete board,” although the command deletes the entire canvas. | [CanvasToolbarActions](../src/components/CanvasToolbarActions.tsx) now says “Delete canvas.” Only matching selectors changed in the existing board-persistence and remote-deletion browser tests. |

## Story fidelity and checked-correct behavior

The audit read all 19 requested component implementations and all their existing stories, plus workspace/header/selection/editing/drag/transfer contracts. Stateful fixtures now render outcomes for CanvasCard, CanvasCardSlot, CanvasCardList, CanvasBoard, BoardTitle, TopBar, CanvasToolbarActions, Sidebar, CardComposer, InlineCardEditor, and CreateCanvasDialog. The existing section harness's editing logic is shared by the dedicated list/slot/board fixtures instead of maintaining independent mutation implementations. Command-only callbacks remain assertions of command contracts; full workspace plays/browser tests verify actual creation, upload, favorite propagation, and downloaded data.

- **Cards and sections:** mouse single-click versus double-click semantics, keyboard edit, hover/focus deletion, heading/body display, multiline input, whitespace guards, outside cancellation, reopened composer value/caret, all 12 sections, both bottom grids, first-card anchoring, composer expansion without nested scrolling, wrapping, and horizontal mobile scrolling. The all-section play adds, edits, saves, checks focus, and deletes in each section.
- **Drag:** existing real vertical reorder and reload persistence; new cross-section drop into a bottom grid with order and reload assertions. The inherited shift geometry story remains intact; stateful board stories also apply drag mutations and assert within-section and cross-section ordering. Sidebar pointer and Alt+Arrow ordering, boundaries, retained focus, selection, and favorites are covered.
- **Header/dialog:** title prefix/fallback/truncation, long 320px header fit during editing, trimmed rename propagation, blank create rejection, create/close/reopen, popup clipping and independent instances, favorite/Notepad ARIA state, and icon action names. Production browser tests exercise native dialog/popover Escape; synthetic Storybook keyboard events do not cause those browser default actions, so native behavior is not inferred from simulated `cancel` events.
- **Notes/sidebar:** controlled note editing, pointer and keyboard resize, persisted notes, closed-panel inertness, mobile tab access, and two-canvas note isolation. The sidebar's sign-out contract now explicitly includes its already-supported promise return; its stateful pending/failure/retry play preserves the returned promise and verifies disabled duplicate actions, visible failure, retained navigation, and successful removal.
- **Transfers and integration:** malformed local YAML reports a failure without replacing the canvas; a valid retry renders its canvas and sidebar entry. The browser downloads and parses the actual YAML, verifying edited multiline card text, favorite, and notes. Existing Kanban-shell and local remote-deletion tests validate the scoped style/action-label changes and retained board draft guards. A trial “successful upload” fixture initially omitted required sections; this was a fixture defect and was corrected using the existing YAML contract.

The inherited CancelWithEscape warning was traced to Storybook's React renderer: its `eventWrapper` invokes synchronous `act` without awaiting the returned work. [The dedicated helper](../src/components/canvas-story-act.ts) awaits the complete composer interaction and restores the caller's React test-environment flag in `finally`. The workspace draft play uses awaited synchronous input events for its setup. No console filtering, warning suppression, global runner changes, or accessibility exclusions were added.

## Validation

Environment setup used `npm ci`, `npx playwright install chromium`, and `npx playwright install-deps chromium`. The first runner attempt reported a missing Chromium executable; behavior results below are from subsequent installed-browser runs.

| Check | Result |
| --- | --- |
| Complete Storybook interaction/accessibility suite | **142/142 passed in 43 files**, including plays and axe checks; no skips or `act` warnings |
| Affected Storybook scope | **82/82 passed in 24 files** |
| Focused Chromium browser suite | **43/43 passed**; final sidebar drag-style follow-up **6/6 passed** |
| Local deterministic remote-deletion suite | **2/2 passed** |
| `npm test` | **34/34 passed in 9 unit files** |
| `npm run typecheck` | Passed |
| `npm run lint` | Passed, including the 100-line TS/TSX policy |
| `npm run build` | Passed, with production PWA/service worker generated |
| `npm run build-storybook` | Passed; **142 indexed stories from all 43 source files**, no missing files |
| `git diff --check` | Passed |
| React Doctor changed-file check | Unavailable under its written-permission restriction; cancelled |

The Storybook build has no service worker, Workbox bundle, or web manifest. No story was removed, skipped, or given an accessibility exclusion. The final story logs contain no inherited `act` warning or React test-environment warning. Production and Storybook builds emit advisory chunk-size warnings; limits and code splitting were not changed for this audit.

Commands for reproducing the affected and browser checks:

```bash
npm run test:storybook -- src/components/Canvas src/components/CardComposer \
  src/components/InlineCardEditor src/components/BoardTitle src/components/Dialog \
  src/components/CreateCanvasDialog src/components/Sidebar src/components/NotepadPanel \
  src/components/TopBar src/components/ToolbarIconButton

npx playwright test tests/card-editing.spec.ts tests/composer-layout.spec.ts \
  tests/section-layout.spec.ts tests/card-drag.spec.ts tests/workspace-header.spec.ts \
  tests/workspace-layout.spec.ts tests/sidebar-ordering.spec.ts tests/notepad.spec.ts \
  tests/canvas-lifecycle.spec.ts tests/canvas-data.spec.ts tests/canvas-*-regressions.spec.ts \
  tests/board-polish.spec.ts tests/board-polish-keyboard.spec.ts tests/board-persistence.spec.ts \
  --workers=2
npx playwright test --config playwright.remote.config.ts --workers=2
npm run test:storybook
```

## Limits

- `npx --yes react-doctor@latest . --diff HEAD` printed the AI/ML written-permission restriction and the deprecation notice for `--diff`. The process was stopped; no completed licensed scan or score is claimed. No alternate version, detection bypass, or permission acceptance was used.
- Interaction and accessibility validation uses Chromium, automated axe checks, and local deterministic fixtures. This is not a manual screen-reader audit or live Firebase/auth test.
- Header create/rename are synchronous contracts. Transfer errors are surfaced by the existing workspace command/notice layer; this patch does not redesign persistence or introduce a new async header-command contract.
