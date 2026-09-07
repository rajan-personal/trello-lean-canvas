# Story-point screenshot evidence

Ticket: https://lean.addorimprove.com/project/784e23a5-f292-46f8-8278-86491719e4fc/ticket/135934c4-9c61-47c5-a416-f7a5fc178cf3

Captured from this implementation in ego-browser against a local test-mode build (`npm run build -- --mode test`, then `npm run preview -- --host 127.0.0.1`). These are synthetic local tickets under the test user, not production records. No production data was changed.

- [Desktop board, 1424 × 900](board-desktop.png): all five saved estimates (1, 3, 5, 8, 13+) shown as number-only badges at the bottom-right, and an unestimated card without a badge, after reloading.
- [Mobile board, 390 × 844](board-mobile.png): the same number-only, bottom-right badges on a narrow viewport.
- [Desktop details, 1424 × 900](details-desktop.png): saved 13+ estimate and guidance to split very large/uncertain work.
- [Mobile details, 390 × 844](details-mobile.png): saved 5-point estimate, associated guidance, and responsive form without horizontal overflow.

## Reproduce

1. Start the test-mode preview and load a sample from **Add canvas → Sample**.
2. Open **Board**, create tickets, open each ticket, select **Story points**, and save.
3. Verify badges, reload, reopen details, move a card, and clear an estimate with **Not estimated**.
4. At 390px width, Tab from Title into Story points; verify the selected value, sizing guidance, and discard confirmation for an unsaved point-only draft.

## Validation

- `npm test`: 66 passed (including schema, mutations, local storage, YAML round trips, and stale estimates).
- `npm run test:firestore`: 27 passed (including all allowed estimates, clearing, stale edits, and security-rule rejection of invalid values).
- `npx playwright test`: 81 passed, including desktop/mobile point selection, saved badges, reload/movement, clearing, keyboard focus, discard protection, and bottom-right badge positioning on desktop/mobile.
- Focused Storybook run: 30 passed across `BoardCardDialog`, `BoardCardLayout`, `BoardCardInteractions`, `BoardCardRecovery`, `KanbanColumn`, and `KanbanBoard`.
- `npm run typecheck`, `npm run lint`, `npm run build`, and `git diff --check`: passed.
- React Doctor diff scan: 100/100, no issues.

The full Storybook command exceeded the 240-second execution window without completing; only the focused run above is claimed as passing. Production build reports the existing >600 kB chunk advisory.

## Rollout

Deploy the updated `firestore.rules` before the frontend; the previous rules reject the new field. Existing records/YAML without `storyPoints` remain valid, and no data migration is needed. `13` is stored numerically and displayed as `13+`; `null` clears the estimate. Already-open older clients should refresh to load the updated strict schema before reading estimated cards. This PR does not deploy production.
