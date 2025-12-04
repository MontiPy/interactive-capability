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

### Tab-Based Navigation
The application uses a **tab-based navigation system** with two distinct modes:

**Tab 1: Single Distribution** - Testing and analyzing one distribution
- Focus on primary distribution parameters
- Controls for μ, σ, LSL, USL
- Import data affects primary distribution
- Chart shows only the primary distribution
- "Add to Comparison" button to create scenarios

**Tab 2: Scenario Comparison** - Comparing multiple distributions
- Full-view Scenario Manager with inline editing
- Chart shows all visible scenarios (primary hidden)
- Multi-distribution viewport adjusts to show all scenarios
- Comparison stats table when no scenario focused
- Import data creates new scenarios

### Layout Structure
The application uses a **two-column responsive layout** with a 40/60 split:

**Header:**
- Title and Tab Navigation (on desktop)
- PresetsMenu on the right
- Mobile: Hamburger menu to open drawer

**Left Column (40% width - `lg={4.8}`):**
Content changes based on active tab:
- **Single Tab**: Distribution Controls, Spec Limit Controls, Display Controls, Import Data, Advanced Stats, Add to Comparison
- **Comparison Tab**: Enhanced Scenario Manager (fullView mode), Add New Scenario, Import Data as Scenario, Advanced Stats
- Vertical scrolling enabled when content overflows

**Right Column (60% width - `lg={7.2}`):**
- Uses flexbox (`display: 'flex', flexDirection: 'column'`)
- Chart container: `flex: '1 1 auto'` (grows to fill available space)
  - Filters scenarios based on activeTab
  - Single tab: Shows only primary distribution
  - Comparison tab: Shows all visible scenarios
- Stats container: `flex: '0 0 auto'` (fixed height)
  - Single tab or focused scenario: Shows individual metrics
  - Comparison tab (unfocused): Shows comparison table
- Together, Chart + Stats fill exactly 100% of viewport height without overflow
- Chart dynamically sizes based on container dimensions (`container.clientHeight`)

### File Structure
```
src/
├── main.tsx              →  React app entry point
├── App.tsx               →  Main layout with tab integration
├── theme.ts              →  MUI theme configuration
├── types.ts              →  TypeScript type definitions (includes activeTab state)
├── context/
│   └── AppContext.tsx    →  Global state management (Context + useReducer)
├── components/
│   ├── TabNavigation.tsx           →  Tab navigation component (new)
│   ├── SingleDistributionPanel.tsx →  Single distribution tab content (new)
│   ├── ComparisonPanel.tsx         →  Scenario comparison tab content (new)
│   ├── ComparisonStatsTable.tsx    →  Multi-scenario comparison table (new)
│   ├── Chart.tsx                   →  Canvas-based chart (filters by activeTab)
│   ├── StatsDisplay.tsx            →  Stats display with comparison mode
│   ├── ScenarioManager.tsx         →  Enhanced with fullView & inline editing
│   ├── DistributionControls.tsx
│   ├── SpecLimitControls.tsx
│   ├── DisplayControls.tsx
│   ├── AdvancedStatsDialog.tsx
│   ├── DataImportDialog.tsx
│   ├── PresetsMenu.tsx
│   └── ExportMenu.tsx
└── utils/
    ├── stats.ts          →  Pure statistical functions
    ├── rendering.ts      →  Canvas rendering utilities
    ├── viewport.ts       →  Hybrid + multi-distribution viewport calculations
    └── presets.ts        →  Preset configurations & URL state
```

### Key Architectural Patterns

- **Tab-Based Architecture**: Two distinct modes (Single Distribution and Scenario Comparison) with separate workflows and UI components.

- **State Management**: Uses React Context + useReducer for global state. All state updates flow through typed actions in `AppContext.tsx`. New `activeTab` state controls which mode is active.

- **Multi-Distribution Viewport**: `computeMultiDistributionViewport()` in `viewport.ts` calculates optimal viewport bounds across all visible scenarios in comparison mode.

- **Pure Statistical Functions**: `stats.ts` contains all capability calculations (Cp, Cpk, Pp, Ppk, DPMO, Sigma Level, Cpm) as pure functions with no side effects.

