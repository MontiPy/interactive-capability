# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

An interactive process capability (Cp/Cpk) calculator built with React, TypeScript, and Material-UI. Features include real-time statistical calculations, data import with histogram visualization, multiple scenario comparison, and comprehensive capability metrics.

## Commands

**Development:**
```bash
npm run dev       # Start Vite dev server (http://localhost:3000)
npm run build     # Production build (outputs to dist/)
npm run preview   # Preview production build
```

**Testing:**
```bash
npm test          # Run Vitest tests
npm test:ui       # Run Vitest with UI
npm run lint      # Run ESLint
```

## Architecture

### Layout Structure
The application uses a **two-column responsive layout** with a 40/60 split:

**Left Column (40% width - `lg={4.8}`):**
- Split into 2 sub-columns using nested Grid
- Left sub-column: Distribution Controls, Spec Limit Controls
- Right sub-column: Display Controls, Scenario Manager
- Bottom (full width): Import Data and View Advanced Stats buttons
- Vertical scrolling enabled when content overflows

**Right Column (60% width - `lg={7.2}`):**
- Uses flexbox (`display: 'flex', flexDirection: 'column'`)
- Chart container: `flex: '1 1 auto'` (grows to fill available space)
- Stats container: `flex: '0 0 auto'` (fixed height)
- Together, Chart + Stats fill exactly 100% of viewport height without overflow
- Chart dynamically sizes based on container dimensions (`container.clientHeight`)

**Header:**
- Fixed height with title and preset menu

### File Structure
```
src/
├── main.tsx              →  React app entry point
├── App.tsx               →  Main 2-column layout
├── theme.ts              →  MUI theme configuration
├── types.ts              →  TypeScript type definitions
├── context/
│   └── AppContext.tsx    →  Global state management (Context + useReducer)
├── components/
│   ├── Chart.tsx         →  Canvas-based chart with draggable limits
│   ├── DistributionControls.tsx
│   ├── SpecLimitControls.tsx
│   ├── DisplayControls.tsx
│   ├── StatsDisplay.tsx
│   ├── AdvancedStatsDialog.tsx
│   ├── DataImportDialog.tsx
│   ├── ScenarioManager.tsx
│   ├── PresetsMenu.tsx
│   └── ExportMenu.tsx
└── utils/
    ├── stats.ts          →  Pure statistical functions
    ├── rendering.ts      →  Canvas rendering utilities
    ├── viewport.ts       →  Hybrid auto-viewport calculations
    └── presets.ts        →  Preset configurations & URL state
```

### Key Architectural Patterns

- **State Management**: Uses React Context + useReducer for global state. All state updates flow through typed actions in `AppContext.tsx`.

- **Pure Statistical Functions**: `stats.ts` contains all capability calculations (Cp, Cpk, Pp, Ppk, DPMO, Sigma Level, Cpm) as pure functions with no side effects.

- **Canvas Rendering**: `Chart.tsx` manages a canvas with devicePixelRatio scaling. Rendering logic is isolated in `rendering.ts` for testability.

- **MUI Theme**: Custom theme in `theme.ts` preserves the original color palette (good/warn/bad for capability indices).

## Core Features

### 1. Real-Time Capability Calculations
- **Basic**: Cp, Cpk, % outside/inside/above/below
- **Advanced**: Pp, Ppk, DPMO, Sigma Level, Cpm (Taguchi index)
- All metrics update live as inputs change
- Color-coded capability indicators (green ≥1.33, yellow 1.0-1.33, red <1.0)

### 2. Enhanced Interactive Chart
- **Drag LSL/USL lines** directly on canvas with hover cursor feedback
- **Z-scores and percentages** displayed near each spec limit
- **Shaded regions**:
  - Green/neutral shading for in-spec area (8% opacity)
  - Red striped pattern for out-of-spec areas (6% opacity, subtle, non-distracting)
- **Legend**: Automatic multi-scenario legend when comparing distributions
  - Positioned top-right with semi-transparent backdrop
  - Avoids overlapping chart data
- **Histogram overlay**: When data is imported, histogram bars render at 30% opacity grey to remain visible while not obscuring curves
- **Hint text**: "Scroll to zoom • Drag to pan" reminder (functionality stub for future zoom/pan)
- DevicePixelRatio scaling for crisp rendering
- Secondary top axis showing ±1σ to ±6σ markers

### 3. Collapsible Accordion Controls
- **All left-panel sections** now use Material-UI Accordions (defaultExpanded on desktop)
- **Tooltips**: Help icons (?) next to section titles and individual controls explaining:
  - What each parameter controls
  - Impact on capability metrics
- **Enhanced inputs**:
  - Numeric text fields with steppers synced to sliders
  - Live validation with inline error messages
  - Helper text showing step size (e.g., "step: 0.01")
  - Clamping to safe ranges (-100 to 100 for mean, >0 for std, LSL < USL)

### 4. Display Controls with Hybrid Auto-Viewport
- **Auto Range toggle**: Automatically calculates optimal viewport using hybrid algorithm
  - Formula: `displayMin = min(μ-6σ, padded_LSL)`, `displayMax = max(μ+6σ, padded_USL)`
  - Sign-aware padding: expands outward 10% from spec limits (inward for opposite-sign limits)
  - Applies on: parameter changes, preset load, data import, Reset Zoom
  - Helper text: "Auto uses max(μ±6σ, LSL−10% / USL+10%)"
