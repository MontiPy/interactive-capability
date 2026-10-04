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
- "Save as Scenario for Comparison" button to create scenarios

**Tab 2: Scenario Comparison** - Comparing multiple distributions
- Full-view Scenario Manager with inline editing
- Scrollable scenario list with sticky action buttons at bottom
- Chart shows all visible scenarios (primary hidden)
- Multi-distribution viewport adjusts to show all scenarios
- Comparison stats table when no scenario focused
- Import data creates new scenarios

### Layout Structure
The application uses a **fixed-width sidebar + fluid main area** (`Layout.tsx`, flexbox, no Grid):

**Header:**
- Logo mark, title (full title ≥ lg, hidden md–lg, short "Cp/Cpk Playground" on phones) and Tab Navigation (md+)
- Undo / Redo / Reset / dark-mode toggle, then PresetsMenu (single tab)
- Phones: a second sticky row holds the tabs (short labels) and a compact "Presets" button

**Sidebar (340px md, 380px lg):**
- Panel header row ("Process & Specs" / "Scenarios") with a collapse chevron; collapsing leaves a 48px rail with an expand button
- **Single Tab**: Process Distribution, Specification Limits, Chart Display (collapsed by default), then a sticky footer with "Save as Scenario for Comparison" and "Import Measurement Data"
- **Comparison Tab**: Scenario Manager (fullView) with a sticky footer: Add Blank Scenario, Preset, Import Data
- Scrolls independently; footers are sticky only on md+

**Phones (< md):** no sidebar or drawer. The page scrolls: chart (fixed height), metrics, then the same controls inline.

**Main area:**
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
├── theme.ts              →  Light/dark MUI themes, chart colors, capability thresholds
├── types.ts              →  TypeScript type definitions (includes activeTab state)
├── context/
│   ├── appReducer.ts     →  Pure reducer + undo/redo history (unit tested)
│   ├── AppContext.tsx    →  Provider: initial load (session + URL), persistence, URL sync
│   ├── ColorModeContext.tsx → Theme provider with light/dark toggle
│   └── NotifyContext.tsx →  Toasts with optional Undo action
├── hooks/
│   ├── useCapabilitySubject.ts → Focused scenario or primary distribution being reported
│   └── useKeyboardShortcuts.ts → Ctrl/⌘+Z undo, Ctrl/⌘+Shift+Z / Ctrl+Y redo
├── components/
│   ├── TabNavigation.tsx           →  Tab navigation component
│   ├── ParameterField.tsx          →  Shared slider + numeric input row
│   ├── SingleDistributionPanel.tsx →  Single distribution tab content
│   ├── ComparisonPanel.tsx         →  Scenario comparison tab content
│   ├── ComparisonStatsTable.tsx    →  Multi-scenario comparison table
│   ├── Chart.tsx                   →  Canvas-based chart (filters by activeTab)
│   ├── StatsDisplay.tsx            →  Stats display with comparison mode
│   ├── ScenarioManager.tsx         →  Enhanced with fullView & inline editing & goal seek
│   ├── PresetScenarioDialog.tsx    →  Load presets as scenarios
│   ├── GoalSeekDialog.tsx          →  Goal seek UI for target Cpk optimization (new)
│   ├── DistributionControls.tsx
│   ├── SpecLimitControls.tsx
│   ├── DisplayControls.tsx
│   ├── AdvancedStatsDialog.tsx
│   ├── DataImportDialog.tsx
│   ├── PresetsMenu.tsx
│   ├── ExportMenu.tsx
│   └── Layout.tsx                  →  Main layout with responsive controls
└── utils/
    ├── stats.ts          →  Pure statistical functions (capability, CIs, normality, parsing)
    ├── goalSeek.ts       →  Goal seek algorithms for Cpk optimization
    ├── rendering.ts      →  Canvas rendering utilities
    ├── viewport.ts       →  Hybrid + multi-distribution viewport calculations
    ├── persistence.ts    →  localStorage session + share-link encode/decode (validated)
    ├── exportData.ts     →  CSV / JSON export builders
    ├── format.ts         →  Number formatting, nice steps, process-scaled slider ranges
    ├── colors.ts         →  Scenario palette + next free color
    └── presets.ts        →  Preset configurations
