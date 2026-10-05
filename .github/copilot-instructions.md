# Repository Guidelines

See `CLAUDE.md` for the full architecture and feature reference. The essentials:

## Project Structure
- React 18 + TypeScript + MUI v5, built with Vite. Entry point: `src/main.tsx`.
- `src/utils/` holds pure, unit-tested logic: `stats.ts` (capability math, normality test,
  confidence intervals), `viewport.ts`, `goalSeek.ts`, `persistence.ts`, `exportData.ts`,
  `format.ts`, and the canvas renderer `rendering.ts`.
- `src/context/appReducer.ts` holds the reducer and undo/redo history; `AppContext.tsx` wires it
  to React and handles session persistence.
- `src/components/` holds the UI.

## Commands
- `npm run dev`: start the dev server on http://localhost:3000
- `npx vitest --run`: run the test suite once (`npm test` starts watch mode)
- `npm run lint` and `npx tsc --noEmit`: both must pass, because CI enforces them
- `npm run build`: production build into `dist/`

## Conventions
- Two-space indentation, single quotes, descriptive camelCase names.
- Keep statistics and other logic in `src/utils` as pure functions, with tests beside them
  (`*.test.ts`). Add tests whenever numeric behaviour changes.
- All state changes go through typed actions in `src/types.ts` → `appReducer.ts`. Add new
  data-changing actions to the `UNDOABLE` set.
- Commit messages: concise, imperative present tense (e.g. `feat: add Cpk confidence intervals`).
