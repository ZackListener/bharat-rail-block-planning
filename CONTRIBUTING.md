# Contributing

## Bharat Rail AI Block Planning System

Thank you for your interest in contributing to the Bharat Rail AI Block Planning System.

This project demonstrates an AI-assisted railway maintenance and block-planning workflow using React, TypeScript, Vite, Express, Leaflet, and Google Gemini.

## Code of Conduct

Contributors are expected to communicate respectfully and constructively.

Do not submit content that is abusive, discriminatory, malicious, or intended to compromise the application or its users.

## Before You Start

Make sure you have:

- Node.js 18+ recommended
- npm
- Git
- A code editor such as VS Code

Install dependencies:

```bash
npm install
```

Run the project:

```bash
npm run dev
```

## Project Structure

```text
src/
├── components/       # React UI components
├── data/             # Demonstration/mock data
├── utils/            # Shared helpers (e.g. date/time formatting & slot arithmetic)
├── App.tsx           # Main application
├── main.tsx          # React entry point
├── index.css         # Global styles (typography, theme tokens)
└── types.ts          # Shared TypeScript types

server.ts             # Express API + Vite development middleware
vite.config.ts        # Vite configuration
package.json          # Scripts and dependencies
```

Key components:

- `Sidebar.tsx` / `TopHeader.tsx` — navigation shell
- `DashboardView.tsx` — overview + live corridor map
- `SchedulesView.tsx` — single-block creation wizard, AI schedule generation, and hosts `BatchDepartmentRequests.tsx`
- `BatchDepartmentRequests.tsx` — queue-and-dispatch UI for creating multiple departments' blocks simultaneously
- `TimetableView.tsx` — Google Calendar–style weekly grid of all blocks
- `CorridorsView.tsx` — merged Corridors & Assets workspace
- `CorridorMap.tsx` — reusable Leaflet/OpenStreetMap corridor map used by the Dashboard and Corridors views
- `AiReschedulePage.tsx` — full-page (not modal) AI missed-block rescheduling flow
- `AiSimulationModal.tsx` — AI schedule *generation* simulation (distinct from rescheduling)
- `NewBlockModal.tsx` — single-block creation dialog (date/time are auto-assigned, not user-entered)
- `DefectsView.tsx` — defect register, with CSV/PDF export
- `ReportsView.tsx`, `SettingsView.tsx` — supporting views

## Design & Typography Conventions

- The interface uses a single sans-serif typeface (**Plus Jakarta Sans**) throughout, including headings, body copy, and exported/printed reports. Do not reintroduce serif fonts (e.g. Playfair Display) without a specific design decision to do so.
- The `font-serif` utility class still appears on many elements for historical reasons; it is intentionally overridden in `index.css` to render as sans-serif. Prefer omitting `font-serif` in new code rather than relying on the override.
- Preserve the existing color system (black/cream/gold editorial palette defined via CSS variables in `index.css`) unless the change specifically concerns the design.
- Use the shared helpers in `src/utils/time.ts` (`addHoursToTime`, `parseTimeToMinutes`, `getAutoScheduledDate`, `formatDateLong`, etc.) for any new date/time logic instead of re-implementing time arithmetic locally.

## Development Workflow

### 1. Create a branch

Use a descriptive branch name:

```bash
git checkout -b feature/ai-report-export
```

Examples:

```text
feature/new-block-validation
feature/dashboard-improvements
fix/ai-reschedule-error
docs/update-usage-guide
refactor/corridor-components
```

### 2. Make focused changes

Keep pull requests focused on one feature, fix, or documentation improvement.

Avoid mixing unrelated changes.

### 3. Run checks

Before submitting your work:

```bash
npm run lint
```

Build the project:

```bash
npm run build
```

Run the application:

```bash
npm run dev
```

Check the affected UI manually in the browser.

## React / TypeScript Guidelines

- Prefer functional React components.
- Use TypeScript types instead of `any` where practical.
- Keep reusable components in `src/components`.
- Keep shared data models in `src/types.ts`.
- Keep demonstration data in `src/data/mockData.ts`.
- Keep shared date/time and other cross-cutting logic in `src/utils/`.
- Avoid duplicating business logic across components — check `src/utils/` and existing components (e.g. `BatchDepartmentRequests.tsx`, `CorridorMap.tsx`) before adding a parallel implementation of similar functionality.
- Use clear, descriptive variable and function names.
- Keep components reasonably small and focused.
- Preserve the existing UI design and typography unless the change specifically concerns the design.

