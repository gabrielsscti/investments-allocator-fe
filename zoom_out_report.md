# Initial Zoom Out Review Report (Stage 5)

**Target:** `docs/designs/investments_allocator_fe.md` (Lines 1..668)  
**Reviewers:** `egm-zoom-out` (Skeptical Architect), `egm-inventive-catalyst` (TRIZ Software Contradiction Auditor)  
**Standard:** `zoom-out-standard.md`  

---

## Prioritized Findings

### 1. Backend Contract Disconnect & Speculative Rationale Visualization - Severity: Blocker
* **Reviewer Lens:** `egm-zoom-out` & `egm-inventive-catalyst`
* **Affected Scope:** Goals G-1 (L37), CUJ 1 (L70), Architecture (L164, L198-L200), Implementation Plan (L591-L594)
* **Discrepancy Description:**  
  The design specifies an elaborate `rationale-card.component.ts` tasked with rendering a decision audit explaining why the neediest asset was chosen (macro delta $\Delta_i$, micro delta $\delta_j$, conviction score $s_j$) and listing bypassed assets with reason badges (Freio locks, quarantine flags, quote staleness, minimum lot constraints).  
  However, inspecting the Go backend contract in `openapi.yaml` and `internal/app/inflow.go` confirms that `POST /api/v1/inflows` and `PlanResponse` do **not** return candidate deficits, runner-up rankings, or bypassed assets with reason codes. The backend's `rationale_json` only captures macro targets and engine policy flags. Rendering this card would force the client to simulate deficit calculations and skip rules locally, directly violating Goal G-4 ("Zero Financial Math on Client") and Non-Goal NG-3 ("Client-Side Rebalancing Simulation").
* **Recommendation:**  
  Align with the Bastter doctrine: rebalancing instructions are actionable commands. Present the proposed execution legs with proposed quantities, prices, and gross amounts. Macro targets, deltas, conviction scores, and asset statuses are already visible on the Portfolio Maintenance view. Drop the speculative candidate-bypass audit card or reduce it to an inflow summary showing contribution amount, target macro class, and expected remainder.

---

### 2. Container Health Check Cascading Failure Coupling - Severity: Major
* **Reviewer Lens:** `egm-inventive-catalyst`
* **Affected Scope:** Containerization Pipeline (L381-L438, `Dockerfile`, `nginx.conf`) and NFR §3 Resilience (L498-L501)
* **Discrepancy Description:**  
  The frontend Docker `HEALTHCHECK` executes `wget http://127.0.0.1:80/healthz`, which Nginx proxies to the backend daemon (`http://allocator:8080/healthz`). If the backend daemon restarts, recompiles, or warms its quote cache, Nginx returns `502 Bad Gateway`. Docker interprets this as a frontend container failure, marks the container `unhealthy`, and triggers orchestrator restarts. Consequently, the browser cannot load the Angular SPA bundle to display the designed persistent connectivity error banner (`error-banner.component.ts`), breaking the fault-isolation model promised in NFR §3.
* **Recommendation:**  
  Decouple the frontend container's internal liveness probe from the proxied backend probes. Configure the frontend Docker `HEALTHCHECK` to probe Nginx's ability to serve static assets locally (e.g. `CMD wget -q --spider http://127.0.0.1:80/ || exit 1`), while retaining `/healthz` and `/readyz` reverse proxy passes for external cluster ingress.

---

### 3. Ephemeral Active Plan State vs. Asynchronous Multi-Step Workflow - Severity: Major
* **Reviewer Lens:** `egm-inventive-catalyst`
* **Affected Scope:** Reactive State Management (L183-L221), Core Services (L560-L566), CUJ 1 & CUJ 4, Non-Goals NG-2 (L49-L50)
* **Discrepancy Description:**  
  Because historical ledgers are out of scope (NG-2), the active monthly allocation plan is treated strictly as ephemeral in-memory signal state created only via `POST /api/v1/inflows`. In practice, users calculate an allocation, switch to a mobile banking app to execute leg 1, and return to record execution. On mobile browsers (which Day-0 Responsive targets), switching apps frequently triggers tab hibernation or page reload. Upon reload, `activePlan` resets to `null`, and `inflow-api.service.ts` lacks any method to query active plans (`GET /api/v1/plans?status=PENDING,PARTIALLY_EXECUTED`). Submitting savings again invokes `POST /api/v1/inflows`, which recalculates on already-altered holdings and forcefully supersedes the pending plan.
