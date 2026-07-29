# Project Code Review Guidelines

## Project Stack

- Vite
- React
- TypeScript
- Tailwind CSS
- React Router
- Axios
- React Hook Form
- Zod

## Review Priorities

Review the project from the following perspectives:

1. Correctness
2. React architecture
3. Component responsibility
4. TypeScript type safety
5. Maintainability
6. Performance
7. Accessibility
8. Testability

## Component Rules

- A page component should preferably remain under 300 lines.
- Files exceeding 400 lines must be reported.
- A component should have one primary responsibility.
- Reusable UI sections should be extracted into components.
- Business logic should not be mixed directly into presentation components.
- Repeated JSX appearing more than twice should be considered for extraction.
- Avoid deeply nested JSX.
- Avoid defining large child components in the same file.

## Hooks Rules

Consider extracting a custom hook when:

- A component contains multiple related useState declarations.
- useEffect contains API calls or complex synchronization logic.
- The same stateful behavior appears in multiple components.
- Form submission contains business rules.
- Filtering, sorting, pagination, or query-state logic is mixed into the UI.
- A component contains more than two substantial useEffect blocks.

Custom hooks must:

- Start with `use`.
- Have a clearly defined responsibility.
- Return a small and understandable public API.
- Avoid returning large unstructured objects.

## API Rules

- UI components must not define raw API URLs.
- API calls should be placed under `src/services` or `src/api`.
- Axios configuration should use a shared instance.
- Request and response types must be explicitly defined.
- Loading, error, success, and empty states must be handled.
- Do not silently swallow API errors.

## TypeScript Rules

- Avoid `any`.
- Prefer `unknown` when the type is not known.
- Do not duplicate API response interfaces.
- Props must have explicit types.
- Avoid unsafe type assertions.
- Use union types for finite states.
- Detect inconsistent optional and nullable fields.

## React Rules

- Check useEffect dependency arrays.
- Report state that can be derived instead of stored.
- Report unstable keys in list rendering.
- Do not use array indexes as keys when stable IDs exist.
- Report unnecessary useMemo or useCallback.
- Report avoidable re-renders.
- Do not mutate state directly.
- Event handlers should use meaningful names.

## Folder Responsibility

Expected structure:

src/
├── api/
├── components/
│ ├── common/
│ └── features/
├── hooks/
├── layouts/
├── pages/
├── routes/
├── schemas/
├── services/
├── types/
└── utils/

Report files that appear to be in the wrong layer.

## Tailwind Rules

- Report excessively long duplicated className values.
- Repeated visual patterns should be extracted into components.
- Avoid arbitrary values when a design token is available.
- Preserve responsive behavior.
- Check dark mode contrast and interactive states.

## Accessibility

Check for:

- Buttons implemented as div elements.
- Images without meaningful alt text.
- Inputs without labels.
- Click handlers without keyboard support.
- Missing focus states.
- Incorrect heading hierarchy.
- Modal focus and escape-key handling.

## Review Output Format

For every issue, provide:

- Severity: Critical, High, Medium, or Low
- File path
- Approximate line range
- Problem
- Why it matters
- Recommended change
- A concise code example when useful

Do not modify files during the initial review.

At the end, provide:

1. Architecture summary
2. Top five technical-debt items
3. Suggested refactoring order
4. Files exceeding 400 lines
5. Components that should be split
6. Logic that should become custom hooks
7. Missing tests

