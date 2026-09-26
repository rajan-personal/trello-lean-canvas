# Tickets-first preview

Ticket: https://lean.addorimprove.com/project/784e23a5-f292-46f8-8278-86491719e4fc/ticket/4bc3c7e5-f9a4-4bc5-9741-3e380c816d4d

The ticket title is “make ticket first than canvas”; there is no description. This change interprets that as Tickets-first navigation, not removal of the Canvas data model.

## Try it

- Preview: https://lean-tickets-first-demo.bittu15388.workers.dev
- Email: `demo@example.com`
- Password: `TicketsFirst2026!`
- Sample ticket: https://lean-tickets-first-demo.bittu15388.workers.dev/project/79c8d0b7-e366-4dbd-9aa4-5ffb58354a31/ticket/45c1152a-e67b-4fe4-a20a-40abf3b37ba4

These are **public demo inputs**, not real authentication credentials. This is a browser-local simulation, not a protected shared account. Do not enter sensitive data. Each browser has independent localStorage; signing out retains its edits, while sessionStorage remembers the demo login across refreshes in that tab. Sample data is seeded once, so signing in again does not reset edits or recreate deleted projects.

1. Sign in at the preview root. Tickets should be selected, with tabs ordered **Tickets**, **Canvas**.
2. Open a sample ticket; edit its description, save, and refresh. The local edit should remain.
3. Switch to Canvas. Refresh its `/project/{id}` URL: Canvas stays selected.
4. Use browser Back/Forward. Ticket links, close-to-parent navigation, and dirty-draft guards still work.
5. Open `/` again: the first project's Tickets view opens. Home/End on the tab strip select Tickets/Canvas respectively.
6. Sign out. Reopen the sample ticket URL, sign in, and verify the requested ticket opens.

## Isolation and deployment

- `npm run build:demo` writes `dist-demo`; normal production/test builds still write `dist`.
- `src/EntryApp.tsx` selects the demo entry at build time only. Production builds omit the demo login code and credentials; existing Google sign-in is unchanged.
- Demo passes `persistence="local"` directly to the normal Workspace. It does not create a Firebase account, authenticate to Firebase, or read/write production Firestore data.
- `wrangler.demo.jsonc` has a distinct Worker name, no custom-domain routes and no backend bindings. Production `wrangler.jsonc`, Firebase rules, and authorized domains are untouched.
- Demo service-worker generation is disabled to avoid stale preview shells.

```sh
npm run test:demo                         # build and test the local demo
npm run build:demo
npx wrangler deploy -c wrangler.demo.jsonc --dry-run
npm run deploy:demo                       # only the dedicated demo Worker
# Optional live end-to-end smoke:
DEMO_BASE_URL=https://lean-tickets-first-demo.bittu15388.workers.dev npm run test:demo
```

Deployment receipt: Worker `lean-tickets-first-demo`, version `6f5b6c28-e114-45c7-8041-406c2be1056d`. No production deployment was made.
