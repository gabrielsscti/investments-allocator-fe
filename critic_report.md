# Critic Review Report (Stage 7)

**Target:** `docs/designs/investments_allocator_fe.md` (Lines 1..518)  
**Reviewers:** `egm-design` (Hostile Design Critic), `egm-structural` (Structural Layout Validator), `egm-style` (Technical Copy Editor)  
**Standard:** `feature-spec-standard.md`  

---

## Prioritized Findings

### 1. Unspecified Rationale Schema & Missing `rationale_json` in DTOs - Severity: Blocker
* **Reviewer Lens:** `egm-design`, `egm-comprehension`, `egm-zoom-out`
* **Affected Scope:** Goals G-1 (L37–38), CUJ 1 (L70–71), Section 2 (L164), Section 3 (L198–200), Section 4 (L299–307), Detailed Implementation Plan (L591–593)
* **Discrepancy Description:**  
  A primary requirement of the application is rendering the Bastter decision rationale (macro deficit $\Delta_i$, micro deficit $\delta_j$, conviction score $s_j$, and Freio/quarantine audit badges). However, the backend OpenAPI contract returns an opaque JSON string: `rationale_json: string`. In the TypeScript interface `PlanResponse` (L299–307), `rationale_json` is completely omitted, and neither `PlanResponse` nor `PlanLeg` contains any deficit properties. Because Goal G-4 strictly forbids client-side financial math, the frontend has no specified contract or deserialization mechanism to extract these metrics from `rationale_json`.
* **Recommendation:**  
  1. Add `rationale_json?: string;` to `PlanResponse`.
  2. Define `PlanRationaleSnapshot` in `inflow.models.ts` representing the deserialized structure of `rationale_json` (macro deltas, candidate metrics, and engine exclusion codes).
  3. Specify how `PortfolioStoreService` or `RationaleCardComponent` safely parses and transforms this JSON string into presentational view models with fallback error handling.

---

### 2. Fixed-Income Fill Execution Violates OpenAPI Required Schema - Severity: Blocker
* **Reviewer Lens:** `egm-design`, `egm-comprehension`, `egm-zoom-out`
* **Affected Scope:** CUJ 3 (L81–88), Section 4 (L310–316), Detailed Implementation Plan (L594–597), Verification Plan (L645–648)
* **Discrepancy Description:**  
  CUJ 3 and the Verification Plan state that executing a `BALANCE_TRACKED` fixed-income leg submits a payload containing only `balance_after`. However, the Go backend OpenAPI contract for `POST /api/v1/plans/{id}/legs/{legId}/execute` (`ExecuteLegRequest`) marks both `qty` and `price_minor_units_per_unit` as **strictly required** schema properties. Submitting without these properties will trigger HTTP `400 Bad Request` from the backend validator.
* **Recommendation:**  
  Explicitly specify the required fixed-income payload mapping in `inflow.models.ts` and `ExecuteLegDialogComponent`:
  - Set `price_minor_units_per_unit: "1"` (par).
  - Set `qty` to the string decimal of the contribution amount.
  - Set `fees_minor_units: 0` (or actual fees).
  - Include `balance_after`.

---

### 3. Active Plan Session Loss on Browser Refresh - Severity: Major
* **Reviewer Lens:** `egm-design`, `egm-inventive-catalyst`
* **Affected Scope:** Non-Goals NG-2 (L49–50), CUJ 4 (L89–99), Section 2 (L159), Section 3 (L216), Core Services (L560–566)
* **Discrepancy Description:**  
  Under Non-Goal NG-2, querying plans is excluded, so `InflowApiService` only provides `postInflow` and `executeLeg`. `PortfolioStoreService` retains the `activePlan` strictly in an ephemeral in-memory signal. In CUJ 4, a user executes Leg 1 and leaves Leg 2 pending. If the user refreshes their browser, closes the tab, or switches apps on mobile, `activePlan` resets to `null`. Because there is no endpoint to fetch the active plan (`GET /api/v1/plans?status=PENDING&status=PARTIALLY_EXECUTED`), the user loses access to Leg 2 and cannot complete it without posting a new inflow that prematurely supersedes it.
