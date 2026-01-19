# Repository Guidelines

## Project Structure & Module Organization
- `index.html` hosts the React app entry point.
- `src/` contains the React application code.
- `src/utils/stats.ts` contains pure statistical logic.
- `src/utils/rendering.ts` handles Canvas rendering.
- `src/components/` contains React components.

## Build, Test, and Development Commands
- `npm run dev`: starts Vite development server.
- `npm test`: runs Vitest tests.
- `npm run lint`: runs ESLint.

## Coding Style & Naming Conventions
- TypeScript uses two-space indentation.
- Use functional components and hooks.
- Keep statistical logic isolated in `src/utils/stats.ts`.
- Use Material-UI for UI components.

## Testing Guidelines
- Tests use Vitest.
- Unit tests for utils are in `src/utils/*.test.ts`.
- Component tests can be added as needed.

## Commit & Pull Request Guidelines
- Use concise, imperative present tense subjects.
- Reference issues or feature scopes in the first line.
- Pull requests should link related tickets and include test results.
