# Bharat Rail AI Block Planning System

An AI-assisted railway operations dashboard for planning maintenance blocks, monitoring railway corridors and assets, registering defects, generating reports, and automatically rescheduling missed maintenance windows.

> **Project status:** Prototype / demonstration system.
> Operational recommendations produced by this application must not be treated as real railway control instructions without validation by authorized railway operations and safety personnel.

## Overview

The **Bharat Rail AI Block Planning System** is a React + TypeScript web application with an Express/Node.js server. It demonstrates how AI-assisted decision support can be integrated into railway maintenance and corridor-control workflows.

The application includes:

- Dashboard for operational overview, recent activity, and a live corridor map
- Maintenance block scheduling with an auto-assigned possession window
- A Google Calendar–style weekly **Timetable** of every block
- Combined **Corridors & Assets** monitoring in one decluttered workspace
- **Multi-department batch requests** — queue requests from several departments (even with different divisions/sections/priorities) and create every resulting block simultaneously
- A dedicated **AI Reschedule** page (not a popup) for missed possession windows
- A real, interactive map (OpenStreetMap via Leaflet) instead of a static image
- Defect registration and tracking, with CSV and printable PDF export
- Reports and settings views
- AI-assisted simulation and missed-block rescheduling, with a deterministic fallback engine when Gemini is unavailable
- Mock railway assets, corridors, defects, schedules, and activities for demonstration
- REST endpoints for health checking and AI rescheduling
- Sans-serif typography throughout (Plus Jakarta Sans)

## Main Technologies

| Technology | Purpose |
|---|---|
| React 19 | Frontend UI |
| TypeScript | Type-safe application development |
| Vite 6 | Frontend build tooling and development middleware |
| Express 4 | Backend/API server |
| Google Gemini API | AI-assisted rescheduling |
| `@google/genai` | Gemini API integration |
| Tailwind CSS 4 | Styling |
| Leaflet + react-leaflet | Real, interactive OpenStreetMap-based corridor map |
| Lucide React | UI icons |
| Motion | UI animations |
| dotenv | Environment variable loading |
| esbuild | Production server bundling |
| tsx | Running the TypeScript server |

## Architecture

```text
Browser
   |
   v
React + TypeScript UI
   |
   | /api/*
   v
Express Server
   |
   +--------------------+
   |                    |
   v                    v
Mock application data   Google Gemini API
                        |
                        v
                AI rescheduling result
```

During development, `server.ts` starts Express and mounts Vite as middleware. The application therefore runs through the Node/Express server while still providing the Vite React development experience.

## Key Features

### 1. Dashboard

Provides a high-level view of:

- Current maintenance activity
- Defects
- Block plans
- Recent system activity
- Operational status
- A live corridor map (OpenStreetMap) with station markers colored by status and a click-through detail popover

### 2. Block Planning

Users can create maintenance block plans containing information such as:

- Block ID, corridor, section, division, location
- Work type and department
- Duration
- Status
- Conflicting trains
- System integration status (TMS / SMMS / TDMS)

The **date and start time are no longer manually entered** — new blocks are auto-assigned to the next low-traffic possession window (00:30 Hrs, next day), consistent with the AI-scheduling theme of the rest of the app. Duration is still set by the requester.

### 3. Weekly & Monthly Timetable (dual horizon)

A Google Calendar–style week view (`Timetable` in the sidebar) renders every block as a positioned chip against a 24-hour, 7-day grid, colored by status (Missed / Active / Scheduled / Completed). Clicking a block opens a brief detail card (ID, section, department, status, date/time, duration, description, approver) without leaving the grid.

A **Weekly / Monthly** toggle at the top of the same page switches to a full month-grid **long-term planning horizon**: each day cell shows up to 3 block chips (with a "+N more" overflow indicator) and a summary strip reports total blocks, missed/at-risk count, completed count, and total possession hours for the visible month. Clicking a day opens a day-agenda popover listing every block on that date. This directly covers the "weekly and monthly" multi-horizon planning requirement.

### 3b. AI Prioritization Engine

A panel on the Schedules page (`PriorityEngineView`) scores every open defect and missed block on a transparent 0–100 scale from four weighted, explainable factors — **severity**, **status/urgency**, **backlog age**, and **corridor impact** — then buckets each into a recommended scheduling horizon (This Week / This Month / Next Month) with a suggested window. Clicking a row expands a factor-by-factor score breakdown, so the ranking logic can be explained live to reviewers instead of being a black box. See `src/utils/priorityEngine.ts`.

### 3c. Train Timetable & Goods Forecast integration

A panel on the Schedules page (`TrainForecastPanel`) surfaces mock Control Office data per corridor: forecast goods-rake volume, peak/low-density traffic windows, and the scheduled passenger train paths on that section — the two data sources the problem statement calls out (Train Time Table + goods trains forecast) that block windows should be checked against.

### 4. Corridors & Assets (merged)

Assets and Corridors were merged into a single sidebar entry and workspace. The view includes:

- A single corridor selector plus a collapsible advanced-filters panel (Category / Department / Health) — hidden by default to reduce clutter, with an active-filter count badge
- A trackside asset telemetry table
- A live corridor map focused on the selected corridor's endpoints when resolvable
- A missed-block alert dossier and a block status/timetable panel with quick filter tabs

### 5. Multi-Department Batch Requests

Available from the Schedules view ("Multi-Department Batch Requests"). Each department can queue its own request — potentially with a different division, section, maintenance type, duration, and priority than any other queued request. When dispatched, the system reads every queued request and **creates all of the resulting blocks simultaneously**, auto-sequencing each into a non-conflicting possession window on the same date so the batch never overlaps on paper.

### 6. AI Missed-Block Rescheduling (dedicated page)