* **Recommendation:**  
  Distinguish between *historical audit exploration* and *active session rehydration*. Add `getActivePlan()` (leveraging backend `GET /api/v1/plans?status=PENDING&status=PARTIALLY_EXECUTED`) to `inflow-api.service.ts`. In `portfolio-store.service.ts`, rehydrate active plan state on store initialization if an actionable plan is pending.

---

### 4. Incomplete Leg Execution Payload for Fixed Income (`BALANCE_TRACKED`) - Severity: Major
* **Reviewer Lens:** `egm-zoom-out`
* **Affected Scope:** Technical Plan (L310-L316), Feature Plan (L594-L597)
* **Discrepancy Description:**  
  The design specifies sending `balance_after` for fixed income in CUJ 3, but fails to account for the backend's strict OpenAPI schema for `POST /api/v1/plans/{id}/legs/{legId}/execute`. In `internal/storage/trades.go` (L27-L43), `qty` and `price_minor_units_per_unit` remain required fields for all asset kinds. For `BALANCE_TRACKED` assets, unit price must be sent as `"1"` (par) and `qty` must equal the deposit amount. Omitting this mapping will cause fixed income execution requests to fail with 400 Bad Request.
* **Recommendation:**  
  Explicitly specify the fixed-income execution payload mapping in `inflow.models.ts` and `execute-leg-dialog`: for `BALANCE_TRACKED` instruments, set `price_minor_units_per_unit: "1"`, set `qty` to the string decimal of the deposit amount, and provide `balance_after`.

---

### 5. Over-Engineering State Layer & Component Fragmentation - Severity: Major
* **Reviewer Lens:** `egm-zoom-out`
* **Affected Scope:** Architecture Tree (L149-L180), Reactive State (L212-L220), Implementation Plan (L580-L585, L605-L607)
* **Discrepancy Description:**  
  `PortfolioStoreService` ingests CDK `BreakpointObserver` to expose `isMobile`, mixing viewport presentation logic into an entity data store. Additionally, breaking out trivial 2–3 line UI controls into standalone micro-components (`score-editor.component.ts`, `status-badge.component.ts`, `error-banner.component.ts`) adds unnecessary abstraction when Angular Material provides `MatChip` and `MatSnackBar`.
* **Recommendation:**  
  Keep `BreakpointObserver` in the presentation layer (or a shared UI layout service). Use Angular Material components directly (`mat-chip`, `mat-form-field` inside table cells) rather than introducing micro-component wrappers.

---

### 6. Hand-Rolled Keystroke-Level Currency Masking (YAGNI) - Severity: Nit
* **Reviewer Lens:** `egm-zoom-out`
* **Affected Scope:** Technical Plan (L356-L365), Implementation Plan (L571-L573)
* **Discrepancy Description:**  
  Implementing a custom bidirectional `ControlValueAccessor` masking directive that parses raw keystrokes, shifts integer cents dynamically, and manages cursor placement introduces extensive edge-case complexity (backspace, paste, selection ranges, mobile keyboards).
* **Recommendation:**  
  Use a standard `<input type="number" step="0.01">` converted to minor units (`Math.round(val * 100)`) on submission or integrate an established library like `ngx-mask`.

---

### 7. Passive Connectivity Indication vs. Shell Health Indicator Promise - Severity: Nit
* **Reviewer Lens:** `egm-inventive-catalyst`
* **Affected Scope:** Application Shell (L616-L618), Core Services (L557-L566)
* **Discrepancy Description:**  
  The shell promises a "backend connectivity health status indicator" in the top navigation toolbar, yet no service in `src/app/core/services/` is designated to query `/healthz` or `/readyz`.
* **Recommendation:**  
  Expose a lightweight check in `portfolio-api.service.ts` against `/readyz` on application bootstrap and window focus.
