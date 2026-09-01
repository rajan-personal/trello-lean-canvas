# Lean

A Lean Canvas workspace with Trello-style editing. The app starts with a clean workspace where canvases can be created or uploaded from YAML.

## Features

- Create, upload, rename, favorite, switch, and delete Lean Canvases
- Add, edit, delete, clear, and drag cards between all 12 canvas sections
- Persist uploaded canvases locally in the browser
- Download the current canvas as a portable YAML file
- Upload additional YAML canvases
- Responsive sidebar and horizontally scrollable canvas on small screens

## Run locally

```bash
npm install
npm run dev
```

Then open `http://127.0.0.1:5173`.

## Component workbench and UI review

```bash
npm run storybook
```

Open `http://127.0.0.1:6006` to browse components locally. Select any story, open the **Comments** tab in the addon panel, and add notes scoped to that story. Local comments persist in that browser through `localStorage` and do not require a review branch.

Publish the component snapshots to Chromatic for shared threaded review comments:

```bash
CHROMATIC_PROJECT_TOKEN=your-token npm run chromatic
```

Chromatic prints a build URL where reviewers can comment on each component snapshot. For automatic builds on every push, add `CHROMATIC_PROJECT_TOKEN` as a GitHub Actions repository secret; `.github/workflows/chromatic.yml` uses it without committing the token.

## Verify

```bash
npm run lint
npm run build
npm run test:e2e
npm run build-storybook
```

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
