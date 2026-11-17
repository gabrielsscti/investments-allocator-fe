# Comprehension Test Report (Stage 6)

**Target:** `docs/designs/investments_allocator_fe.md`  
**FeatureRange:** 1..518  
**DetailedRange:** 519..668  
**Reviewer:** `egm-comprehension` (Naive Reader Goldfish)  

---

## Paraphrase

### What this proposes
The document proposes building `investments-allocator-fe`, a single-user Angular 18/19 and Angular Material web console for the existing Go `investments-allocator` backend, packaged in a Docker container behind an Nginx reverse proxy on port 80. It provides two responsive workflows (dense desktop tables and stacked mobile cards): a Monthly Inflow Ritual to enter savings in BRL, trigger greedy waterfall allocation calculations, inspect asset-selection rationale, and record real-world equity or fixed-income trade fills leg-by-leg; and a Portfolio Maintenance workspace to inspect macro allocations, register instruments, adjust conviction scores, and edit baseline holdings. All financial math and quote fetching remain exclusively on the Go backend, while the frontend stores monetary values as integer minor units (`int64` cents) via custom input masking and decimal strings to prevent JavaScript floating-point drift. Multi-currency support, historical inflow/trade browsing, client-side simulations, sell orders, and authentication are explicitly excluded.

### How the existing system works, per this document
The existing system is a Go backend daemon (`investments-allocator` on port 8080, backed by SQLite `allocator.db` and a SQLite quote cache) that implements the Bastter buy-only greedy waterfall rebalancing methodology and scrapes market quotes from Yahoo Finance. Users currently interact with it manually via `curl` commands and terminal scripts against its REST API (`/api/v1/summary`, `/api/v1/inflows`, `/api/v1/plans/{id}/legs/{legId}/execute`, `/api/v1/macros/{macroName}/instruments`, `/api/v1/instruments/{id}`, `/api/v1/positions/{id}/holding`, plus `/healthz` and `/readyz`). For each inflow, the backend computes deficits, filters out ineligible instruments (such as assets affected by *Freio* locks, governance quarantine, lot constraints, or stale quotes), produces a multi-leg allocation plan, and automatically marks unexecuted `PENDING` legs from a previous plan as `SUPERSEDED` when a new inflow is posted.

---

## Prioritized Findings

### 1. Selection Rationale Data Contract Omission - Severity: Blocker
* **Affected Scope:** Goals G-1 (L37), CUJ 1 (L70), Section 2 (L164), Section 3 (L198), Section 4 (L235–307), Detailed Implementation Plan (L591–593)
* **Discrepancy Description & Rationale:** The document specifies `RationaleCardComponent` to render why the neediest asset won—specifically macro deficit ($\Delta_i$), micro deficit ($\delta_j$), conviction score ($s_j$), and exclusion audit badges (`Freio Locked`, `Quarantined`, `Quote Stale`, `Infeasible`) for bypassed assets—and states in the sequence diagram that `POST /api/v1/inflows` returns `Plan with Legs & Rationale`. However, the TypeScript interfaces in Section 4 contain no rationale payload, no bypassed-assets list, no micro deficit ($\delta_j$), and no *Freio* status field in `PlanResponse`, `PlanLeg`, `InstrumentSummary`, or `MacroInstrumentView`. Because Goal G-4 forbids client-side financial math, it is impossible for an implementer to determine where `RationaleCardComponent` obtains $\delta_j$ or bypass audit reasons.

### 2. Undefined Domain Concept — *Freio* - Severity: Blocker
* **Affected Scope:** The Problem (L27), CUJ 1 (L70), Section 2 (L178), Detailed Implementation Plan (L582)
* **Discrepancy Description & Rationale:** The project/domain-specific term *Freio* ("*Freio* circuit breaker", "*Freio* lock", `Freio Locked` badge) is cited as a primary reason assets are bypassed during allocation, yet it is never defined inline or directly linked to its specification in `bastter_description.md` (L508), nor does it appear in any DTO in Section 4. A fresh reader cannot determine what *Freio* means, how it differs from `Quarantined` or `Infeasible`, or which API field triggers the `Freio Locked` badge.

### 3. Governance Quarantine Definition & Missing UI Workflow - Severity: Major
* **Affected Scope:** The Problem (L27), Section 4 (L246–247), Detailed Implementation Plan (L559, L582)
* **Discrepancy Description & Rationale:** "Governance quarantine" (`quarantined`, `quarantined_note`, `Quarantined` badge) is referenced without explaining what puts an asset into quarantine or how it affects allocation. Furthermore, `PortfolioApiService` includes `setQuarantine(id, payload)` (L559), but Section 4 defines no request DTO for it, and the Maintenance UI specification (L598–608) and CUJs describe no UI control or dialog to quarantine/unquarantine an instrument.