- **Canvas Rendering**: `Chart.tsx` manages a canvas with devicePixelRatio scaling. Rendering logic is isolated in `rendering.ts` for testability. Scenarios are filtered based on `activeTab`. Primary distribution (curve, mean line, sigma label) is conditionally rendered only in Single Distribution mode via `showPrimary` parameter. Shading is conditionally enabled only in Single Distribution mode. Legend dynamically shows only relevant distributions. Improved render cycle prevents artifacts and unnecessary re-renders. Edge-specific fix: Every render uses `canvas.width = canvas.width` reset technique within `requestAnimationFrame` to completely clear canvas state, ensuring Edge matches Chrome's rendering behavior.

- **MUI Theme**: Custom theme in `theme.ts` preserves the original color palette (good/warn/bad for capability indices).

## Core Features

### 1. Real-Time Capability Calculations
- **Basic**: Cp, Cpk, % outside/inside/above/below
- **Advanced**: Pp, Ppk, DPMO, Sigma Level, Cpm (Taguchi index)
- All metrics update live as inputs change
- Color-coded capability indicators (green ≥1.33, yellow 1.0-1.33, red <1.0)

### 2. Enhanced Interactive Chart
- **Context-aware rendering**:
  - **Single Distribution tab**: Shows primary distribution with full annotations
    - Primary curve, mean line, and sigma label
    - Primary LSL/USL lines with z-scores and percentages
    - ±1σ to ±6σ markers on top axis
    - Shaded regions (green for in-spec, red striped for out-of-spec)
    - Draggable LSL/USL lines with hover cursor feedback
  - **Scenario Comparison tab**: Clean comparison view with only scenario distributions
    - NO primary distribution curve, markers, or LSL/USL lines
    - Color-coded LSL/USL lines for each visible scenario (matched to distribution color)
    - Each scenario's LSL/USL shown with small labels at top
    - NO sigma markers or shading
    - NO dragging functionality (scenarios edited via inline editing)
    - Only scenario curves with legend and their individual spec limits
- **Legend**: Automatic legend showing only visible distributions
  - Shows "Primary" only in Single Distribution tab
  - Shows scenario names with color swatches in Scenario Comparison tab
  - Positioned top-right with semi-transparent backdrop
  - Avoids overlapping chart data
- **Histogram overlay**: When data is imported, histogram bars render at 30% opacity grey to remain visible while not obscuring curves
- **Explicit canvas clearing**: Prevents rendering artifacts when switching tabs or updating parameters
- **Cross-browser compatibility**: Dedicated Edge fix using `canvas.width = canvas.width` reset technique to handle browser-specific canvas state caching
- DevicePixelRatio scaling for crisp rendering

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

### 5. Tab Navigation System
- **Two-tab interface** for distinct workflows:
  - **Single Distribution**: Focused analysis of primary distribution
  - **Scenario Comparison**: Side-by-side comparison of multiple distributions
- **Badge indicator**: Shows number of scenarios on comparison tab
- **Responsive design**: Scrollable tabs on mobile, standard tabs on desktop
- **State preservation**: All settings and scenarios persist when switching tabs

### 6. Data Import with Context-Aware Behavior
- **Single Distribution Tab**:
  - **Paste or upload** comma/newline-separated values
  - **Preview panel** before import showing:
    - Sample size (n), mean, std dev, min, max
    - Count of ignored/invalid values
  - **"Load Example Data" button** generates realistic normal data (n=100, μ=10, σ=2)
  - Automatically calculates mean/std and overlays histogram on chart
- **Scenario Comparison Tab**:
  - Import creates a new scenario with calculated μ and σ
  - Name field for scenario identification
  - Auto-names to "Imported Scenario N" if blank

### 7. Scenario Comparison (Enhanced with Tab Integration)
- **Add New Scenario**: Create scenarios directly in comparison tab with default parameters (μ=0, σ=1, LSL=-3, USL=3)
  - Available in both empty state and when scenarios exist
  - Parameters immediately editable via inline editing
- **Full-view mode in comparison tab**: Expanded cards with inline editing
- **Inline editing**: Click Edit to modify μ, σ, LSL, USL directly in cards
  - TextField controls with validation
  - Save/Cancel buttons
  - Real-time capability metric updates