## Data Guidelines

The project currently uses mock data.

When adding sample records:

- Clearly identify them as demonstration data.
- Avoid using real private or sensitive railway information.
- Keep IDs and dates internally consistent.
- Update TypeScript types when introducing new fields.
- If adding a corridor node, include real approximate latitude/longitude so it renders correctly on the live map (`CorridorMap.tsx`).

Do not commit real operational data, credentials, personal information, or confidential railway information.

## AI Feature Guidelines

AI-generated railway recommendations are safety-sensitive.

Contributors must:

- Treat AI output as decision support.
- Never represent generated recommendations as verified operational instructions.
- Keep human review in the workflow.
- Avoid claiming that mock data represents live railway traffic.
- Clearly document changes to AI prompts, response schemas, and fallback behavior.
- Validate structured AI responses before using them in the UI.

If modifying the AI API, preserve the structured response contract unless the frontend is updated at the same time. If changing the missed-block reschedule flow, keep it as a dedicated page (`AiReschedulePage.tsx`) rather than reintroducing a popup modal, unless there is a specific reason to change that pattern.

## API Development

Current endpoints include:

```text
GET  /api/health
POST /api/ai/reschedule-missed-block
```

When adding an endpoint:

1. Validate request data.
2. Return consistent JSON.
3. Handle errors explicitly.
4. Avoid exposing secrets.
5. Document the endpoint in `README.md` and `USAGE.md`.
6. Add appropriate tests when a test framework is introduced.

## Third-Party Services

- The live map (`CorridorMap.tsx`) uses Leaflet with public OpenStreetMap tiles and requires no API key. Preserve the OpenStreetMap attribution in the map when modifying it — this is a licensing requirement, not just a UI detail.
- The AI rescheduling endpoint uses Google Gemini via `@google/genai`, with a deterministic fallback when no key is configured. Do not remove the fallback path.

## Environment Variables

Use `.env.local` for local secrets.

Example:

```env
GEMINI_API_KEY=your_gemini_api_key
APP_URL=http://localhost:3000
```

Never commit:

```text
.env.local
```

or API keys.

Update `.env.example` when a new required environment variable is introduced, but use placeholder values only.

## Commit Messages

Use clear commit messages.

Examples:

```text
feat: add block conflict filtering
fix: handle failed AI reschedule requests
docs: improve local setup instructions
refactor: simplify defect state updates
style: improve corridor dashboard layout
```

Keep commits understandable and focused.

## Pull Requests

A pull request should include:

- A clear title
- A short description of the change
- Reason for the change
- Screenshots for significant UI changes
- Testing performed
- Any known limitations

Example:

```text
## What changed
Added filtering by maintenance department in the schedules view.

## Testing
- npm run lint
- npm run build
- Manual browser testing

## Notes
Existing mock data remains unchanged.
```

## Reporting Bugs

When reporting a bug, include:

1. What you expected
2. What actually happened
3. Steps to reproduce
4. Browser and operating system
5. Terminal error, if applicable
6. Browser console error, if applicable
7. Screenshot when useful

Do not include API keys or other secrets in bug reports.

## Feature Requests

For a feature request, describe:

- The problem
- The proposed solution
- Who benefits from the feature
- How the UI should behave
- Whether backend/API changes are required
- Any safety or data considerations

## Documentation Contributions

Documentation improvements are welcome.

Keep documentation:

- Clear
- Practical
- Accurate to the current source code
- Free of unsupported claims
- Explicit about prototype/mock-data limitations

Important documentation files include:

```text
README.md
USAGE.md
CONTRIBUTING.md
```

When you change user-facing behavior (a new view, a changed workflow, a removed field), update all three files in the same change if they reference the old behavior.

## Safety and Responsible Development

This system relates to railway maintenance and operational planning.

Do not develop features that automatically issue real railway control commands based solely on AI output.

For any future production integration, contributors should require appropriate:

- Human authorization
- Authentication
- Audit logging
- Input validation
- Data integrity controls
- Safety review
- Operational testing
- Domain-expert approval

## License

The current repository does not specify an open-source license.

Until a license is added by the project owner, contributors should not assume that the code may be redistributed under a particular open-source license.
