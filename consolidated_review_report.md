# Consolidated Goldfish Review Report

**Target Document:** `docs/designs/investments_allocator_fe.md`  
**Review Preset:** Consolidated report with all review rubrics (Uninterrupted Full Flow)  
**Stages Executed:** Stage 5 (Initial Zoom Out) → Stage 6 (Comprehension) → Stage 7 (Critic) → Stage 8 (Intermediate Zoom Out) → Stage 9 (Implementation Readiness)  
**Deliverable Artifact:** `consolidated_review_report.md`  

---

## 1. Executive Summary

A comprehensive multi-lens audit of the Investments Allocator Web Frontend design specification was conducted across seven specialized Goldfish reviewer personas. 

The review affirmed the core architectural pillars:
* Strict alignment with the Bastter buy-only methodology.
* Single-port containerized deployment via Nginx reverse proxy eliminating CORS.
* Dual-workflow ergonomic separation (Monthly Inflow Ritual vs. Portfolio Maintenance).
* Integer minor units representation avoiding floating-point rounding errors.

However, cross-stage synthesis uncovered **four Blocker defects** and **nine Major discrepancies** where the design diverged from the backend OpenAPI contract, omitted critical build files, or introduced speculative client-side responsibilities. All findings have been consolidated and deduplicated below into an actionable remediation roadmap with full traceability.

---

## 2. Reviewer Status Matrix

