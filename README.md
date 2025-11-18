This project is a small interactive webpage that demonstrates process capability calculations. The UI lets you change mean and standard deviation and shows a Normal distribution curve with user-specifiable LSL and USL.

Key features
------------

- Interactive controls for mean, std (each with slider + numeric input).
- LSL and USL can be edited via numeric inputs and synchronized sliders.
- Display controls: editable display min/max, tick-step, tick format, show/hide grid.
- Fit-to-mean mode (mean ± N·σ) with a configurable multiplier.
- Responsive canvas with devicePixelRatio scaling and a secondary top axis that marks ±1σ..±6σ.
- Cp, Cpk and percent-outside/above/below are computed and displayed live.

Try the demo locally
--------------------

The repository is a dependency-free static demo. To run it locally you can use a simple static server. From the repository root run one of these (PowerShell examples):

```powershell
# with Python 3 (built-in)
python -m http.server 8000

# or with npm's `serve` package if you prefer
npx serve .
```

Then open http://localhost:8000 in your browser and the demo `index.html` will load.

Files of interest
-----------------

- `index.html` — UI and input controls. Defaults: mean=0, std=1, LSL=-3.0, USL=3.0.
- `app.js` — input wiring, `computeStats` usage, and `renderPlot` (canvas renderer). Key functions: `bindPair`, `updateAll`, `renderPlot`.
- `stats.js` — standalone computation module exporting `computeStats` (usable in browser and Node).
- `styles.css` — minimal styling for controls and layout.
- `tests/test_stats.js` and `package.json` — Node test harness and test script (`npm test`).

Running tests
-------------

Node-based unit tests for the core `computeStats` function were added. To run them:

```powershell
npm test
```

This executes `tests/test_stats.js` which validates Cp/Cpk and percentages, including edge cases (std=0, inverted limits). The code uses an erf-based CDF approximation in `stats.js` suitable for the demo.

Notes and next steps
--------------------

- The `stats.js` module is the canonical place for numeric/statistical logic; when changing Cp/Cpk or distribution calculations, update tests in `tests/test_stats.js`.
- If you want higher precision for tail probabilities, we can substitute a small numeric library (e.g., jstat) and update tests accordingly.
- If you'd like CI, I can add a GitHub Actions workflow that runs `npm test` on PRs.

If you'd like the app migrated to React/TypeScript, or want additional test coverage or visual regression tests, tell me which direction and I'll scaffold it.