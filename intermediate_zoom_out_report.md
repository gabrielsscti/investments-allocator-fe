# Intermediate Zoom Out Review Report (Stage 8)

**Target:** `docs/designs/investments_allocator_fe.md` (Lines 1..668)  
**Standard:** `zoom-out-standard.md`  
**Reviewer:** `egm-zoom-out` (Skeptical Architect Goldfish)  

---

## Prioritized Findings

### 1. Critic's `PlanRationaleSnapshot` Mitigation Conflicts with Backend Reality - Severity: Blocker
* **Affected Scope:** G-1 (L37), CUJ 1 (L70), Architecture (L164, L198–200), Detailed Plan (L591–593), and `critic_report.md` Finding #1
* **Discrepancy Description:**  
  Both Comprehension and Critic stages flagged that `RationaleCardComponent` promises macro deficits ($\Delta_i$), micro deficits ($\delta_j$), and bypassed-asset audit badges (`Freio Locked`, `Quarantined`, `Quote Stale`, `Infeasible`) without a backing DTO contract.  
  The Critic's proposed mitigation—adding a `PlanRationaleSnapshot` parser to deserialize `rationale_json`—is unsupported because `inflow.go` (L59–67) confirms `rationale_json` stores only engine metadata and policy flags; it contains **no** macro deltas ($\Delta_i$), **no** micro deficits ($\delta_j$), **no** candidate ranking, and **no** Freio lock states. Attempting to render this breakdown would force the client to recalculate deficits and simulate Bastter exclusion rules locally, directly violating Goal G-4 ("Zero Financial Math on Client") and Non-Goal NG-3 ("Client-Side Rebalancing Simulation").
* **Recommendation:**  
  Drop the speculative candidate-bypass audit card and the complex `PlanRationaleSnapshot` parser. In the Bastter methodology, rebalancing instructions are actionable commands. Keep the Inflow view focused on the actionable plan returned by `POST /api/v1/inflows` (contribution amount, `PlanLeg` buy instructions, and `expected_remainder_minor_units`), while leaving macro deltas (`delta_minor_units`) and asset status badges (`quarantined`, `quote_stale`, `feasible`) on the Portfolio Maintenance view where they naturally belong.

---

### 2. Guard Against Over-Scoped Mitigations - Severity: Major
* **Affected Scope:** `critic_report.md` Findings #5, #6, #7, #11; `comprehension_report.md` Findings #3, #7, #9; Design Doc (L546–618)
* **Discrepancy Description:**  
  - **Background Health Polling (YAGNI):** Polling `/readyz` periodically adds unnecessary background machinery for a single-user tool. Initial `getSummary()` on boot plus `api-error.interceptor.ts` catching 502/503 errors on user actions already detects outages.
  - **Over-Scoped Risk Mitigations:** Adding `## Risks & Mitigations` is structurally sound, but adding complex mitigations for pagination or multi-tab sync is over-engineering for a personal portfolio. Document these as accepted constraints for personal scale.
  - **Quarantine Modal Bloat:** A separate quarantine modal is excessive. Use an inline toggle on the Maintenance row or omit quarantine management from v1 if not needed.
  - **Cross-Repo Docker Compose Coupling:** `docker-compose.yml` cannot reference an external container with `depends_on`. The frontend Compose file should simply join an `external: true` network, paired with a standard Angular `proxy.conf.json` for local development.

---

### 3. Over-Engineered State Layer & Micro-Component Fragmentation - Severity: Major
* **Affected Scope:** Architecture Tree (L149–180), State Management (L214–219), Detailed Plan (L563–585, L605–607)
* **Discrepancy Description:**  
  - Injecting `BreakpointObserver` into `PortfolioStoreService` couples presentation layout to an entity data store. Keep `BreakpointObserver` in `MaintenanceComponent` where responsive layout changes occur.
  - Splitting `score-editor.component.ts`, `status-badge.component.ts`, and `error-banner.component.ts` into separate standalone files creates unnecessary micro-component boilerplate when standard Angular Material primitives (`mat-form-field`, `mat-chip`, `MatSnackBar`) can be used directly.
  - Hand-rolled keystroke-level currency masking (`[brlCurrencyMask]`) introduces fragile caret and mobile input edge cases. Use a standard number input converted to minor units on submission or integrate `ngx-mask`.

---

### 4. Altitude Drops & Concrete Contract Alignments - Severity: Major
* **Affected Scope:** CUJ 3 (L81–88), Section 4 (L227–352), Section 7 (L381–438), Detailed Plan (L542, L567, L596)
* **Discrepancy Description:**  
  - Inlining full 60-line `Dockerfile` and `nginx.conf` snippets in Section 7 creates altitude drops and produced contradictions with the Detailed Plan (root port 80 vs non-root promise). Replace verbatim code with high-level container invariants.
  - Decouple Docker `HEALTHCHECK` from backend `/healthz` proxying to prevent container termination when the backend is temporarily offline.
  - Fetch active plan on boot via `GET /api/v1/plans?status=PENDING&status=PARTIALLY_EXECUTED` to prevent losing Leg 2 on mobile tab reload.
  - Align `ExecuteLegRequest` mapping for fixed income: send `price_minor_units_per_unit: "1"` (par), `qty` matching contribution, and `balance_after`.
  - Align `api-error.interceptor.ts` with backend `ErrorResponse` schema (`{ error: string }`) and handle non-JSON HTML 502 responses.

---

### 5. Minor Consistency & Copy Cleanup - Severity: Nit
* **Affected Scope:** Document-wide
* **Discrepancy Description:**  
  - Fold `plan-legs-table.component.ts` into `inflow-ritual.component.ts` or list it explicitly in the Detailed Plan file list.
  - Remove unused `excluded_macro_names` from v1 DTOs.
  - Pin a single Angular major version (e.g. Angular 19).
  - Align `41,55` vs `4150` in CUJ 1 and sequence diagram.
  - Strip uncalibrated claims and bare `"Rejected by author."` prefixes.
