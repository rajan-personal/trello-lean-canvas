# All Tickets flat-list screenshot evidence

Captured from `/tickets` in a local test-mode browser session with synthetic localStorage fixtures. These screenshots contain no production ticket records, account details, private URLs, or credentials.

- `desktop-project-ascending.png` (1200 × 710): one flat table across Alpha project and Beta project, with Project sorted ascending and story points preserved.
- `desktop-status-descending.png` (1200 × 710): the same table with Status sorted descending across custom project columns; the active direction is visible in the header.
- `mobile-status-descending.png` (375 × 800): the responsive table remains a list on a narrow viewport with the Status descending state visible.

The fixture uses synthetic projects named `Alpha project` and `Beta project`, including duplicate ticket titles and project-specific status column IDs to exercise stable cross-project ordering. Existing project-board and ticket deep-link behavior was checked separately with the same local fixtures.