- **Manual override**: Disable auto-range to set custom min/max viewport
- **Reset Zoom button**: Returns to hybrid auto-range mode
- **Tick spacing**: Auto or manual step size for axis marks
- **Grid toggle**: Show/hide vertical grid lines
- **Fit to mean**: Override auto-range to show μ ± Nσ (configurable N multiplier)

### 5. Data Import with Preview
- **Paste or upload** comma/newline-separated values
- **Preview panel** before import showing:
  - Sample size (n), mean, std dev, min, max
  - Count of ignored/invalid values
- **"Load Example Data" button** generates realistic normal data (n=100, μ=10, σ=2)
- **Import button** shows count: "Import 100 data points"
- Automatically calculates mean/std and overlays histogram on chart

### 6. Scenario Comparison (Enhanced UI)
- **Card-based layout** with color-coded left border
- Each scenario card shows:
  - Name, μ, σ, LSL, USL
  - Live Cp and Cpk chips
- **Focus control**: Radio button icon to drive main capability metrics display
  - Focused scenario's metrics shown in StatsDisplay with color chip indicator
  - Unfocused: primary distribution metrics shown (default)
- **Actions**: Focus toggle, Visibility toggle (eye icon), Duplicate, Delete
- **Drag handle icon** for visual reorder affordance (drag functionality TBD)
- **Accordion with smart expand**: Collapses when empty, expands when scenarios exist

### 7. Preset Menu with Previews
- **Enhanced dropdown** with:
  - Active preset indicator (checkmark icon)
  - Preview chips showing Cp, Cpk, σ for each preset
  - Hover/active states for better interactivity
- **Toast notification**: "Preset '{name}' loaded successfully" on selection
- 5 preset configurations: Six Sigma, Tight Tolerance, Off-Center, Minimum Capability, Wide Tolerance

### 8. Advanced Stats Dialog
- **Search/filter box** at top to filter metrics by keyword
- **Quick navigation chips**: Jump to Basic, Performance, Six Sigma, Taguchi sections
- **"So what?" helper text** under each metric explaining practical implications
- Improved descriptions focusing on actionable insights

### 9. Export Options (Enhanced)
- **PNG**: High-resolution chart image (1200x600)
- **CSV**: Spreadsheet-ready metrics (all Cp, Cpk, Pp, Ppk, DPMO, etc.)
- **JSON**: Full configuration + metrics for all scenarios (timestamp, distribution params, computed stats)
- Export FAB has tooltip: "Export chart/metrics"

### 10. Responsive Layout & Mobile Support
- **Collapse left panel button** (chevron icon) for full-width chart mode on desktop
- **Mobile drawer**: Left controls slide in from left on mobile/tablet
  - Hamburger menu icon in header
  - 85% screen width, max 400px
  - Auto-closes after opening Import/Stats dialogs
- **Expand button**: Floating button on left edge when panel collapsed
- Fully responsive grid system maintains 40/60 split on desktop, full-width on mobile

### 11. Accessibility Enhancements
- **ARIA labels** on all interactive controls, including:
  - All help icon buttons with descriptive labels
  - Scenario action buttons (focus, visibility, duplicate, delete)
  - Display control toggles
- **Keyboard navigable**: Sliders, inputs, buttons, tooltips
- **Tooltips accessible** via keyboard focus
- **Screen reader friendly**: Proper semantic HTML and labels

## Testing

**Test Files:**
- `src/utils/stats.test.ts` - Unit tests for all statistical functions using Vitest
  - Tests cover: basic calculations, edge cases (std=0, inverted limits), advanced metrics
- `src/utils/viewport.test.ts` - Unit tests for hybrid viewport calculations
  - Tests cover: sign-aware padding, edge cases, multipliers, asymmetric distributions

**Running Tests:**
```bash
npm test                    # Watch mode
npm test -- --run          # Single run
npm test:ui                # Interactive UI
```

All tests pass (29 tests total as of latest commit).

## Development Workflow

1. **Making Changes to Stats Logic**: Update `src/utils/stats.ts` and add corresponding tests in `stats.test.ts`

2. **Adding New Components**: Place in `src/components/`, import MUI components, use `useApp()` hook to access state

3. **State Updates**: Dispatch typed actions via `AppContext` (see `types.ts` for all action types)

4. **Canvas Changes**: Modify `src/utils/rendering.ts`, test with different display settings

## CI/CD

GitHub Actions workflow (`.github/workflows/ci.yml`) runs on push/PR:
- Install dependencies
- Run linter
- Type check with TypeScript
- Run tests
- Build production bundle

## Default Values

- Mean: 0, Std: 1
- LSL: -3.0, USL: 3.0
- Display window: Auto-range enabled (computed by hybrid viewport)
- Grid: enabled
- Fit-to-mean: disabled
- Focused scenario: none (primary distribution drives metrics)

## Key Dependencies

- **React 18** - UI framework
- **Material-UI v5** - Component library
- **Vite** - Build tool & dev server
- **TypeScript** - Type safety
- **Vitest** - Testing framework
