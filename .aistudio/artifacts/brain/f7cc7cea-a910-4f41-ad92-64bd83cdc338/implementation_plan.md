# Implementation Plan: Startup Screen, Login Flow & Real-Time Crew-to-Admin Resolution

Provide an animated startup screen with the VoltPulse logo, smooth transition into the Login Screen, and real-time crew reporting with an instant Admin resolution workflow.

---

## 1. User Journey & Core Flow

```
[App Entry]
    │
    ▼
[Startup Screen / Splash Screen]
  - High-fidelity VoltPulse energy crest & pulse telemetry
  - 2-second automated initialization with smooth progress indicator & skip option
    │
    ▼
[Login Screen]
  - Role selection: Resident Citizen, Field Dispatch Crew, Utility Admin / Grid Controller
  - One-click profile selection or custom credentials
    │
    ├──▶ Resident ──▶ Resident Outage Reporting & Tracking Portal
    ├──▶ Field Crew ──▶ Dispatch Crew Terminal (Field Updates & Hazard Checklist)
    └──▶ Admin Dispatcher ──▶ Dispatcher Command Center & GIS Map
                                  ▲
                                  │ (Real-Time Notification Banner & 1-Click Solve)
                                  └──────── Crew Reports Field Status
```

---

## 2. Proposed Changes & Components

### A. Dedicated Startup Screen Component (`src/components/StartupScreen.tsx`)
- **Visual Design**:
  - Dark slate canvas (`#090D16`) with an electric radial pulse effect.
  - Custom SVG VoltPulse Logo Emblem featuring an interlocking high-voltage lightning surge and telemetry circuit crest.
  - Subtitle: *VoltPulse Grid Telemetry & Incident Dispatch System*.
  - Sleek tabular telemetry boot indicators (`SYSTEM_CORE: OK`, `GIS_GRID: ONLINE`, `SCADA_FEEDERS: READY`).
  - Animated 2.0-second linear progress bar with an instant "Skip to Login" button for immediate access.
- **Transition**:
  - Automatically transitions cleanly into the `LoginPage` upon completion, setting an `isStartupComplete` state in `App.tsx`.

### B. Login Screen Integration & App Initial State
- **Default Entry**:
  - Configure `App.tsx` state so that upon first visiting, the user experiences:
    1. `StartupScreen` (active until completed or skipped).
    2. `LoginPage` (active immediately following the startup screen).
  - Users can select their role (Citizen, Dispatch Crew, or Admin) to enter their specific portal.
  - Add an option to revisit the Startup Screen from the user menu if desired.

### C. Real-Time Dispatch Crew ↔ Admin Problem Resolution Workflow
- **Crew Field Update Event**:
  - In `DispatchCrewSection.tsx`, when field crew submits a status update (`EN_ROUTE`, `ON_SITE`, `FAULT_ISOLATED`, `HAZARDS_CLEARED`, or `READY_FOR_ENERGIZATION`):
    - Generates a timestamped status update record.
    - Emits an urgent field event alert specifically tagged for Admin attention.
- **Admin Alert Banner & Quick-Action Solve**:
  - In `DispatcherDashboard.tsx`, display an **urgent field alert callout** at the top of the command center whenever the latest crew update is received or when a crew marks a problem as `READY_FOR_ENERGIZATION`:
    - Shows: Crew Unit name, incident code, location, latest field status badge, and notes.
    - Includes a prominent **"⚡ Review & Mark Solved"** direct quick-action button.
  - Clicking the quick-action button immediately opens `AdminSolveProblemModal` pre-focused on that incident, enabling the admin to:
    - Review crew checklist completion and isolation logs.
    - Enter official closing telemetry notes.
    - Click **"Confirm Restoration & Update Everyone"**.
  - Immediately broadcasts the restoration across the entire app:
    - Sets ticket status to `RESTORED`.
    - Updates the global advisory ticker banner in the Navbar.
    - Pushes a celebratory toast notification to all screens.
    - Marks feeder status as nominal in the GIS map and resident portal.

---

## 3. Verification & Testing Plan

1. **Startup Flow Verification**:
   - Reload page / clear session: verify Startup Screen appears first with the VoltPulse logo and progress animation.
   - Verify smooth transition into the Login Screen after 2 seconds or on clicking skip.
2. **Login Routing**:
   - Test logging in as Dispatch Crew (`rajesh_crew`): verify redirection directly to the Dispatch Crew Section.
   - Test logging in as Admin (`john_doe`): verify redirection to the Dispatcher Dashboard.
3. **Crew to Admin Solve Flow**:
   - In Dispatch Crew Section, select an active incident (e.g., `OUT-8492`), update status to `READY_FOR_ENERGIZATION` with checklist verified.
   - Switch or view Dispatcher Dashboard: verify urgent alert banner appears with crew notes.
   - Click "Review & Mark Solved", enter notes, and confirm restoration.
   - Verify ticket is marked `RESTORED`, latest crew update shows energized, and broadcast message is pushed to everyone.