```

### Key Architectural Patterns

- **Tab-Based Architecture**: Two distinct modes (Single Distribution and Scenario Comparison) with separate workflows and UI components.

- **State Management**: Uses React Context + useReducer for global state. All state updates flow through typed actions handled by `appReducer` in `context/appReducer.ts`. `historyReducer` wraps it with undo/redo: actions in the `UNDOABLE` set push a snapshot; repeated edits of the same field within 800 ms (and whole spec-limit drags) coalesce into one step. View settings (`display`) are not undoable and survive undo. Add any new data-changing action to `UNDOABLE`.

- **Persistence**: `AppContext` loads defaults → saved session (localStorage) → URL params (a shared link wins). The session is saved (debounced) on every change, and the primary distribution is mirrored to the query string with `history.replaceState` (no history spam). Everything read back is validated in `persistence.ts`. The share link (`Export → Copy Share Link`) encodes scenarios as base64url JSON in `sc=`.

- **Within vs overall σ**: With imported data, `std` is the within-subgroup σ (MR̄ / 1.128) used for Cp/Cpk, and `histogramData.overallStd` (sample σ) is used for Pp/Ppk. Imported scenarios carry `overallStd` and `sampleSize`. Without data, Pp/Ppk equal Cp/Cpk.

- **Multi-Distribution Viewport**: `computeMultiDistributionViewport()` in `viewport.ts` calculates optimal viewport bounds across all visible scenarios in comparison mode.

- **Pure Statistical Functions**: `stats.ts` contains all capability calculations (Cp, Cpk, Pp, Ppk, DPMO, Sigma Level, Cpm) as pure functions with no side effects.

- **Canvas Rendering**: `Chart.tsx` manages a canvas with devicePixelRatio scaling, sized by a `ResizeObserver` (panel collapse resizes it too). Colors come from `getChartColors(mode)` so the chart follows dark mode; exports always use the light palette. Pointer events handle mouse and touch dragging; auto-range is paused during a drag so the line stays under the pointer. Rendering logic is isolated in `rendering.ts` for testability. Scenarios are filtered based on `activeTab`. Primary distribution (curve, mean line, sigma label) is conditionally rendered only in Single Distribution mode via `showPrimary` parameter. Shading is conditionally enabled only in Single Distribution mode. Legend dynamically shows only relevant distributions. Improved render cycle prevents artifacts and unnecessary re-renders. Edge-specific fix: Every render uses `canvas.width = canvas.width` reset technique within `requestAnimationFrame` to completely clear canvas state, ensuring Edge matches Chrome's rendering behavior.

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
- **Histogram overlay**: When data is imported, histogram bars render as probability densities (count ÷ (n × bin width)) at 30% opacity, so they line up with the pdf. A dashed curve shows the overall-σ fit when it differs from the within-σ fit.
- **Hover readout**: Crosshair with x, z-score and % below / above for the primary (or each visible scenario)
- **Target marker**: Triangle on the axis when a Cpm target is set
- **Explicit canvas clearing**: Prevents rendering artifacts when switching tabs or updating parameters
- **Cross-browser compatibility**: Dedicated Edge fix using `canvas.width = canvas.width` reset technique to handle browser-specific canvas state caching
- DevicePixelRatio scaling for crisp rendering

### 3. Collapsible Accordion Controls
- **Sidebar sections** use outlined MUI Accordions (styled globally in `theme.ts`)
- **`ParameterField`** is the shared control row: label + help tooltip, then slider and numeric field (with a μ / σ / LSL / USL prefix)
  - Slider ranges and steps scale with the process (`format.ts`)
  - Typing commits valid values immediately; invalid input shows an inline error and reverts on blur
  - σ > 0 and LSL < USL are enforced; sliders cannot cross the other limit
- Spec section shows tolerance width and midpoint

### 4. Display Controls with Hybrid Auto-Viewport
- **Auto Range toggle**: Automatically calculates optimal viewport using hybrid algorithm
  - Formula: `displayMin = min(μ-6σ, LSL - pad)`, `displayMax = max(μ+6σ, USL + pad)` with `pad = 10% × (USL − LSL)`, also widened to include imported data min/max
  - Tolerance-relative padding works for offset processes (e.g. μ = 250.02 with a 0.08 tolerance)
  - Applies on: parameter changes, preset load, data import, Reset Zoom
  - Helper text: "Auto fits μ±6σ and the spec limits (+10% of the tolerance)"
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
- **Input**: paste, file picker, or drag-and-drop (comma / semicolon / whitespace / newline separated; headers counted as ignored tokens)
- **Live preview**: n, mean, range, σ overall, σ within, Anderson–Darling p-value
- **Warnings**: non-normal data (p < 0.05), overall σ ≫ within σ (drift or unordered data), mean outside the chosen spec limits
- **Spec limits** fields (prefilled with the current limits) are applied with the import
- **"Load example data"** generates n=100 from N(10, 2)
- **Single Distribution Tab**: sets μ (mean), σ (within) and overlays the histogram
- **Scenario Comparison Tab**: creates a new scenario (name field; defaults to "Imported Scenario N")

### 7. Scenario Comparison (Enhanced with Tab Integration)
- **Add New Scenario**: Create scenarios directly in comparison tab with default parameters (μ=0, σ=1, LSL=-3, USL=3)
  - Available in both empty state and when scenarios exist
  - Parameters immediately editable via inline editing
- **Full-view mode in comparison tab**: Expanded cards with inline editing
  - Scrollable scenario list with sticky action buttons at bottom
  - Action buttons always visible regardless of number of scenarios
  - Includes: Add Blank Scenario, Load Preset as Scenario, Import Data as Scenario
- **Load Preset as Scenario**: Dialog to select from predefined presets and add as scenarios
  - Shows all 5 presets with descriptions and preview metrics (Cp, Cpk, σ)
  - Each preset becomes a new scenario with preset name
  - "Load Preset" button in header hidden on comparison tab
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
- **Actions**: Edit, Focus toggle and Visibility (eye icon) inline; Goal seek, Duplicate and Delete in a "More actions" (⋮) menu
- Cp/Cpk chips are colour-coded; the focused card gets a primary-colour ring
- **Move up / down** buttons reorder scenarios (undoable)
- **Accordion with smart expand**: Collapses when empty, expands when scenarios exist (Single tab)
- **Empty state**: Helpful message with "Add New Scenario" button and "Go to Single Distribution" option

### 8. Goal Seek Optimization
- **Target Cpk specification**: Input desired capability index (e.g., 1.33 for good capability)
- **Dual adjustment modes**:
  - **Adjust Mean (μ)**: Recenter process while keeping variation constant
  - **Adjust Standard Deviation (σ)**: Reduce variation while keeping mean constant
- **Real-time preview**: See calculated values before applying
  - Green success box with new μ/σ values
  - Delta indicators showing change from current (e.g., "Δ-0.250")
  - Achieved Cpk display
- **Feasibility checking**: Clear error messages when target unachievable
- **Fallback suggestions**: Show best achievable Cpk when target impossible
  - Displays centered mean with maximum achievable Cpk
  - Shows required parameters if target too high for current constraints
- **Visual feedback**: Color-coded preview (green for success, red Alert for errors)
- **Integration**: "Goal seek…" in a scenario card's ⋮ menu (Comparison tab)
- Preview shows before → after for the adjusted parameter and the achieved Cpk (colour-coded)
- **Mathematical approach**: Closed-form analytical solutions (no iterative methods)
  - Fast execution (<1ms)
  - Deterministic results
  - Comprehensive input validation (positive Cpk, valid std, LSL < USL)

### 9. Comparison Stats Table
- **Automatic display**: Shows in comparison tab when no scenario is focused
- **Comprehensive metrics**: μ, σ, LSL, USL, Cp, Cpk, Pp, Ppk for all visible scenarios
- **Color-coded borders**: Matches scenario card colors
- **Interactive rows**: Click to focus a scenario
  - Focused row highlighted with selected background
  - Focus icon indicator (radio button with opacity)
- **Color-coded capability metrics**: Green (≥1.33), Yellow (1.0-1.33), Red (<1.0)
- **Empty state**: Shows message when no visible scenarios

### 10. Preset Menu with Previews
- **Enhanced dropdown** with:
  - Active preset indicator (checkmark icon)
  - Preview chips showing Cp, Cpk, σ for each preset
  - Hover/active states for better interactivity
- **Toast notification** with an Undo button on selection
- 5 preset configurations: Six Sigma, Tight Tolerance, Off-Center, Minimum Capability, Wide Tolerance

### 11. Advanced Stats Dialog
- **Search/filter box** at top to filter metrics by keyword
- **Quick navigation chips**: Jump to Basic, Performance, Six Sigma, Taguchi sections
- **"So what?" helper text** under each metric explaining practical implications
- Improved descriptions focusing on actionable insights

### 12. Export Options (Enhanced)
- **PNG**: 1200×600 at 2× scale, matching the active tab (light palette)
- **CSV**: Metric/Value sheet (with CIs and normality when data is imported) in single mode; one row per scenario in comparison mode. Fields are RFC 4180-escaped and formula-neutralised.
- **JSON**: Full configuration + metrics for primary, imported-data summary and all scenarios
- **Copy Share Link**: URL reproducing the primary distribution and all scenarios
- Export button sits next to the metrics (and on the comparison table)

### 13. Responsive Layout & Mobile Support
- **Collapse panel** (chevron in the sidebar header) for a full-width chart; a slim rail holds the expand button
- **Phones**: controls render inline below the metrics (no hidden drawer); header and tabs stay sticky
- Comparison table keeps the scenario name column sticky and lists capability columns first so they stay visible on narrow screens

### 14. Capability Metrics Panel
- Cards: Cp, Cpk (with 95% CIs when n is known), Pp/Ppk (when overall σ is known), Cpm (when a target is set), PPM out (↓ below · ↑ above), Yield
- Verdict chip (Capable / Marginal / Not capable) and a one-line recommendation (re-centre vs reduce σ, with the required σ)
- **Details** opens the Advanced Stats dialog for the focused scenario or primary: CPU/CPL, Pp/Ppk, PPM split, Z.bench, sigma level, Cpm target, imported-data diagnostics

### 15. Notifications
- `NotifyContext` provides `useNotify()` for app-wide toasts (bottom-centre)
- Pass `{ undoable: true }` to add an **Undo** button (used for delete scenario, reset, preset load, save as scenario, import / remove data)

### 16. Undo/Redo, Persistence, Dark Mode
- Header buttons: Undo, Redo, Reset (undoable), light/dark toggle; keyboard shortcuts outside text fields
- Session restored on reload; dark mode follows the OS until toggled (stored separately)
- On phones the tabs move to a second header row with short labels ("Single" / "Compare")

### 17. Accessibility Enhancements
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
  - Far-tail accuracy, inverse normal, Z.bench/sigma level, moving-range σ, Cp/Cpk CIs, Anderson–Darling, histogram robustness, parsing
- `src/context/appReducer.test.ts` - Reducer behaviour and undo/redo (coalescing, drags, redo stack, reset)
- `src/utils/persistence.test.ts` - Session round-trip, validation of untrusted input, share-link round-trip
- `src/utils/exportData.test.ts` - CSV escaping/injection, single vs comparison CSV, JSON
- `src/utils/format.test.ts` - Percent/PPM formatting, nice steps, tick labels, slider ranges
- `src/utils/viewport.test.ts` - Unit tests for viewport calculations
  - Tests cover: tolerance-relative padding, offset processes, edge cases, multipliers, asymmetric distributions
  - Multi-distribution viewport tests (9 test cases)
    - Single scenario, overlapping ranges, distant ranges
    - Hidden scenarios, mixed distributions, wide spec limits
- `src/utils/goalSeek.test.ts` - Unit tests for goal seek algorithms (28 test cases)
  - solveForMean: symmetric/asymmetric limits, infeasible targets, validation (11 tests)
  - solveForStd: centered/off-center mean, boundary values, validation (12 tests)
  - Edge cases: extreme Cpk values, NaN/Infinity, fallback behavior (5 tests)

**Running Tests:**
```bash
npm test                    # Watch mode
npx vitest --run           # Single run
npm test:ui                # Interactive UI
```

All tests pass (128 tests).

## Development Workflow

1. **Making Changes to Stats Logic**: Update `src/utils/stats.ts` and add corresponding tests in `stats.test.ts`

2. **Adding New Components**: Place in `src/components/`, import MUI components, use `useApp()` hook to access state

3. **State Updates**: Dispatch typed actions via `AppContext` (see `types.ts` for all action types)

4. **Canvas Changes**: Modify `src/utils/rendering.ts`, test with different display settings

## CI/CD

GitHub Actions workflow (`.github/workflows/ci.yml`) runs on push/PR:
- Install dependencies (`npm ci` against the committed `package-lock.json`)
- Run linter (blocking, `--max-warnings 0`)
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
- Color mode: OS preference
- Session: restored from localStorage if present; URL parameters override

## Key Dependencies

- **React 18** - UI framework
- **Material-UI v5** - Component library
- **Vite** - Build tool & dev server
- **TypeScript** - Type safety
- **Vitest** - Testing framework
