# Repository Guidelines

## Project Structure & Module Organization
- `index.html` hosts the control layout, stats table, and canvas surface.
- `app.js` wires DOM inputs to `stats.js`, drives validation, and renders the Normal curve.
- `stats.js` exposes `computeStats` for Cp/Cpk and % out-of-spec math; it is shared between browser and Node tests.
- `styles.css` keeps the layout responsive with a lightweight flex/grid mix.
- `tests/test_stats.js` contains the Node unit tests invoked by the npm script.

## Build, Test, and Development Commands
- `python -m http.server 8000` (or `npx serve .`): starts a static server so the UI and canvas code load with proper file URLs.
- `npm test`: runs `tests/test_stats.js`, validating Cp/Cpk math, tail probabilities, and guardrails such as `std = 0`.

## Coding Style & Naming Conventions
- JavaScript uses two-space indentation, trailing commas avoided, and descriptive camelCase identifiers (`computeStats`, `renderPlot`).
- Keep statistical logic isolated in `stats.js` and export pure helpers so the file stays Node-compatible.
- Prefer declarative DOM hooks (IDs for sliders/inputs) and keep CSS selectors class-based to avoid leaking layout assumptions.
- Run Prettier or `node --check` locally if you add tooling, but commit only deterministic, formatter-clean code.

## Testing Guidelines
- Tests rely on plain Node assertions inside `tests/test_stats.js`; organize new specs by scenario (happy path, guardrails, regression).
- Mirror browser changes with numeric fixtures so Cp/Cpk, percentages, and input validation stays covered.
- Aim to update or extend edge cases whenever LSL/USL math or Normal CDF approximations change.

## Commit & Pull Request Guidelines
- History currently shows short lower-case summaries (e.g., `first commit`); continue using concise, imperative present tense subjects.
- Reference issues or feature scopes in the first line when applicable and describe risk/validation details in the body.
- Pull requests should link related tickets, outline UI or math deltas, note test results (`npm test`), and include screenshots/GIFs for major UI changes.