| Stage | Reviewer Shortname | Persona Role | Model Tier | Status | Artifact Produced |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Stage 5** | `egm-zoom-out` | Skeptical Architect / YAGNI | `inherit` (Flash High) | `completed` | [zoom_out_report.md](file:///home/guildsmac/development/investments-allocator-fe/zoom_out_report.md) |
| **Stage 5** | `egm-inventive-catalyst` | TRIZ Contradiction Auditor | `inherit` (Flash High) | `completed` | [zoom_out_report.md](file:///home/guildsmac/development/investments-allocator-fe/zoom_out_report.md) |
| **Stage 6** | `egm-comprehension` | Naive Reader / Jargon Auditor | `flash` | `completed` | [comprehension_report.md](file:///home/guildsmac/development/investments-allocator-fe/comprehension_report.md) |
| **Stage 7** | `egm-design` | Hostile Design Critic | `inherit` (Flash High) | `completed` | [critic_report.md](file:///home/guildsmac/development/investments-allocator-fe/critic_report.md) |
| **Stage 7** | `egm-structural` | Structural Layout Validator | `flash` | `completed` | [critic_report.md](file:///home/guildsmac/development/investments-allocator-fe/critic_report.md) |
| **Stage 7** | `egm-style` | Technical Copy Editor | `flash` | `completed` | [critic_report.md](file:///home/guildsmac/development/investments-allocator-fe/critic_report.md) |
| **Stage 8** | `egm-zoom-out` | Skeptical Architect / Simplifier | `flash` | `completed` | [intermediate_zoom_out_report.md](file:///home/guildsmac/development/investments-allocator-fe/intermediate_zoom_out_report.md) |
| **Stage 9** | `egm-implementation-readiness`| Pragmatic Tech Lead | `inherit` (Flash High) | `completed` | [implementation_readiness_report.md](file:///home/guildsmac/development/investments-allocator-fe/implementation_readiness_report.md) |
| **Stage 9** | `egm-codebase-details` | Technical Quality Auditor | `inherit` (Flash High) | `completed` | [implementation_readiness_report.md](file:///home/guildsmac/development/investments-allocator-fe/implementation_readiness_report.md) |
| **Stage 9** | `egm-style` | Technical Copy Editor | `flash` | `completed` | [implementation_readiness_report.md](file:///home/guildsmac/development/investments-allocator-fe/implementation_readiness_report.md) |

---

## 3. Consolidated Actionable Tasks (Prioritized)

### 🔴 Blockers

#### Task 1: Eliminate Speculative Rationale Card & Align Inflow View with Actionable Backend Plan
* **Consolidated Scope:** Goals G-1 (L37–38), CUJ 1 (L70–71), Section 2 (L164), Section 3 (L198–200), Section 4 (L299–307), Detailed Implementation Plan (L591–593)
* **Underlying Problem:**  
  `rationale-card.component.ts` was assigned to render macro deltas ($\Delta_i$), micro deficits ($\delta_j$), and candidate-bypass badges (`Freio Locked`, `Quarantined`, `Quote Stale`, `Infeasible`). However, the Go backend (`POST /api/v1/inflows`) returns only static engine metadata in `rationale_json`; it returns **no** micro deficits ($\delta_j$), **no** candidate ranking, and **no** Freio status fields. Simulating or parsing this client-side violates Goal G-4 ("Zero Financial Math on Client") and Non-Goal NG-3.
* **Concrete Resolution:**  
  1. Remove `rationale-card.component.ts` and the `Freio Locked` status badge from the Inflow view.
  2. Keep the Inflow view focused strictly on the actionable rebalancing plan returned by `POST /api/v1/inflows` (contribution amount, `PlanLeg` buy instructions, and expected cash remainder).
  3. Rely on the Portfolio Maintenance view to display macro targets, deltas, conviction scores, and asset statuses (`quarantined`, `quote_stale`, `feasible`).

#### Task 2: Fix Fixed-Income Fill Execution Payload to Comply with Backend Schema
* **Consolidated Scope:** CUJ 3 (L81–88), Section 4 (L310–316), Detailed Implementation Plan (L594–597), Verification Plan (L645–648)
* **Underlying Problem:**  
  The design states that executing a `BALANCE_TRACKED` leg submits only `balance_after`. The Go backend (`internal/api/dto_inflow.go`, `internal/app/execute.go`) enforces that `qty` and `price_minor_units_per_unit` are strictly required and must be $> 0$. Submitting without them triggers an immediate HTTP `400 Bad Request`.
* **Concrete Resolution:**  
  Explicitly specify the fixed-income execution payload mapping in `inflow.models.ts` and `ExecuteLegDialogComponent`:
  - `price_minor_units_per_unit: "1"` (par value).
  - `qty`: string decimal matching the gross contribution minor units (e.g., `"120000"` for R$ 1.200,00).
  - `fees_minor_units: 0` (or actual fees).
  - `balance_after`: user-declared integer minor units balance.

#### Task 3: Restructure Implementation Plan into Phased Incremental Execution with Checkpoints
* **Consolidated Scope:** Detailed Implementation Plan (L519–625)
* **Underlying Problem:**  
  The plan merely categorized files into seven static thematic buckets with entrypoints (`main.ts`, `index.html`, `app.config.ts`, `app.routes.ts`) placed at the end. Following this order leaves the codebase unbuildable throughout steps 1–6, violating the Implementation Readiness Standard.
* **Concrete Resolution:**  
  Restructure into 7 sequential phases with explicit build and test commands at each checkpoint:
  - **Phase 1: Workspace Scaffolding, Angular Configuration & Application Shell:** (`package.json`, `angular.json`, `tsconfig.json`, `proxy.conf.json`, `src/index.html`, `src/main.ts`, `src/app/app.config.ts`, `src/app/app.routes.ts`, `src/app/app.component.*`, `src/styles.scss`). *Checkpoint:* `npm run build` compiles cleanly.
  - **Phase 2: Core Domain Models, API Services & Error Interceptor:** (`src/app/core/models/*`, `src/app/core/services/*`, `src/app/core/interceptors/*`). *Checkpoint:* Unit tests pass.
  - **Phase 3: Shared Directives & Pipes:** (`src/app/shared/directives/*`, `src/app/shared/pipes/*`). *Checkpoint:* Directive and pipe unit tests pass.
  - **Phase 4: Portfolio Maintenance Feature:** (`src/app/features/maintenance/*`). *Checkpoint:* Maintenance table, inline editing, and registration dialog pass unit tests.
  - **Phase 5: Monthly Inflow Workflow Feature:** (`src/app/features/inflow/*`). *Checkpoint:* Inflow calculation, execution dialog, and store update tests pass.
  - **Phase 6: Containerization & Reverse Proxy:** (`Dockerfile`, `nginx.conf`, `docker-compose.yml`). *Checkpoint:* Multi-stage Docker build and Nginx proxy pass tests pass.
  - **Phase 7: Full Verification & Quality Gates:** Execute full test suite, linter, and production build.

#### Task 4: Complete Target Scope & File Boundary Write Allowlist
* **Consolidated Scope:** Detailed Implementation Plan (L523–625), Verification Plan (L634–648)
* **Underlying Problem:**  
  The Target Files list omits mandatory files: `src/index.html`, development proxy `proxy.conf.json`, component file `src/app/features/inflow/plan-legs-table.component.ts`, and all unit test `*.spec.ts` files required by the Verification Plan.
* **Concrete Resolution:**  
  Add explicit repository-relative paths for `src/index.html`, `proxy.conf.json`, align `plan-legs-table.component.ts` (list explicitly or fold into `inflow-ritual.component`), and list all corresponding unit test `*.spec.ts` files.

---

### 🟡 Majors

#### Task 5: Prevent Active Plan Session Loss on Page Refresh / App Switch
* **Consolidated Scope:** Non-Goals NG-2 (L49–50), CUJ 4 (L89–99), Section 2 (L159), Section 3 (L216), Core Services (L560–566)
* **Underlying Problem:**  
  `PortfolioStoreService` holds `activePlan` solely in an in-memory signal. In CUJ 4, a user executes Leg 1 and leaves Leg 2 pending. If the user refreshes their browser or switches mobile apps, `activePlan` resets to `null`, trapping the user without access to Leg 2.
* **Concrete Resolution:**  
  Differentiate between arbitrary historical audit browsing and retrieving the active actionable plan. Add `getActivePlan()` to `InflowApiService` wrapping `GET /api/v1/plans?status=PENDING&status=PARTIALLY_EXECUTED` and rehydrate `activePlan` in `PortfolioStoreService` on app initialization.

#### Task 6: Decouple Container Health Check and Configure Dynamic Upstream Resolution
* **Consolidated Scope:** Containerization Pipeline (L381–438), NFR §3 Resilience (L498–501), Detailed Implementation Plan (L542)
* **Underlying Problem:**  
  The Dockerfile `HEALTHCHECK` probes `http://127.0.0.1:80/healthz`, which Nginx proxies to the backend container. If the backend is restarting, Nginx returns 502, Docker marks the frontend container unhealthy, and restarts it in a loop, preventing the browser from loading the SPA to display the 502 error banner.
* **Concrete Resolution:**  
  1. Configure the Dockerfile `HEALTHCHECK` to probe static file serving locally (`wget -q --spider http://127.0.0.1:80/ || exit 1`).
  2. Retain standard Nginx root execution for port 80 (or shift to an unprivileged image listening on port 8080).
  3. Ensure dynamic resolver or proper Docker network configuration in `nginx.conf` and `docker-compose.yml`.

#### Task 7: Define UI Workflows for Quarantine and Instrument Deletion
* **Consolidated Scope:** CUJ 2 (L74–80), Section 4 (L246–247), Detailed Implementation Plan (L559, L600–608)
* **Underlying Problem:**  
  `setQuarantine` is listed in services without a DTO or UI control. No delete action exists to clean up mistyped unheld tickers. Asset registration dialog omits the required `name` field.
* **Concrete Resolution:**  
  1. Add `QuarantineRequest { quarantined: boolean; note?: string; }` to `portfolio.models.ts` and define an inline quarantine toggle in `maintenance.component.ts`.
  2. Add `deleteInstrument(id: number)` in `PortfolioApiService` and expose a delete action for unheld instruments in the maintenance view.
  3. Ensure `name` is explicitly required in `RegisterAssetDialogComponent`.

#### Task 8: Align Error Interceptor with Backend Schema and HTML Gateway Errors
* **Consolidated Scope:** Detailed Implementation Plan (L566–568)
* **Underlying Problem:**  
  Interceptor assumes `{ code, message, details }`, but backend returns `{ error: string, field?: string }`, and Nginx 502 returns HTML.
* **Concrete Resolution:**  
  Update interceptor to parse error text via `err.error?.error || (typeof err.error === 'string' ? err.error : err.statusText) || 'Unexpected Error'` and specifically map 502/503 statuses to a user-friendly connectivity banner.

#### Task 9: Configure Cross-Repo Docker Network and Local Development Proxy
* **Consolidated Scope:** Section 1 (L106), Detailed Implementation Plan (L526–531, L546–548)
* **Underlying Problem:**  
  Frontend `docker-compose.yml` cannot use `depends_on: [allocator]` across repositories and must join an `external: true` network. Local `npm start` requires `proxy.conf.json`.
* **Concrete Resolution:**  
  Define `external: true` with network name `investments-allocator_default` in `docker-compose.yml`, and add `proxy.conf.json` proxying `/api/v1`, `/healthz`, and `/readyz` to `http://localhost:8080`.

#### Task 10: Streamline State Layer and Eliminate Micro-Component Boilerplate
* **Consolidated Scope:** Architecture Tree (L149–180), State Management (L214–219), Detailed Plan (L563–585, L605–607)
* **Underlying Problem:**  
  Injecting `BreakpointObserver` into `PortfolioStoreService` couples presentation layout to an entity data store. Breaking out 2-line wrappers (`score-editor`, `status-badge`, `error-banner`) adds unnecessary abstraction.
* **Concrete Resolution:**  
  Keep `BreakpointObserver` in the presentation layer (`MaintenanceComponent`). Use standard Angular Material primitives (`mat-chip`, `mat-form-field` inside table cells, `MatSnackBar`) directly.

#### Task 11: Add Dedicated Risks & Mitigations Section
* **Consolidated Scope:** Document-wide (Lines 1..518), specifically Section 2 (Non-Functional Requirements, L488–501)
* **Underlying Problem:**  
  `feature-spec-standard.md` requires explicit documentation of constraints, failure modes, security implications, scalability limits, and mitigations.
* **Concrete Resolution:**  
  Add `## Risks & Mitigations` covering unauthenticated local-network exposure, client-side table rendering limits, and backend supersession state drift.

#### Task 12: Calibrate Claims and Strip Promotional Buzzwords
* **Consolidated Scope:** Overview (L13, L17), Problem (L23), Goals (L40, L42), Section 5 (L359), Section 6 (L367, L372), NFR §2 (L495–496), Alternatives (L463, L484)
* **Underlying Problem:**  
  Uncalibrated performance guarantees ("under 1 second"), claiming frontend stores `int64` and "completely avoids floating-point", and buzzwords ("Day-0", "disciplined, usability-first", "transparent").
* **Concrete Resolution:**  
  Rephrase monetary representation to "integer minor units within JavaScript safe-integer bounds (`number`)", replace "Day-0" with "Responsive Support", and substitute factual engineering terminology for promotional buzzwords.

#### Task 13: Standardize Rejection Rationales in Alternatives Considered
* **Consolidated Scope:** Alternatives Considered (L442–485)
* **Underlying Problem:**  
  All six alternatives open with bare unlinked `"Reason for Rejection: Rejected by author."`
* **Concrete Resolution:**  
  Remove the bare prefix and state technical rejection rationales directly.

---

### 🟢 Nits

1. **Angular Major Version:** Pin to Angular 19 explicitly across `package.json` and documentation.
2. **Locale Registration:** Register `localePt` (`pt-BR`) in `src/app/app.config.ts`.
3. **Price Serialization:** Ensure `ExecuteLegRequest.price_minor_units_per_unit` casts numeric minor units to string (`amount.toString()`).
4. **Target BPS within Macro:** Add `target_bps_within_macro: number;` to `InstrumentSummary`.
5. **Relative Links:** Update relative paths in `## Additional Resources` to resolve against sibling repo (`../../../investments-allocator/...`).
6. **Symmetric CUJ 2:** Format CUJ 2 into symmetric `Given -> When -> Then -> When -> Then` steps.
7. **E2E Protocol Label:** Explicitly label Section 4 of Verification Plan as "Manual Acceptance Verification Checklist (Browser QA against Local Docker Environment)".

---

## 4. Traceability Matrix

| Raw Finding Source | Consolidated Task | Severity | Status |
| :--- | :--- | :--- | :--- |
| `zoom_out_report.md` #1, `comprehension_report.md` #1 & #2, `critic_report.md` #1, `intermediate_zoom_out_report.md` #1, `readiness_report.md` #2 | **Task 1: Eliminate Speculative Rationale Card** | 🔴 Blocker | Pending doc remediation |
| `zoom_out_report.md` #4, `comprehension_report.md` #4, `critic_report.md` #2, `intermediate_zoom_out_report.md` #4, `readiness_report.md` #4 | **Task 2: Fix Fixed-Income Fill Execution Payload** | 🔴 Blocker | Pending doc remediation |
| `readiness_report.md` #1 | **Task 3: Phased Incremental Execution** | 🔴 Blocker | Pending doc remediation |
| `comprehension_report.md` #6, `readiness_report.md` #3 | **Task 4: Complete Target Scope Allowlist** | 🔴 Blocker | Pending doc remediation |
| `zoom_out_report.md` #3, `critic_report.md` #3, `intermediate_zoom_out_report.md` #4, `readiness_report.md` #5 | **Task 5: Prevent Active Plan Session Loss** | 🟡 Major | Pending doc remediation |
| `zoom_out_report.md` #2, `comprehension_report.md` #8, `critic_report.md` #4, `intermediate_zoom_out_report.md` #4, `readiness_report.md` #8 | **Task 6: Decouple Container Health Check** | 🟡 Major | Pending doc remediation |
| `comprehension_report.md` #3, `critic_report.md` #5, `readiness_report.md` #9 | **Task 7: Define UI Workflows for Quarantine/Deletion**| 🟡 Major | Pending doc remediation |
| `comprehension_report.md` #9, `critic_report.md` #4, `readiness_report.md` #6 | **Task 8: Align Error Interceptor Schema** | 🟡 Major | Pending doc remediation |
| `comprehension_report.md` #7, `critic_report.md` #7, `readiness_report.md` #7 | **Task 9: Configure Docker Network & Dev Proxy** | 🟡 Major | Pending doc remediation |
| `zoom_out_report.md` #5, `intermediate_zoom_out_report.md` #3 | **Task 10: Streamline State Layer & Primitives** | 🟡 Major | Pending doc remediation |
| `critic_report.md` #6 | **Task 11: Add Dedicated Risks & Mitigations** | 🟡 Major | Pending doc remediation |
| `critic_report.md` #9, `style_report` | **Task 12: Calibrate Claims & Tone** | 🟡 Major | Pending doc remediation |
| `critic_report.md` #10, `structural_report` | **Task 13: Standardize Rejection Rationales** | 🟡 Major | Pending doc remediation |
| Various reviewer nits | **Tasks 14–20: Minor Formatting & DTO Details** | 🟢 Nit | Pending doc remediation |
