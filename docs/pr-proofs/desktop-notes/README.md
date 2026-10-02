# Expandable desktop notes

Captured from the local test build with `tests/notepad-expand.spec.ts` using sample canvas data.

- `desktop-resized.png`: 1440 × 900 viewport; notes resized to 720px, beyond the former 640px cap.
- `desktop-expanded.png`: 1440 × 900 viewport; notes occupy the full workspace below the top bar.
- `mobile.png`: 390 × 844 viewport; notes retain the full mobile layout.

The browser regression covers expand/restore, retained manual width, viewport and sidebar changes, keyboard limits, pointer dragging, closing notes, and editing/autosave while expanded.

Validation: 117 unit tests, four NotepadPanel Storybook tests, nine notes browser tests, typecheck, lint, and production/Worker deployment dry run.

Reproduce screenshots: `npx playwright test tests/notepad-expand.spec.ts --workers=1`.