- **Card-based layout** with color-coded left border
- Each scenario card shows:
  - Name, μ, σ, LSL, USL
  - Live Cp and Cpk chips
- **Focus control**: Radio button icon to drive main capability metrics display
  - Focused scenario's metrics shown in StatsDisplay with color chip indicator
  - Unfocused: primary distribution metrics shown (default)
- **Actions**: Focus toggle, Visibility toggle (eye icon), Edit (in fullView), Duplicate, Delete
- **Drag handle icon** for visual reorder affordance (drag functionality TBD)
- **Accordion with smart expand**: Collapses when empty, expands when scenarios exist (Single tab)
- **Empty state**: Helpful message with "Add New Scenario" button and "Go to Single Distribution" option

### 8. Comparison Stats Table
- **Automatic display**: Shows in comparison tab when no scenario is focused
- **Comprehensive metrics**: μ, σ, LSL, USL, Cp, Cpk, Pp, Ppk for all visible scenarios
- **Color-coded borders**: Matches scenario card colors
- **Interactive rows**: Click to focus a scenario
  - Focused row highlighted with selected background
  - Focus icon indicator (radio button with opacity)
- **Color-coded capability metrics**: Green (≥1.33), Yellow (1.0-1.33), Red (<1.0)
- **Empty state**: Shows message when no visible scenarios

### 9. Preset Menu with Previews
- **Enhanced dropdown** with:
  - Active preset indicator (checkmark icon)
  - Preview chips showing Cp, Cpk, σ for each preset
  - Hover/active states for better interactivity
- **Toast notification**: "Preset '{name}' loaded successfully" on selection
- 5 preset configurations: Six Sigma, Tight Tolerance, Off-Center, Minimum Capability, Wide Tolerance

### 10. Advanced Stats Dialog
- **Search/filter box** at top to filter metrics by keyword
- **Quick navigation chips**: Jump to Basic, Performance, Six Sigma, Taguchi sections
- **"So what?" helper text** under each metric explaining practical implications
- Improved descriptions focusing on actionable insights

### 11. Export Options (Enhanced)
- **PNG**: High-resolution chart image (1200x600)
- **CSV**: Spreadsheet-ready metrics (all Cp, Cpk, Pp, Ppk, DPMO, etc.)
- **JSON**: Full configuration + metrics for all scenarios (timestamp, distribution params, computed stats)
- Export FAB has tooltip: "Export chart/metrics"

### 12. Responsive Layout & Mobile Support
- **Collapse left panel button** (chevron icon) for full-width chart mode on desktop
- **Mobile drawer**: Left controls slide in from left on mobile/tablet
  - Hamburger menu icon in header
  - 85% screen width, max 400px
  - Auto-closes after opening Import/Stats dialogs
- **Expand button**: Floating button on left edge when panel collapsed
- Fully responsive grid system maintains 40/60 split on desktop, full-width on mobile

### 13. Accessibility Enhancements
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
- `src/utils/viewport.test.ts` - Unit tests for viewport calculations
  - Tests cover: sign-aware padding, edge cases, multipliers, asymmetric distributions
  - **NEW**: Multi-distribution viewport tests (9 new test cases)
    - Single scenario, overlapping ranges, distant ranges
    - Hidden scenarios, mixed distributions, wide spec limits

**Running Tests:**
```bash
npm test                    # Watch mode
npm test -- --run          # Single run
npm test:ui                # Interactive UI
```

All tests pass (38 tests total, including 9 new multi-distribution viewport tests).

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

- **Active Tab**: 'single' (Single Distribution mode)
- Mean: 0, Std: 1
- LSL: -3.0, USL: 3.0
- Display window: Auto-range enabled (computed by hybrid viewport in single mode, multi-distribution viewport in comparison mode)
- Grid: enabled
- Fit-to-mean: disabled
- Focused scenario: none (primary distribution drives metrics in single tab, comparison table in comparison tab)
- Scenarios: empty array []

## Key Dependencies

- **React 18** - UI framework
- **Material-UI v5** - Component library
- **Vite** - Build tool & dev server
- **TypeScript** - Type safety
- **Vitest** - Testing framework
