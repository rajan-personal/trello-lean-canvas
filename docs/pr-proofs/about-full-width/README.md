# About panel width

The About form now fills its workspace instead of stopping at 760px. The existing panel styling, editor, and responsive padding stay in place.

| Viewport | Before | After (sidebar open) |
| --- | --- | --- |
| 1440 × 900 | 760px form | 1160px form |
| 1920 × 900 | 760px form | 1640px form |
| 390 × 844 | 374px form | 374px form |

Screenshots use the same sample project and Markdown in a test-mode build with test-only authentication.

- [Desktop before, 1440px](before-1440.png) / [after](after-1440.png)
- [Wide desktop before, 1920px](before-1920.png) / [after](after-1920.png)
- [Mobile before, 390px](before-390.png) / [after](after-390.png)
- [Desktop with collapsed sidebar](after-1440-collapsed-sidebar.png)
- [Desktop with notepad open](after-1440-notepad.png)

Validation: lint, typecheck, all 117 unit tests, test-mode build, and 15 targeted Playwright tests passed. Browser coverage includes layout at 320, 375, 768, 1440, and 1920px, saving, draft protection, retrying failed saves, links, Markdown, and selected-text code formatting.
