# Implementation Readiness Test Report (Stage 9)

**Target:** `docs/designs/investments_allocator_fe.md` (Lines 519..668)  
**Standard:** `implementation-readiness-standard.md`  
**Reviewers:** `egm-implementation-readiness` (Pragmatic Tech Lead), `egm-codebase-details` (Codebase Details Auditor), `egm-style` (Technical Copy Editor)  

---

## Prioritized Findings

### 1. Phased Incremental Execution & Checkpoints Missing - Severity: Blocker
* **Reviewer Lens:** `egm-implementation-readiness`
* **Affected Scope:** Detailed Implementation Plan (L519–625)
* **Discrepancy Description:**  
  The Implementation Readiness Standard mandates that the plan partition work into logical, incremental phases where each phase leaves the codebase in a stable, buildable, and testable state. The current text merely divides files into seven static thematic buckets, placing root entrypoints (`main.ts`, `index.html`, `app.config.ts`, `app.routes.ts`) in bucket 7. Following this sequence leaves the codebase completely unbuildable and untestable throughout steps 1–6.
* **Recommendation:**  
  Restructure the plan into sequential, buildable phases:
  - Phase 1: Workspace Scaffolding, Angular Config & Shell (`package.json`, `angular.json`, `tsconfig.json`, `proxy.conf.json`, `index.html`, `main.ts`, `app.config.ts`, `app.routes.ts`, `app.component.*`, `styles.scss`). *Checkpoint:* `npm run build` compiles cleanly.
  - Phase 2: Core Domain Models, API Services & Error Interceptor (`src/app/core/*`). *Checkpoint:* Unit tests pass.
  - Phase 3: Shared Directives & Pipes (`src/app/shared/*`). *Checkpoint:* Masking directive and pipes unit tests pass.
  - Phase 4: Portfolio Maintenance Feature (`src/app/features/maintenance/*`). *Checkpoint:* Maintenance table, inline editing, and registration dialog pass unit tests.
  - Phase 5: Monthly Inflow Workflow Feature (`src/app/features/inflow/*`). *Checkpoint:* Inflow calculation and execution dialog pass unit tests.
  - Phase 6: Containerization & Reverse Proxy (`Dockerfile`, `nginx.conf`, `docker-compose.yml`). *Checkpoint:* Multi-stage build and Nginx proxy pass tests succeed.
  - Phase 7: Verification & Quality Gates.

---

### 2. Selection Rationale & Freio Contract Disconnect - Severity: Blocker
* **Reviewer Lens:** `egm-implementation-readiness`, `egm-codebase-details`
* **Affected Scope:** Detailed Plan (L554–556, L580–582, L591–593)
* **Discrepancy Description:**  
  L593 assigns `rationale-card.component.ts` to render why the neediest asset won (macro delta $\Delta_i$, micro delta $\delta_j$, conviction score $s_j$) and lists bypassed assets with reason codes, while L582 defines a `Freio Locked` badge. In the Go backend contract (`internal/app/inflow.go`, `openapi.yaml`), `PlanResponse` returns only an opaque string `rationale_json` containing static macro targets and policy metadata. It returns **no** micro deficits ($\delta_j$), **no** candidate breakdown lists, and **no** Freio status fields. Because State Invariant 1 forbids client-side financial calculations, an implementer cannot satisfy this specification without either inventing mock data or breaking architecture rules.
* **Recommendation:**  
  Drop `rationale-card.component.ts` and the `Freio Locked` status badge from the Inflow view. Keep the Inflow view focused on the actionable plan returned by `POST /api/v1/inflows` (contribution amount, `PlanLeg` buy instructions, and expected cash remainder). Display macro targets, deltas, conviction scores, and asset statuses (`quarantined`, `quote_stale`, `feasible`) on the Portfolio Maintenance view.

---