A missed maintenance block can be sent to the backend AI endpoint:

```text
POST /api/ai/reschedule-missed-block
```

Unlike a popup dialog, launching "AI Reschedule" from Corridors & Assets swaps the entire workspace into a dedicated page (`AiReschedulePage`) with a back button — no modal backdrop. The AI workflow considers the supplied block information and generates:

- Recommended replacement window
- Alternative windows
- Train-impact mitigation suggestions
- Safety urgency note
- TMS/SMMS/TDMS/COA synchronization status

If the Gemini API is unavailable or no API key is configured, the server uses a deterministic fallback response.

### 7. Live Corridor Map

`CorridorMap` (Leaflet + OpenStreetMap tiles, no API key required) replaces the previous static map images across the Dashboard (main card and full-map modal) and the Corridors & Assets quick-map card. Station markers use real latitude/longitude, are colored by status, and corridor links are drawn between them; clicking a marker surfaces the same station detail panel as before.

## Project Structure

```text
bharat-rail-ai-block-planning-system/
├── assets/
├── src/
│   ├── components/
│   │   ├── AiReschedulePage.tsx
│   │   ├── AiSimulationModal.tsx
│   │   ├── BatchDepartmentRequests.tsx
│   │   ├── CorridorMap.tsx
│   │   ├── CorridorsView.tsx
│   │   ├── DashboardView.tsx
│   │   ├── DefectsView.tsx
│   │   ├── NewBlockModal.tsx
│   │   ├── ReportsView.tsx
│   │   ├── SchedulesView.tsx
│   │   ├── SettingsView.tsx
│   │   ├── Sidebar.tsx
│   │   ├── TimetableView.tsx
│   │   └── TopHeader.tsx
│   ├── data/
│   │   └── mockData.ts
│   ├── utils/
│   │   └── time.ts
│   ├── App.tsx
│   ├── index.css
│   ├── main.tsx
│   └── types.ts
├── .env.example
├── index.html
├── metadata.json
├── package.json
├── server.ts
├── tsconfig.json
└── vite.config.ts
```

## Requirements

- Node.js 18+ recommended
- npm
- A modern browser
- Gemini API key for live AI generation (optional because a fallback engine is included)

## Installation

Clone or copy the project and open the project directory:

```bash
cd bharat-rail-ai-block-planning-system
```

Install dependencies:

```bash
npm install
```

Create a local environment file:

```text
.env.local
```

Add:

```env
GEMINI_API_KEY=your_gemini_api_key
APP_URL=http://localhost:3000
```

Do not commit `.env.local` or any API key to Git.

## Running the Application

Start the development server:

```bash
npm run dev
```

The server listens on:

```text
http://localhost:3000
```

Open that address in your browser.

The development server uses Express with Vite middleware, so the React frontend and API are available through the same development server.

## Other Commands

### Type checking

```bash
npm run lint
```

### Production build

```bash
npm run build
```

### Preview the Vite production build

```bash
npm run preview
```

### Start the bundled production server

After building:

```bash
npm start
```

## API Endpoints

### Health Check

```http
GET /api/health
```

Example response:

```json
{
  "status": "ok",
  "timestamp": "2026-01-01T00:00:00.000Z"
}
```

### AI Reschedule

```http
POST /api/ai/reschedule-missed-block
Content-Type: application/json
```

The request accepts missed-block information such as:

```json
{
  "blockId": "#MB-2023-09M",
  "corridorName": "New Delhi - Kanpur (NDLS-CNB)",
  "section": "NDLS - CNB (Main Line)",
  "division": "Northern Railway (Delhi)",
  "blockType": "Signaling & Track Circuit",
  "department": "S&T",
  "durationHours": 3.5,
  "missedReason": "Traffic congestion",
  "originalDate": "2023-10-25",
  "originalStartTime": "02:00 Hrs",
  "originalEndTime": "05:30 Hrs",
  "location": "Km 210/4 - 212/0",
  "criticality": "High"
}
```

## Data

The current application uses demonstration data from:

```text
src/data/mockData.ts
```

This includes sample assets, defects, corridors (with real lat/lng for the live map), block plans, activities, and corridor nodes/links. Shared date/time formatting and slot-arithmetic helpers live in `src/utils/time.ts` and are used by the New Block modal, batch requests, and the timetable.

The sample dates and operational records are illustrative and should not be interpreted as live Indian Railways data.

## Security Notes

- Keep `GEMINI_API_KEY` on the server side.
- Never expose API keys in React components or commit them to Git.
- Validate and sanitize API input before connecting the system to production data.
- Add authentication and authorization before exposing operational APIs.
- Add audit logging for changes to block plans and defects.
- Do not connect AI-generated recommendations directly to safety-critical railway control systems without appropriate human approval, testing, certification, and operational safeguards.

## Limitations

This project is a prototype and currently uses mock operational data. It does not provide:

- Live train movement data
- Live Control Office Application data
- Real-time railway signaling integration
- Real TMS/SMMS/TDMS integration
- Production-grade authentication
- Production database persistence
- Certified safety-critical decision making

AI output is generated as decision support and must be independently verified.

The **AI Prioritization Engine** is a transparent, rule-based weighted-scoring
model built for demonstration/explainability — it is not a trained ML model.
The factor shape (severity / status / age / corridor impact → 0–100 score)
is designed so a trained classifier or regression model could later replace
the weight lookup without changing anything downstream. The **Train
Timetable** and **Goods Forecast** panels use mock Control Office data for
the same reason — in production these would be live feeds from COA/TMS.

## License

No license is currently specified in the project. If this project is published publicly, add an appropriate open-source license such as MIT, Apache-2.0, or another license chosen by the project owner.
