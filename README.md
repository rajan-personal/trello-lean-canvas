# Lean

A strict TypeScript Lean Canvas workspace with Trello-style editing. Start with an empty workspace, then create a canvas, upload YAML, or load the Airbnb, Facebook, Google, and Amazon samples.

## Features

- Load four researched YAML examples on demand using the **Load sample data** button
- Create, upload, rename, favorite, switch, and delete Lean Canvases
- Write project overviews, goals, and links in the **About** tab in a single rich-text editor with a formatting toolbar and explicit **Save** button
- Keep separate project notes in the resizable **Notepad**, using the same rich-text tools as About with automatic saving
- Add, edit, delete, clear, and drag cards between all 12 canvas sections
- Sign up with Google; sign in with Google or email/password and sync each user's canvases privately with Cloud Firestore
- Discuss tasks in a shared user/agent comment thread; see [agent setup and CLI](docs/task-comments.md)
- Download the current canvas as a portable YAML file
- Upload additional YAML canvases
- Responsive sidebar and horizontally scrollable canvas on small screens
- Installable progressive web app with an offline-ready application shell

The YAML files in [`examples/`](examples/) are retrospective reconstructions rather than official company documents. Their starting assumptions were adapted from [Railsware’s Lean Canvas examples](https://railsware.com/blog/5-lean-canvas-examples/), with Facebook’s multi-sided model cross-checked against [Ash Maurya’s Facebook Lean Canvas](https://medium.com/lean-stack/how-to-model-a-multi-sided-business-60f2d7613e39).

## Run locally

```bash
npm install
npm run dev
```

Use Node.js 22.12 or newer (compatible with Vite and local Wrangler). Then open `http://127.0.0.1:5173`. The checked-in Firebase web configuration targets `trello-lean-canvas-7kvrv`; it contains public client identifiers only. You can override it with `VITE_FIREBASE_*` variables in `.env.local`.

Account creation in the app uses Google only. Existing Google users can set a password from the sidebar, then sign in with either Google or email/password. Setting or changing a password requires Google verification and retains the same Firebase UID and workspace. See [email sign-in setup](docs/email-sign-in.md). Firestore stores ordering metadata at `users/{uid}/workspaces/default` and each canvas independently under its `canvases/{canvasId}` subcollection. Runtime Zod schemas reject malformed local or cloud data before it reaches application state.

On first sign-in after this schema upgrade, the app idempotently copies and verifies canvases from the former workspace-array document before replacing it with the metadata document. Existing `lean-canvas:v2` browser data follows the same verified path for an empty cloud workspace. Local migration and recovery copies remain until cloud persistence succeeds. Concurrent edits to different canvases are isolated; simultaneous edits to the same canvas remain last-writer-wins.

## Firebase backend and deployment

The frontend is hosted on Cloudflare Workers Static Assets at `lean.addorimprove.com`, with SPA navigation fallback for clean project/ticket URLs. Firebase continues to supply Authentication and Firestore only; no backend Worker is needed. See [the deployment and rollback checklist](docs/cloudflare-hosting.md) before publishing.

[GitHub Actions CI](.github/workflows/ci.yml) runs lint, type checking, unit tests, and a production deployment dry run on pull requests. Merging to `main` runs those checks and deploys to Cloudflare, then verifies that the live app shell matches the build. To redeploy `main`, run the **CI** workflow from the Actions tab (or `gh workflow run ci.yml --ref main`). Manual runs on other branches only validate; they do not deploy.

The repository's Actions secrets must contain `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID`. The token needs Account / Workers Scripts / Edit and Account / Account Settings / Read for the deployment account, plus Zone / Zone / Read and Zone / Workers Routes / Edit for `addorimprove.com`. Credentials are supplied only to the production deployment step. Firebase configuration and rules are deployed separately.

```bash
# Deploy Google and email/password Auth configuration, Firestore rules, and indexes
npm run deploy:firebase

# Validate the frontend without publishing
npm run deploy:dry-run

# Build and publish static assets to Workers (requires explicit release approval)
npm run deploy

# Serve the built assets locally using the Workers routing configuration
npm run preview:worker
```

The Firebase CLI uses the project in [`.firebaserc`](.firebaserc). Security rules in [`firestore.rules`](firestore.rules) restrict every workspace to its matching authenticated UID, validate top-level document types and canonical section IDs, and couple topology changes to the workspace order. Full nested card validation remains in the Zod runtime boundary because Firestore Rules cannot iterate arbitrary list elements efficiently. Keep existing Firebase Authentication authorized domains during cutover. A release owner must authorize any new preview hostname before testing Google sign-in there; frontend deployment does not change Firebase configuration.

During rollout, migrated metadata retains a compatibility `canvases` snapshot so already-open legacy clients do not suddenly render an empty workspace. It is not updated by the new client and legacy writes are rejected after migration. Remove this optional field and the transitional legacy-create/update rule in a later cleanup release after old browser sessions have expired.

## Shareable workspace routes

- `/project/{projectId}` opens the Canvas view.
- `/project/{projectId}/ticket` opens the **Tickets** view (the Kanban board).
- `/project/{projectId}/ticket/{ticketId}` opens a ticket dialog.
- `/project/{projectId}/about` opens the project’s **About** details.

Root opens the first available project's Tickets view after loading. Tabs appear in Tickets, Canvas, About order (Home selects Tickets; End selects About). Explicit Canvas links and the selected view when switching projects are preserved. Unavailable links never silently select another project. Signing in preserves the requested URL; Back/Forward restores project, view, and ticket selection. Clicking or tapping outside card details closes the dialog and returns to the Tickets view without deleting the card. Unsaved edits or comments require discard confirmation, and pending saves block dismissal. Clicking inside the dialog or dragging from an editor onto the backdrop does not close it. Closing a directly loaded ticket navigates to its parent Tickets route without leaving the app. Board drafts and pending saves guard navigation. Canvas inline editors retain their existing outside-click dismissal behavior; browser Back/Forward and unload protect their unsaved drafts.

## Component workbench and UI review

```bash
npm run storybook
```

Open `http://127.0.0.1:6006` to browse components and run their interaction and accessibility checks locally.

Run all real Chromium story interactions and accessibility checks with:

```bash
npx playwright install --with-deps chromium # first-time browser setup
npm run test:storybook
```

The Storybook 10 Vitest addon discovers the same stories as the workbench, applies preview hooks and viewport globals, and executes plays and axe checks. `build-storybook` only compiles the workbench; it is not an interaction-test pass. Storybook has an isolated Vite configuration so production PWA precaching never includes its manager assets. See [the audit and ticket handoff](docs/storybook-audit.md) for exact validation commands, results, and outstanding defects.

## Verify

```bash
npm run lint
npm run typecheck
npm test
npm run test:firestore
npm run build
npm run test:e2e
npm run build-storybook
npm run test:storybook
```

The Firestore test command starts the local emulator and requires Java 21 or newer; on macOS the runner selects the newest installed JDK automatically. It covers owner isolation, malformed writes, per-canvas documents, and repeatable legacy migration. Playwright builds in Vite's `test` mode and uses the test-only local persistence seam from [`.env.test`](.env.test); production builds always use Firebase Authentication and Firestore.

## YAML format

Each download contains one canvas and its sections:

```yaml
version: 1
canvas:
  name: Team alignment
  title: Pulse
  favorite: false
  sections:
    - id: problem
      number: 1
      title: Problem
      hint: List your top 1–3 problems.
      cards:
        - Decisions disappear across chat, docs, and meetings
```

About details are stored as Markdown text and included in YAML exports. Edit headings, emphasis, lists, checklists, links, quotes, and code directly in one rich-text surface, then click **Save**. Existing Markdown renders as formatted content; simply opening it does not rewrite the stored text. Projects and YAML files without `about` open with empty details. Deploy the updated Firestore rules before releasing this frontend so saves can include the new field.

Notepad notes save automatically as you type and remain separate in the `notes` YAML field. Its edge-to-edge rich-text editor keeps formatting tools close while maximizing writing space. About retains its explicit **Save** button.