* **Recommendation:**  
  Differentiate between arbitrary historical audit browsing and retrieving the active actionable plan. Add `getActivePlan()` to `InflowApiService` wrapping `GET /api/v1/plans?status=PENDING&status=PARTIALLY_EXECUTED` and rehydrate `activePlan` in `PortfolioStoreService` on app initialization.

---

### 4. Container Health Check Cascading Failure & Nginx Boot Crash - Severity: Major
* **Reviewer Lens:** `egm-design`, `egm-inventive-catalyst`, `egm-comprehension`
* **Affected Scope:** Containerization Architecture (L381–438), NFR §3 Resilience (L498–501), Detailed Implementation Plan (L542)
* **Discrepancy Description:**  
  The Dockerfile specifies `HEALTHCHECK ... CMD wget http://127.0.0.1:80/healthz`, which Nginx proxies to `http://allocator:8080/healthz`. If the backend daemon restarts or warms its cache, Nginx returns 502, Docker marks the frontend container unhealthy, and restarts it. This prevents the browser from loading the SPA and rendering the designed 502 connectivity banner. Additionally, static `proxy_pass http://allocator:8080` without dynamic resolver configuration can cause Nginx to crash at boot if the backend container is not yet ready.
* **Recommendation:**  
  1. Decouple frontend container health: configure Dockerfile `HEALTHCHECK` to probe static file serving locally (`wget -q --spider http://127.0.0.1:80/ || exit 1`).
  2. Configure dynamic DNS resolution in `nginx.conf` (`resolver 127.0.0.11 valid=10s; set $upstream allocator:8080; proxy_pass http://$upstream/api/v1/;`) or enforce explicit compose service dependency.

---

### 5. Missing UI Workflows for Quarantine and Instrument Deletion - Severity: Major
* **Reviewer Lens:** `egm-design`, `egm-comprehension`
* **Affected Scope:** CUJ 2 (L74–80), Section 4 (L246–247), Detailed Implementation Plan (L559, L600–608)
* **Discrepancy Description:**  
  1. `PortfolioApiService` lists `setQuarantine(id, payload)`, but Section 4 defines no request DTO for it, and the Maintenance UI provides no control or dialog to toggle quarantine status or enter audit notes.
  2. Because asset registration allows free-form ticker input, users may introduce typographical errors. The backend provides `DELETE /api/v1/instruments/{id}` (for positions with no trade history), but the frontend provides no `deleteInstrument` method or UI action, trapping users with mistyped entries.
* **Recommendation:**  
  1. Add `SetQuarantineRequest { quarantined: boolean; note?: string; }` to `portfolio.models.ts` and describe a quarantine toggle modal in `maintenance.component.ts`.
  2. Add `deleteInstrument(id: number)` to `PortfolioApiService` and expose a delete action for unheld instruments in the maintenance view.

---

### 6. Missing Dedicated Risks & Mitigations Section - Severity: Major
* **Reviewer Lens:** `egm-structural`
* **Affected Scope:** Document-wide (Lines 1..518), specifically Section 2 (Non-Functional Requirements, L488–501)
* **Discrepancy Description:**  
  `feature-spec-standard.md` requires explicit documentation of constraints, failure modes, security implications, scalability limits, and mitigations. The specification lacks a dedicated `## Risks & Mitigations` section and omits analysis of scalability limits (unpaginated table rendering), unauthenticated local-network exposure, and concurrent-tab state drift.
* **Recommendation:**  
  Add `## Risks & Mitigations` explicitly documenting risks and mitigations for:
  - Local network exposure without authentication.
  - Scalability limits of unpaginated client tables.
  - Multi-tab synchronization / backend supersession state drift.
  - Unvalidated ticker typographical errors.

---