### 3. Missing Critical Project & Spec Files in Target Scope Allowlist - Severity: Blocker
* **Reviewer Lens:** `egm-implementation-readiness`, `egm-codebase-details`
* **Affected Scope:** Target Files to Create/Modify (L523–625), Verification Plan (L634–648)
* **Discrepancy Description:**  
  The Implementation Readiness Standard requires an explicit list of exact repository-relative file paths to enforce a Phase 5 write allowlist. The current list omits:
  1. `src/index.html`: Mandatory HTML entrypoint for Angular SPA.
  2. `proxy.conf.json`: Required for local development (`npm start`) to proxy `:4200` to `:8080`.
  3. `src/app/features/inflow/plan-legs-table.component.ts`: Declared in the Section 2 architecture tree (L165) and referenced in L590, but missing from Target Files.
  4. Unit test spec files (`*.spec.ts`): The Verification Plan mandates unit testing for currency mask, store, formatting pipes, and dialogs, but not a single `*.spec.ts` file path is listed under Target Files. Under strict write allowlist enforcement, an engineer cannot write the required test suites.
* **Recommendation:**  
  Add explicit paths for `src/index.html`, `proxy.conf.json`, align `plan-legs-table.component.ts` (fold into `inflow-ritual.component` or list explicitly), and enumerate all required `*.spec.ts` files in the Target Files list.

---

### 4. Fixed-Income Fill Execution Violates Mandatory Backend Schema - Severity: Blocker
* **Reviewer Lens:** `egm-implementation-readiness`, `egm-codebase-details`
* **Affected Scope:** Detailed Plan (L594–597), Verification Plan (L645–648)
* **Discrepancy Description:**  
  L596 specifies that for fixed income, the dialog submits `balance_after`, and L647 verifies only that `balance_after` is non-null. However, in `internal/api/dto_inflow.go` and `internal/app/execute.go`, `POST /api/v1/plans/{id}/legs/{legId}/execute` enforces that `qty` and `price_minor_units_per_unit` are **strictly required**. Submitting only `balance_after` triggers an immediate HTTP 400 `ValidationError`.
* **Recommendation:**  
  Explicitly specify the required fixed-income payload construction:
  - `price_minor_units_per_unit: "1"` (par value).
  - `qty`: string decimal of the gross contribution minor units.
  - `fees_minor_units: 0` (or user-adjusted fees).
  - `balance_after`: user-declared integer minor units balance.

---

### 5. In-Memory Active Plan Loss on Browser Refresh - Severity: Major
* **Reviewer Lens:** `egm-implementation-readiness`, `egm-codebase-details`
* **Affected Scope:** Detailed Plan (L560–565), CUJ 4 (L661)
* **Discrepancy Description:**  
  `InflowApiService` implements only `postInflow` and `executeLeg`, and `activePlan` is stored strictly in an in-memory signal. In CUJ 4, a user executes Leg 1 and leaves Leg 2 pending. If the user refreshes their browser or switches mobile apps, `activePlan` resets to `null`. The backend provides `GET /api/v1/plans?status=PENDING&status=PARTIALLY_EXECUTED`, but the frontend plan lacks an `getActivePlan()` method and startup rehydration logic in `PortfolioStoreService`. As a result, the user loses access to pending legs until an uncoordinated second inflow supersedes the plan.
* **Recommendation:**  
  Add `getActivePlan()` to `InflowApiService` wrapping `GET /api/v1/plans?status=PENDING&status=PARTIALLY_EXECUTED` and specify that `PortfolioStoreService` calls `loadActivePlan()` during application initialization.

---

### 6. Error Interceptor Assumes Non-Existent Error Payload Structure - Severity: Major
* **Reviewer Lens:** `egm-implementation-readiness`, `egm-codebase-details`
* **Affected Scope:** Detailed Plan (L566–568)
* **Discrepancy Description:**  
  L568 states that `api-error.interceptor.ts` extracts `code`, `message`, and `details`. In the Go backend implementation (`errors.go`) and `openapi.yaml`, the uniform error schema is `{ error: string, field?: string }`. Fields `code`, `message`, and `details` do not exist. Furthermore, Nginx 502/503 responses emit HTML rather than JSON. An interceptor attempting to read `error.code` or `error.message` will evaluate them as `undefined`.
* **Recommendation:**  
  Specify that the interceptor parses error text via `err.error?.error || (typeof err.error === 'string' ? err.error : err.statusText) || 'Unexpected Error'` and specifically maps 502/503 statuses to a user-friendly connectivity banner.

