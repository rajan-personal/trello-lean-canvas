# Lean

A strict TypeScript Lean Canvas workspace with Trello-style editing. Start with an empty workspace, then create a canvas, upload YAML, or load the Airbnb, Facebook, Google, and Amazon samples.

## Features

- Load four researched YAML examples on demand using the **Load sample data** button
- Create, upload, rename, favorite, switch, and delete Lean Canvases
- Add, edit, delete, clear, and drag cards between all 12 canvas sections
- Sign in only with Google and sync each user's canvases privately with Cloud Firestore
- Download the current canvas as a portable YAML file
- Upload additional YAML canvases
- Responsive sidebar and horizontally scrollable canvas on small screens

The YAML files in [`examples/`](examples/) are retrospective reconstructions rather than official company documents. Their starting assumptions were adapted from [Railsware’s Lean Canvas examples](https://railsware.com/blog/5-lean-canvas-examples/), with Facebook’s multi-sided model cross-checked against [Ash Maurya’s Facebook Lean Canvas](https://medium.com/lean-stack/how-to-model-a-multi-sided-business-60f2d7613e39).

## Run locally

```bash
npm install
npm run dev
```

Then open `http://127.0.0.1:5173`. The checked-in Firebase web configuration targets `trello-lean-canvas-7kvrv`; it contains public client identifiers only. You can override it with `VITE_FIREBASE_*` variables in `.env.local`.

Google is the only enabled sign-in provider. Firestore stores each workspace at `users/{uid}/workspaces/default`. On the first successful sign-in, existing `lean-canvas:v2` browser data is moved into an empty cloud workspace and removed locally only after the cloud write succeeds.

## Firebase backend and deployment

The frontend remains on GitHub Pages (and the `lean.addorimprove.com` custom domain). Firebase supplies Authentication and Firestore only.

```bash
# Deploy Google Auth configuration, Firestore rules, and indexes
npm run deploy:firebase

# Build and publish the frontend to GitHub Pages
npm run deploy

# Run both in that order
npm run deploy:all
```

The Firebase CLI uses the project in [`.firebaserc`](.firebaserc). Security rules in [`firestore.rules`](firestore.rules) restrict every workspace to its matching authenticated UID. Keep `localhost`, `rajan-personal.github.io`, and `lean.addorimprove.com` in Firebase Authentication's authorized domains.

## Component workbench and UI review

```bash
npm run storybook
```

Open `http://127.0.0.1:6006` to browse components and run their interaction and accessibility checks locally.

## Verify

```bash
npm run lint
npm run typecheck
npm run build
npm run test:e2e
npm run build-storybook
```

Playwright builds in Vite's `test` mode and uses the test-only local persistence seam from [`.env.test`](.env.test); production builds always use Firebase Authentication and Firestore.

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