### 4. `ExecuteLegRequest` Contract & Parameter Mapping for `BALANCE_TRACKED` - Severity: Major
* **Affected Scope:** CUJ 3 (L81–88), Section 4 (L310–316), Detailed Implementation Plan (L596)
* **Discrepancy Description & Rationale:** `ExecuteLegRequest` marks `qty: string`, `price_minor_units_per_unit: string`, and `fees_minor_units: number` as required fields alongside `balance_after?: number`. CUJ 3 only describes editing and posting `balance_after`, leaving unstated what values must be sent for `qty`, `price_minor_units_per_unit`, and `fees_minor_units` when settling a `BALANCE_TRACKED` leg (i.e. unit price `"1"` and `qty` as deposit amount). Additionally, [L596] states that the dialog pre-populates `balance_after` by computing `current_balance + contribution`, which performs client-side monetary addition despite the strict "Zero Client-Side Math" invariant (G-4, State Invariant 1).

### 5. `.SA` Suffix Auto-Suggestion & Undefined Macro Classification - Severity: Major
* **Affected Scope:** Goals G-3 (L39), CUJ 2 (L78), Section 4 (L260–267), Detailed Implementation Plan (L604)
* **Discrepancy Description & Rationale:** `RegisterAssetDialogComponent` is specified to auto-suggest `<TICKER>.SA` for "B3 assets" / "Brazilian macro classes" (neither the B3 exchange nor Yahoo Finance's `.SA` São Paulo suffix is defined). However, `MacroSummary` only contains `name: string` (e.g., `"National Stocks"`) with no country, exchange, or currency metadata, leaving unstated how the frontend identifies which macro classes qualify as Brazilian.

### 6. Missing Component in Detailed Plan & Unclear Mutation Endpoint Mapping - Severity: Major
* **Affected Scope:** Section 2 (L165), CUJ 2 (L79), Section 4 (L235–250, L341–351), Detailed Implementation Plan (L559, L587–608)
* **Discrepancy Description & Rationale:** `src/app/features/inflow/plan-legs-table.component.ts` appears in the Section 2 architecture tree (L165) and is referenced at [L590], but is missing from "Target Files to Create/Modify" (L587–597). Also, CUJ 2 invokes `PUT /api/v1/positions/{id}/holding` and `ScoreEditorComponent` invokes `PUT /api/v1/instruments/{id}`, but Section 4 neither documents these endpoint paths on the mutation DTOs nor clarifies whether `{id}` in `/positions/{id}/holding` is `InstrumentSummary.id` or a position ID.

### 7. Local Dev Proxy & Cross-Repo Docker Compose Configuration - Severity: Major
* **Affected Scope:** Section 1 (L106), Alternatives (L453–456), Detailed Implementation Plan (L546–548, L624)
* **Discrepancy Description & Rationale:** Nginx eliminates CORS in Docker deployments, yet `README.md` documents running `npm start` for local development without mentioning an Angular `proxy.conf.json` for `:4200` to communicate with the Go backend on `:8080`. Additionally, `docker-compose.yml` specifies joining "the backend Docker bridge network" and setting a service dependency on `allocator`, but because `investments-allocator` resides in a separate repository, `depends_on` cannot reference an external service, and the external network name is unstated.

### 8. `Dockerfile` Non-Root User vs. Port 80 Contradiction - Severity: Major
* **Affected Scope:** Section 7 (L382–399), Detailed Implementation Plan (L542)
* **Discrepancy Description & Rationale:** The Detailed Plan states that `Dockerfile` "Configures non-root user execution," but the concrete `Dockerfile` in Section 7 contains no `USER` directive and binds privileged port `80` (`listen 80`), which standard non-root Nginx users cannot bind without additional capabilities or shifting to an unprivileged port like 8080.

### 9. Health Status Polling & Non-JSON `502` Error Handling - Severity: Major
* **Affected Scope:** Section 3 (L214–219), Non-Functional Requirements (L499), Detailed Implementation Plan (L567–568, L618)
* **Discrepancy Description & Rationale:** `AppComponent` renders a "backend connectivity health status indicator," yet neither `PortfolioStoreService` nor the API services define how `/readyz` is polled or how the indicator recovers after a failure. Additionally, `api-error.interceptor.ts` assumes backend structured JSON errors (`code`, `message`, `details`) without defining how it handles non-JSON HTML `502 Bad Gateway` responses generated directly by Nginx when the backend is down.

### 10. Unused `excluded_macro_names` Field - Severity: Nit
* **Affected Scope:** Section 4 (L279, L306)
* **Discrepancy Description & Rationale:** `CreateInflowRequest` and `PlanResponse` include `excluded_macro_names`, which is never mentioned in Goals, CUJs, or UI components.

### 11. Minor Terminological & Notation Inconsistencies - Severity: Nit
* **Affected Scope:** Overview (L11), CUJ 1 (L70–71), Section 3 (L204), Section 4 (L244–245), Section 6 (L374), Detailed Implementation Plan (L528, L601, L621, L657–662)
* **Discrepancy Description & Rationale:**
  - CUJ 1 records fill price `41,55`, while sequence diagram (L204) shows `Price: 4150` for the same leg.
  - L374 and L601 write `mat-table (mat-density: -2)` as an attribute, while L621 uses the Sass mixin `@include mat.all-component-densities(-2);`.
  - Package target specifies "Angular 18/19" instead of pinning a specific major version.
  - E2E verification does not clarify whether it is an automated suite or manual verification.
  - Domain terms `CDI/Selic`, `lot_rules`, and `min_investment_minor_units` lack brief inline explanations.
