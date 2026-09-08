# Card details light-dismiss

Captured in Chromium inside Box `bx_35hpn5hc` using the test-only local workspace and synthetic sample data. No production account data is included.

These pairs show **before and after the outside-click interaction on the fixed build**, not a visual redesign:

| Viewport | Card details open | After backdrop click/tap |
| --- | --- | --- |
| Desktop (1440 × 900) | [Open](desktop-open.png) | [Dismissed](desktop-dismissed.png) |
| Mobile (390 × 844) | [Open](mobile-open.png) | [Dismissed](mobile-dismissed.png) |

Reproduce with `npm run test:e2e -- tests/board-light-dismiss.spec.ts`. To inspect manually, load sample data, switch to Tickets, add/open a card, and click/tap the surrounding backdrop. The dialog closes; the card remains. Edit a field or comment first to verify the discard confirmation.