### 7. Local Dev Proxy & Cross-Repo Docker Compose Configuration - Severity: Major
* **Reviewer Lens:** `egm-comprehension`
* **Affected Scope:** Section 1 (L106), Alternatives (L453–456), Detailed Implementation Plan (L546–548, L624)
* **Discrepancy Description:**  
  Nginx eliminates CORS in production Docker deployments, but running `npm start` locally requires an Angular `proxy.conf.json` to proxy `/api/v1` to `:8080` without triggering CORS errors. Additionally, `docker-compose.yml` specifies joining the backend Docker bridge network, but because `investments-allocator` resides in a separate repo, the external network name must be explicitly configured as `external: true`.
* **Recommendation:**  
  Document `proxy.conf.json` for local development in `package.json` / `angular.json` and declare the external Docker network name in `docker-compose.yml`.

---

### 8. Dockerfile Non-Root User vs. Port 80 Contradiction - Severity: Major
* **Reviewer Lens:** `egm-comprehension`
* **Affected Scope:** Section 7 (L382–399), Detailed Implementation Plan (L542)
* **Discrepancy Description:**  
  The Detailed Plan states the Dockerfile "Configures non-root user execution," but the concrete `Dockerfile` in Section 7 contains no `USER` directive and binds privileged port `80`, which non-root users cannot bind without additional kernel capabilities.
* **Recommendation:**  
  Align the container specification: retain standard Nginx root startup for port 80 or shift to an unprivileged port (e.g., 8080) with a non-root user directive.

---

### 9. Overstated Performance Claims & Promotional Buzzwords - Severity: Major
* **Reviewer Lens:** `egm-style`
* **Affected Scope:** Overview (L13, L17), Problem (L23), Goals (L40, L42), Section 5 (L359), Section 6 (L367, L372), NFR §2 (L495–496), Alternatives (L463, L484)
* **Discrepancy Description:**  
  - "Instant Interaction / under 1 second guarantee" (L495–496) is an uncalibrated performance claim.
  - Claiming the client stores `int64` and "completely avoids JavaScript floating-point conversions" is technically inaccurate because JavaScript `number` is an IEEE-754 float (safe integer up to $2^{53}-1$).
  - Buzzwords and promotional phrasing ("Day-0", "disciplined, usability-first", "transparent mathematical rationale", "high operational friction", "cognitive opacity") conflict with dry Plain-English standards.
* **Recommendation:**  
  Calibrate performance text to target benchmarks, rephrase monetary representation to "integer minor units within JavaScript safe-integer bounds (`number`) matching backend `int64` contracts", replace "Day-0" with "Responsive Support", and substitute factual engineering terminology for promotional buzzwords.

---

### 10. Unlinked Author Attribution in Alternatives Considered - Severity: Major
* **Reviewer Lens:** `egm-structural`, `egm-design`
* **Affected Scope:** Alternatives Considered (L442–485)
* **Discrepancy Description:**  
  All six alternatives open with `"Reason for Rejection: Rejected by author."` without an issue or PR link, violating *The Alternatives Rule* of `feature-spec-standard.md`.
* **Recommendation:**  
  Remove the bare `"Rejected by author."` prefix and lead directly with technical trade-offs (e.g. `"Reason for Rejection: Rejected due to browser cross-origin policy restrictions..."`).

---

### 11. Minor Consistency & Formatting Refinements - Severity: Nit
* **Reviewer Lens:** `egm-design`, `egm-structural`, `egm-style`
* **Affected Scope:** Document-wide
* **Items:**
  - Add `target_bps_within_macro: number;` to `InstrumentSummary`.
  - Fix relative links in `## Additional Resources` to resolve against sibling repo (`../../../investments-allocator/...`).
  - Convert CUJ 2 into symmetric `Given -> When -> Then -> When -> Then` steps.
  - Insert missing blank lines before headings and code fences.
  - Clarify whether E2E verification is automated or manual.
  - Provide proactive background polling check against `/readyz` in `portfolio-api.service.ts`.