---

### 7. Cross-Repository Docker Compose Network & Local Dev Proxy - Severity: Major
* **Reviewer Lens:** `egm-implementation-readiness`, `egm-codebase-details`
* **Affected Scope:** Detailed Plan (L526–531, L546–548)
* **Discrepancy Description:**  
  The backend daemon runs in a separate repository with network name `investments-allocator_default`. The frontend's `docker-compose.yml` cannot use `depends_on: [allocator]` across different Compose files and must declare the external network:
  ```yaml
  networks:
    default:
      name: investments-allocator_default
      external: true
  ```
  Additionally, for local development (`npm start` on `:4200`), browser CORS blocks requests to `http://localhost:8080/api/v1`. The plan omits `proxy.conf.json`.
* **Recommendation:**  
  Specify `proxy.conf.json` in Target Files and declare the external Docker network in `docker-compose.yml`.

---

### 8. Container Non-Root / Port 80 Contradiction and Healthcheck Cascading Failure - Severity: Major
* **Reviewer Lens:** `egm-implementation-readiness`, `egm-codebase-details`
* **Affected Scope:** Detailed Plan (L540–542), Section 7 (L382–399)
* **Discrepancy Description:**  
  L542 specifies that `Dockerfile` "Configures non-root user execution", but the concrete Dockerfile uses standard `nginx:1.27-alpine` binding privileged port 80 without a `USER` directive. Standard Alpine Nginx non-root execution cannot bind port 80 without `CAP_NET_BIND_SERVICE`. Furthermore, the Dockerfile `HEALTHCHECK` probes `http://127.0.0.1:80/healthz`, which proxies to the backend container. If the backend is restarting, Nginx returns 502, Docker marks the frontend container unhealthy, and restarts it in a loop.
* **Recommendation:**  
  Retain standard Nginx root startup for port 80 (or shift to an unprivileged image listening on port 8080). Configure the Dockerfile `HEALTHCHECK` to probe static file serving locally (`wget -q --spider http://127.0.0.1:80/ || exit 1`).

---

### 9. Maintenance Mutations & Quarantine Workflow Omissions - Severity: Major
* **Reviewer Lens:** `egm-implementation-readiness`, `egm-codebase-details`
* **Affected Scope:** Detailed Plan (L551–553, L557–559, L598–608)
* **Discrepancy Description:**  
  - `setQuarantine(id, payload)` is listed on `PortfolioApiService`, but `QuarantineRequest` is omitted from `portfolio.models.ts`, and `maintenance.component.ts` defines no UI action or dialog to toggle quarantine status or record an audit note.
  - The backend provides `DELETE /api/v1/instruments/{id}`, but the frontend specifies neither a service method nor a UI action to delete mistyped, unheld tickers.
  - Asset registration dialog captures score, asset kind, and lot rules, but omits asset `name`, which is strictly required by the backend (`name: is required`).
* **Recommendation:**  
  Add `QuarantineRequest` to `portfolio.models.ts`, specify an inline quarantine toggle in `maintenance.component.ts`, add `deleteInstrument(id: number)` in `PortfolioApiService`, and ensure `name` is explicitly required in `RegisterAssetDialogComponent`.

---

### 10. Missing Brazilian Locale Registration (`pt-BR`) & E2E Protocol Clarification - Severity: Nit
* **Reviewer Lens:** `egm-implementation-readiness`, `egm-style`
* **Affected Scope:** Detailed Plan (L574–579, L610–612, L657–664)
* **Discrepancy Description:**  
  Angular currency and decimal pipes rely on locale data to render Brazilian Real formatting (`R$ 1.500,00`). If `pt-BR` is not registered in `app.config.ts`, Angular defaults to `en-US` or throws runtime errors. Additionally, Section 4 of the Verification Plan does not specify whether E2E verification is an automated test suite or a manual browser acceptance checklist.
* **Recommendation:**  
  Register `localePt` (`pt-BR`) in `app.config.ts`. Label Section 4 as a "Manual Acceptance Verification Checklist (Browser QA against Local Docker Environment)".
