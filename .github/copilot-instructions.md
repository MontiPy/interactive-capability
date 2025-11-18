## Quick orientation

This repo now contains a small dependency-free demo app for exploring process capability (Cp / Cpk). The UI is a single-page static site with an interactive Normal curve and controls for mean, std, LSL and USL. A small test harness and a reusable stats module were also added.

Use this file to quickly get an agent productive: it highlights where the important code lives, how to run the demo and tests, and the project conventions an agent should follow.

## What I learned from the codebase

- The demo app is implemented as a static SPA: `index.html`, `styles.css`, `app.js`.
- Reusable statistics are in `stats.js` (exports `computeStats` for browser and Node).
- A small Node test harness exists in `tests/test_stats.js` and `package.json` has a `test` script.
- The drawing code uses a canvas with devicePixelRatio scaling and a top secondary axis that marks ±1σ..±6σ.
- Defaults: LSL/USL defaults were changed to `-3.0` / `3.0` (important when writing tests or examples).

## Quick start (what an agent should do first)

1. Run the demo locally to inspect behavior and controls:

```powershell
python -m http.server 8000
# or
npx serve .
```

2. Run unit tests:

```powershell
npm test
```

3. Open `index.html` and `app.js` to inspect how the UI is wired to `computeStats` and the renderer (`renderPlot`).

## Key files and patterns (what to read first)

- `index.html` — lists all UI controls (mean/std sliders + numeric inputs, LSL/USL numeric + sliders, display window controls, tick/grid, fit-to-mean toggle).
- `app.js` — the controller: syncs inputs, calls `computeStats`, and calls `renderPlot(...)`. The renderer handles devicePixelRatio scaling and draws primary axis, optional grid, shaded in-spec area, LSL/USL lines, mean/σ labels, and the secondary top axis showing ±1σ..±6σ.
- `stats.js` — single place for statistical computations: Cp, Cpk, and percent above/below/outside. It is used by `app.js` in the browser and by Node tests (via `module.exports`). Keep logic here when modifying stats.
- `tests/test_stats.js` — Node-based assertions that exercise `computeStats` including edge cases (std=0, inverted limits, etc.).
- `package.json` — contains `test` script (runs `node tests/test_stats.js`).

## Project-specific conventions

- Keep UI code dependency-free and browser-friendly — prefer small vanilla JS utilities over adding libraries unless necessary.
- Put numerical/stat logic in `stats.js` so it can be unit-tested in Node and re-used by the browser runtime.
- Canvas rendering should respect devicePixelRatio and work with the CSS pixel dimensions (`renderPlot` follows this pattern).

## When to ask the maintainer

- Clarify desired default LSL/USL values and any example datasets (defaults are now `-3.0`/`3.0`).
- Decide whether you want a package manager / CI to run `npm test` on push (I can add a GitHub Actions workflow).

## Short checklist for incoming PRs

- [ ] Preserve `stats.js` as the single source for Cp/Cpk logic; add tests when changing numeric behavior.
- [ ] When editing UI behavior, keep inputs (sliders + numeric) synchronized using the `bindPair` pattern in `app.js`.
- [ ] If you change the canvas rendering, maintain devicePixelRatio scaling and the top-axis σ markers.

If you want this adapted for a different stack (React/TypeScript) or for CI testing, say which and I will update these instructions.
