# Usage Guide

## Bharat Rail AI Block Planning System

This guide explains how to install, start, and use the Bharat Rail AI Block Planning System.

## 1. Prerequisites

Install:

- Node.js 18 or later
- npm
- A modern web browser

Check your installation:

```bash
node -v
npm -v
```

## 2. Install the Project

Open a terminal in the project folder:

```bash
cd bharat-rail-ai-block-planning-system
```

Install dependencies:

```bash
npm install
```

This installs, among others, `leaflet` and `react-leaflet`, which power the live corridor map (OpenStreetMap tiles, no API key required).

## 3. Configure Gemini AI

AI-assisted missed-block rescheduling requires a Gemini API key.

Create:

```text
.env.local
```

Add:

```env
GEMINI_API_KEY=your_gemini_api_key
APP_URL=http://localhost:3000
```

The project includes `.env.example` as a template.

### Without a Gemini API key

The application can still run. The server contains a fallback scheduling engine and returns `aiGenerated: false` when Gemini is unavailable.

## 4. Start the Application

Run:

```bash
npm run dev
```

Then open:

```text
http://localhost:3000
```

### Important

This project uses:

```text
npm run dev -> tsx server.ts
```

The Express server starts Vite in middleware mode during development. Therefore, you should normally use `npm run dev` rather than creating a separate Vite project. Running `npx vite` directly starts only the frontend — the `/api/*` endpoints (and AI rescheduling) will not be available in that mode.

## 5. Dashboard

The dashboard provides a summary of the current demonstration environment.

Use it to review:

- Maintenance activity
- Defect activity
- Block plans
- Recent system events
- Operational summaries
- A live, real corridor map (pan/zoom/drag) with station status markers — click a station for a brief detail popover, or "View Full Map" for a larger version

## 6. Schedules / Block Planning

Use the scheduling area to review existing maintenance blocks and to generate an AI schedule.

A block contains:

- Corridor, section, location, division
- Department and maintenance type
- Date, start/end time, duration
- Status
- Conflicting trains
- System integration information

### Creating a single block

1. Open the scheduling interface, or click "New Block Plan" in the sidebar.
2. Choose the division, section, department, activity type, and duration.
3. The possession date and start time are **auto-assigned** by the system (next low-traffic window) — there is nothing to pick manually.
4. Enter a work description and submit.
5. The application adds the new block to the current in-memory state, and a new activity entry is generated.

### Creating blocks for several departments at once

Open **"Multi-Department Batch Requests"** on the Schedules page:

1. Fill in a request (division, section, department, type, duration, priority) and click "Add This Request to Queue". Repeat for every department that needs a block — each request can target a different division, section, or department than the others.
2. Review the queued list; remove any entry if needed.
3. Click **"Create N Blocks Simultaneously"**. The system reads every queued request and dispatches all the resulting blocks in one batch, automatically staggering each department's start time so they land in non-conflicting possession windows on the same date.

> Current data is held in application state. Restarting the server resets the demonstration state to the initial mock data.

## 7. Weekly Timetable

Open **Timetable** in the sidebar for a Google Calendar–style week view:

- Each day is a column; hours run down the side (24-hour grid).
- Every block plan is drawn as a colored chip positioned at its actual start time and duration (color = status: red for Missed, amber for Active, neutral for Scheduled, green for Completed).
- Use the week arrows or "Today" to navigate. The view opens on whichever week has the most demo data so blocks are visible right away.
- Click any block to see a brief detail card (ID, type, section, department, status, date/time, duration, description, approver) without leaving the calendar.

## 8. Corridors & Assets

Corridors and Assets were merged into a single sidebar entry and workspace, since they describe the same underlying infrastructure.

Use it to:

- Pick a corridor from the selector
- Open "Filters" for an optional advanced panel (Category / Department / Health) — collapsed by default to keep the page uncluttered
- Review trackside asset telemetry in a table (click a row for a full asset dossier)
- See a live map focused on the selected corridor's endpoints
- Review the corridor's block status/timetable panel, with quick filter tabs (All / Missed / Active / Scheduled)
- Launch **AI Reschedule** on any missed block — this opens a dedicated page (not a popup) with the full recommendation, alternatives, train-impact mitigation, and a dispatch action

The application includes sample corridors such as:

- New Delhi - Kanpur
- Delhi - Ambala
- Kanpur - Prayagraj
- Mumbai - Ahmedabad
- Howrah - Barddhaman
- Chennai - Bengaluru

These records are mock data.

## 9. Defect Management

Use the defect view to review reported defects.

Typical fields include:

- Defect ID
- Description
- Department
- Location
- Severity
- Status
- Reported date
- Linked block

Defects can be exported as CSV or as a printable PDF report. Defect updates are maintained in frontend application state during the current session.

## 10. AI Missed-Block Rescheduling

The AI rescheduling feature is intended for demonstration of decision-support workflows.

When a missed block's "AI Reschedule" action is used, the frontend calls:

```text
POST /api/ai/reschedule-missed-block
```

The request includes the block's:

- ID
- Corridor
- Section
- Division
- Type
- Department
- Duration
- Missed reason
- Original time window
- Location
- Criticality

### AI response

The system can return:

1. Recommended possession window
2. Alternative windows
3. Train-impact mitigation suggestions
4. Safety urgency assessment
5. System synchronization status

The dedicated AI Reschedule page presents these results and allows a selected replacement window to be applied to the local application state — no popup, just a full page with a back button.

## 11. AI Fallback Mode

If the Gemini API key is missing or the AI request fails, the server returns a fallback recommendation.

The response contains:

```json
{
  "success": true,
  "aiGenerated": false
}
```

This allows the interface to remain usable during development without an external AI service.

## 12. Health Check

Verify that the backend is running:

```text
GET http://localhost:3000/api/health
```

A successful response contains:

```json
{
  "status": "ok"
}
```

## 13. Production Build

Build the application:

```bash
npm run build
```

Then start the bundled server:

```bash
npm start
```

The production server serves the built frontend from `dist`.

## 14. Type Checking

Run:

```bash
npm run lint
```

This executes TypeScript checking without emitting files.

## 15. Troubleshooting

### `node is not recognized`

Install Node.js and restart VS Code.

Then verify:

```bash
node -v
npm -v
```

### `npm run dev` starts a server on port 3000

This is expected for this project.

The script is:

```json
"dev": "tsx server.ts"
```

The server starts Express and attaches Vite middleware.

Open:

```text
http://localhost:3000
```

### Gemini requests do not generate AI results

Check that `.env.local` contains:

```env
GEMINI_API_KEY=your_gemini_api_key
```

Then restart the development server.

If the key is missing or the service is unavailable, the application uses its fallback engine.

### The live map tiles don't load

The map uses public OpenStreetMap tile servers (`{s}.tile.openstreetmap.org`). If you're on a restricted network or offline, tiles may fail to load while markers and the rest of the UI still work. No API key is required for this map.

### Changes are not appearing

Try:

```bash
npm run dev
```

again after stopping the previous process with:

```text
Ctrl + C
```

Also check the browser developer console for frontend errors.

## 16. Safety and Operational Use

This application is a prototype decision-support interface.

Do not use its generated schedules, train paths, speed restrictions, or safety assessments as actual railway instructions.

Any production deployment would require:

- Authorized human approval
- Validated operational data
- Authentication and access control
- Audit trails
- Safety analysis
- Integration testing
- Domain-expert review
- Appropriate railway standards and certification processes
