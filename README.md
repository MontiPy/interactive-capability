# Interactive Process Capability Calculator

A modern, interactive web application for exploring process capability (Cp/Cpk) calculations. Built with React, TypeScript, and Material-UI, featuring real-time statistical analysis, data import, and scenario comparison.

## Features

### Analysis
- **Capability indices**: Cp, Cpk, CPU, CPL, Pp, Ppk, Cpm (Taguchi), expected PPM (below / above / total), Z.bench and sigma level
- **Tail-accurate math**: the normal CDF keeps relative precision far into the tails, so PPM for very capable processes (e.g. 0.002 ppm at Cp = 2) is correct
- **Real data import** (paste, file upload, or drag-and-drop):
  - Within-subgroup σ (moving range ÷ d2) drives Cp/Cpk; overall σ drives Pp/Ppk
  - 95% confidence intervals for Cp and Cpk based on the sample size
  - Anderson–Darling normality test with a warning when normal-based estimates may mislead
  - Histogram overlay drawn as a true density, plus a dashed overall-σ curve
  - Spec limits can be set at import time
- **Actionable summary**: a capable / marginal / not-capable verdict and a one-line recommendation (re-centre vs. reduce variation)
- **Goal seek**: find the μ or σ that reaches a target Cpk

### Interaction
- **Interactive chart**: drag LSL/USL with mouse or touch; hover for x, z-score and tail percentages
- **Scenario comparison**: overlay many distributions, reorder them, edit inline, compare them in a table
- **Undo / redo** (Ctrl/⌘+Z, Ctrl/⌘+Shift+Z) for every data change; slider drags collapse into a single step
- **Session persistence**: work is saved in the browser and restored on reload
- **Share links**: copy a URL that reproduces the primary distribution and all scenarios
- **Exports**: PNG (2×), CSV (per-scenario in comparison mode), and JSON
- **Dark mode**: follows the OS by default, with a manual toggle
- **Responsive**: works on phones with touch dragging, compact tabs and a controls drawer

## Quick Start

### Prerequisites
- Node.js 18 or higher
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/interactive-capability.git
cd interactive-capability

# Install dependencies
npm install

# Start development server
npm run dev
```

The application will open at `http://localhost:3000`.

### Building for Production

```bash
npm run build
npm run preview
```

The production build will be in the `dist/` directory.

## Usage

1. **Model a process**: set μ and σ with the sliders or text fields. Slider ranges scale to your process, so μ = 250.02 mm with σ = 0.004 mm works as well as the default standard normal.
2. **Set spec limits**: type LSL/USL, or drag the red dashed lines on the chart.
3. **Read the metrics**: Cp/Cpk are colour-coded (green ≥ 1.33, amber ≥ 1.0, red < 1.0). Click **Details** for the full breakdown.
4. **Import data**: click **Import Data** and paste values, choose a file, or drop a CSV/TXT file onto the dialog. Keep the values in production order, because the within-σ estimate uses consecutive differences.
5. **Compare scenarios**: click **Add to Comparison**, or switch to the **Scenario Comparison** tab to add blank scenarios, presets or imported data. Click a table row to focus a scenario.
6. **Share or export**: use **Export → Copy Share Link**, or export a PNG, CSV or JSON.

## Development

### Project Structure

```
src/
├── main.tsx                    # App entry point
├── App.tsx                     # Main layout
├── theme.ts                    # MUI theme
├── types.ts                    # TypeScript definitions
├── context/
│   ├── appReducer.ts           # Reducer + undo/redo history
│   ├── AppContext.tsx          # Provider, persistence
│   └── ColorModeContext.tsx    # Light/dark theme
├── components/                 # React components
│   ├── Chart.tsx
│   ├── DistributionControls.tsx
│   ├── SpecLimitControls.tsx
│   └── ...
└── utils/
    ├── stats.ts                # Capability math, normality test, confidence intervals
    ├── rendering.ts            # Canvas rendering
    ├── viewport.ts             # Auto-range calculations
    ├── goalSeek.ts             # Target-Cpk solver
    ├── persistence.ts          # Session storage and share links
    ├── exportData.ts           # CSV / JSON builders
    ├── format.ts               # Number formatting and slider ranges
    └── presets.ts              # Preset configurations
```

### Testing

```bash
# Run tests once
npx vitest --run

# Watch mode
npm test

# Run tests with UI
npm test:ui

# Run linter
npm run lint
```

### Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Statistical Background

### Capability Indices

- **Cp (Process Capability)**: Measures the potential capability of a process
  - Cp = (USL - LSL) / (6σ)
  - Does not account for process centering

- **Cpk (Process Capability Index)**: Measures actual capability considering centering
  - Cpk = min[(USL - μ)/(3σ), (μ - LSL)/(3σ)]
  - Accounts for process mean relative to spec limits

- **Pp / Ppk (Process Performance)**: Same formulas as Cp/Cpk, using the overall (long-term) sample σ
  - With imported data, Cp/Cpk use the within-subgroup σ estimated as MR̄ / 1.128
  - Ppk well below Cpk suggests shifts or drift over time

- **Cpm (Taguchi Index)**: Considers deviation from target value
  - Cpm = (USL - LSL) / [6√(σ² + (μ - T)²)]
  - Penalizes deviation from target even if within spec

### Interpretation Guidelines

| Index Value | Interpretation |
|------------|----------------|
| ≥ 1.33 | Good - Process is capable |
| 1.0 - 1.33 | Marginal - May need improvement |
| < 1.0 | Poor - Process not capable |

### Six Sigma Metrics

- **DPMO / PPM**: Expected defect rate per million units, split by lower and upper tail
- **Z.bench**: One-sided z-score with the same total defect rate
- **Sigma Level**: z for a centred process with the same defect rate (no 1.5σ shift)

### Confidence Intervals and Normality

- **Cp CI**: chi-square method, Cp·√(χ²(α/2, n−1)/(n−1)) to Cp·√(χ²(1−α/2, n−1)/(n−1))
- **Cpk CI**: Bissell's approximation, Cpk ± z·√(1/(9n) + Cpk²/(2(n−1)))
- **Anderson–Darling**: A*² with D'Agostino & Stephens p-values. Below p = 0.05, normal-based estimates are flagged

## License

MIT License - see LICENSE file for details

## Acknowledgments

- Statistical formulas based on standard SPC literature
- Complementary error function from Numerical Recipes (Chebyshev approximation); inverse normal from Acklam
- UI design inspired by modern data visualization tools

## Support

For issues, questions, or contributions, please visit the [GitHub repository](https://github.com/yourusername/interactive-capability).
