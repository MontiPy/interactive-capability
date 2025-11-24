# Interactive Process Capability Calculator

A modern, interactive web application for exploring process capability (Cp/Cpk) calculations. Built with React, TypeScript, and Material-UI, featuring real-time statistical analysis, data import, and scenario comparison.

![Process Capability Demo](screenshot.png)

## Features

### Core Capabilities
- **Real-time Statistical Analysis**: Calculate Cp, Cpk, Pp, Ppk, DPMO, Sigma Level, and Cpm (Taguchi index)
- **Interactive Normal Distribution Chart**: Visualize your process with a canvas-based chart featuring:
  - Draggable specification limits (LSL/USL)
  - Shaded in-spec and out-of-spec regions
  - Secondary sigma axis (±1σ to ±6σ markers)
  - High-DPI rendering support

### Data Analysis
- **Real Data Import**:
  - Paste comma/newline-separated measurement values
  - Upload CSV or text files
  - Automatic histogram generation overlaid on theoretical distribution
- **Multiple Scenario Comparison**: Compare up to 9 different distributions side-by-side
- **Advanced Metrics**: View detailed capability metrics including process performance indices

### Usability
- **Preset Configurations**: Quickly load common scenarios (Six Sigma, Tight Tolerance, Off-Center, etc.)
- **Export Capabilities**: Export charts as PNG (high-resolution)
- **URL State Management**: Share configurations via URL parameters
- **Responsive Design**: Two-column layout with controls on left and chart on right

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

### Basic Operation

1. **Adjust Distribution Parameters**:
   - Use sliders or input fields to set Mean (μ) and Standard Deviation (σ)
   - Values update in real-time on the chart

2. **Set Specification Limits**:
   - Enter LSL (Lower Spec Limit) and USL (Upper Spec Limit)
   - Or drag the red dashed lines directly on the chart

3. **View Capability Metrics**:
   - Cp and Cpk are color-coded (green ≥ 1.33, orange ≥ 1.0, red < 1.0)
   - Click "View Advanced Stats" for Pp, Ppk, DPMO, and Sigma Level

### Importing Real Data

1. Click "Import Data" at the bottom of the page
2. Choose either:
   - **Paste Data**: Copy-paste your measurements
   - **Upload File**: Select a CSV or text file
3. The app will calculate mean/std and overlay a histogram on the chart

### Comparing Scenarios

1. Scroll to "Comparison Mode" section
2. Click "Add Scenario"
3. Configure the scenario's mean, std, LSL, and USL
4. Toggle visibility using the eye icon
5. Each scenario is rendered with a different color

### Using Presets

Click "Load Preset" in the top-right to quickly load common configurations:
- **Six Sigma**: Centered process with Cp = 2.0
- **Tight Tolerance**: Narrow spec limits
- **Off-Center**: Process shifted off target
- **Minimum Capability**: Barely capable (Cpk ≈ 1.0)
- **Wide Tolerance**: Very capable process

### Exporting Charts

Click the floating download button (bottom-right) to export the chart as a high-resolution PNG image.

## Development

### Project Structure

```
src/
├── main.tsx                    # App entry point
├── App.tsx                     # Main layout
├── theme.ts                    # MUI theme
├── types.ts                    # TypeScript definitions
├── context/
│   └── AppContext.tsx          # State management
├── components/                 # React components
│   ├── Chart.tsx
│   ├── DistributionControls.tsx
│   ├── SpecLimitControls.tsx
│   └── ...
└── utils/
    ├── stats.ts                # Statistical calculations
    ├── rendering.ts            # Canvas rendering
    └── presets.ts              # Preset configurations
```

### Testing

```bash
# Run tests
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

- **Pp / Ppk (Process Performance)**: Similar to Cp/Cpk but uses sample standard deviation
  - Better for smaller sample sizes or unstable processes

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

- **DPMO (Defects Per Million Opportunities)**: Expected defect rate per million units
- **Sigma Level**: Process capability expressed in sigma units (higher is better)

## License

MIT License - see LICENSE file for details

## Acknowledgments

- Statistical formulas based on standard SPC literature
- Error function approximation from Abramowitz and Stegun
- UI design inspired by modern data visualization tools

## Support

For issues, questions, or contributions, please visit the [GitHub repository](https://github.com/yourusername/interactive-capability).
