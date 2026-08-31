# Trello Lean Canvas

A pixel-accurate, functional React implementation of the Doop Lean Canvas design. It combines a Trello-style workspace with independent canvases for team alignment, market entry, and mobile onboarding.

## Features

- Create, rename, favorite, switch, and delete Lean Canvases
- Add, edit, delete, clear, and drag cards between all 12 canvas sections
- Persist every canvas locally in the browser
- Download the current canvas as a portable YAML file
- Upload YAML into the current canvas
- Responsive sidebar and horizontally scrollable canvas on small screens

## Run locally

```bash
npm install
npm run dev
```

Then open `http://127.0.0.1:5173`.

## Verify

```bash
npm run lint
npm run build
npm run test:e2e
```

## YAML format

Each download contains one canvas and its sections:

```yaml
version: 1
canvas:
  name: Team alignment
  title: Lean Canvas — Pulse
  favorite: false
  sections:
    - id: problem
      number: 1
      title: Problem
      hint: List your top 1–3 problems.
      cards:
        - Decisions disappear across chat, docs, and meetings
```
