# Investments Allocator Web Frontend

* **Author:** Gabriel <gabrielssc.ti@gmail.com>
* **Date:** 2026-11-16

## Overview

A personal, single-user Angular web interface (built with Angular Material) for the Investments Allocator service. The application serves as an operational console for the Bastter greedy waterfall portfolio rebalancing engine. It replaces direct curl and manual API interactions with a dedicated interface for two workflows: running the monthly cash contribution ritual (inflow calculation, selection rationale inspection, and trade invoice recording) and maintaining baseline portfolio records (registering instruments, updating conviction scores, and synchronizing holdings). The application is containerized with Docker and served through an Nginx reverse proxy that routes API requests directly to the backend daemon, eliminating cross-origin resource sharing (CORS) friction and consolidating access under a single origin.

## Analysis

The review across seven specialized lenses identified several trade-offs, behavioral invariants, and technical contradictions:

1. **Information Density versus Usability**
   * *Conflict:* Displaying macro classes, micro instruments, conviction scores, target deficits, quote freshness, and allocation rationale simultaneously risks cluttered screens and high cognitive overhead.
   * *Resolution:* Separation of concerns into two primary views:
     * *Monthly Inflow Ritual:* A focused workflow that walks through entering savings in BRL, generating the plan, inspecting the selection rationale, and recording invoice fills leg-by-leg.
     * *Portfolio & Asset Maintenance:* A dense, compact Angular Material table for registering assets, adjusting conviction scores (0 to 10), and updating baseline balances.
     * Within tables, progressive disclosure keeps macro progress bars and net monetary deltas visible while placing technical metadata (such as Yahoo symbols and lot rules) in expandable rows or detail panels.
     * *Symbol Resolution Ergonomics:* Free-form text input without client-side or creation-time external validation. The asset creation form auto-suggests `<TICKER>.SA` when entering B3 tickers, but accepts any text input. Unrecognized or invalid symbols will be caught at snapshot time by the Go backend quote scraper, flagging `quote_stale: true` and `feasible: false`. Backend validation endpoints are deferred as an out-of-scope future improvement.

2. **Mobile Ergonomics versus High-Density Desktop Tables**
   * *Conflict:* Desktop portfolio management benefits from high-density, multi-column tables (`mat-table` with compact density), whereas mobile viewports (360–420px) turn wide tables into unreadable horizontal-scroll zones.
   * *Resolution (Day-0 Responsive Architecture):*
     * *Monthly Inflow Workflow:* Natively formatted as single-column cards and steppers, fully usable on mobile screens while operating brokerage mobile apps.
     * *Portfolio Maintenance:* Uses Angular CDK `BreakpointObserver` to render dense multi-column tables on desktop screens and stacked summary cards on mobile viewports. Detailed fields (Yahoo symbols, lot rules) open in bottom sheets or dialogs.

3. **Fixed-Income Accrued Interest Drift versus Inflow Math**
   * *Conflict:* The Go backend requires `balance_after` when executing legs for `BALANCE_TRACKED` instruments (fixed income / renda fixa). Fixed income accumulates daily yield (CDI/Selic) at the brokerage. If the frontend merely adds the deposit amount to a stale cached balance, the portfolio net worth drifts from reality.
   * *Resolution:* When executing a fixed income leg, the dialog pre-fills `balance_after` with `current_balance + value_bought` while keeping the field editable so the user can enter the exact statement balance reported by the brokerage. Baseline balances are maintained and updated manually by the user on the maintenance view as needed, avoiding complex interest simulation code.

3. **Advisory Plan Proposals versus Real Fill Discrepancies**
   * *Conflict:* In the Bastter methodology, allocation plans are advisory. Real broker executions deviate from proposals due to market price fluctuations, odd-lot rules, and transaction fees.
   * *Resolution:* The execution modal pre-populates the backend's proposed quantity and price for `PRICE_QUOTED` instruments. The user confirms or edits the exact fill quantity, unit execution price in minor units, and broker fees (defaulting to zero). Each leg is executed independently via `POST /api/v1/plans/{id}/legs/{legId}/execute`. If a user opts not to execute a subsequent leg, no manual cancellation is needed; the backend automatically marks remaining pending legs as `SUPERSEDED` when the next monthly inflow is posted.

4. **Single-Origin Deployment versus Multi-Container Overhead**
   * *Conflict:* Hosting the Angular frontend on a separate port or domain requires configuring CORS headers on the Go backend and managing environment-specific API URLs.
   * *Resolution:* A multi-stage Docker build produces static production artifacts served by Nginx. Nginx routes client SPA navigation fallbacks (`try_files $uri $uri/ /index.html;`) and reverse-proxies `/api/v1/`, `/healthz`, and `/readyz` directly to `http://allocator:8080`. This eliminates CORS issues and keeps all traffic on a single exposed port.

5. **Data Representation & Precision Invariants**
   * *Conflict:* JavaScript floating-point arithmetic introduces rounding drift when manipulating currency amounts and percentages.
   * *Resolution:* The frontend performs zero financial math. Currency values are stored and transmitted strictly as integer minor units (`int64` cents in BRL). Allocation weights are handled as integer basis points (`bps`, 10,000 bps = 100%). Custom bidirectional input masking directives format BRL currency strings for display (`R$ 1.500,00`) on blur while binding to minor unit integers internally.

6. **Error Handling & Fail-Fast States**
   * When external quotes fail or return stale data (`quote_stale: true`), the UI surfaces explicit alert badges instead of guessing or falling back silently. If the backend daemon is unreachable, the application displays a prominent connectivity error banner.

## Goals vs. Non-Goals

* **In-Scope Goals:**
  * Single-currency (BRL) monthly inflow calculation and advisory plan generation.
  * Inspection of allocation selection rationale: macro deficit ($\Delta_i$), micro deficit ($\delta_j$), conviction score ($s_j$), and exclusion audit badges (Freio circuit-breaker locks, quarantine flags, quote staleness, and minimum lot constraints).
  * Per-leg trade execution recording with pre-filled, editable invoice inputs (fill quantity, unit price, broker fees defaulting to zero, and statement reconciliation for fixed income).
  * Independent leg execution with automatic backend supersession for unexecuted legs.
  * Day-0 responsive support via Angular CDK `BreakpointObserver`: desktop dense tables and mobile stacked cards.
  * Portfolio maintenance workspace: macro and instrument table, asset registration modal, inline conviction score editing, and baseline position quantity/balance updates.
  * Containerized deployment using Docker and Nginx reverse proxy targeting `http://allocator:8080`.
  * Angular 18/19 application with standalone components and Angular Material.

* **Out-of-Scope Non-Goals:**
  * Direct browser-side scraping via `yahoo-finance2` (violates CORS; all price resolution stays in Go backend).
  * Multi-currency support or foreign exchange conversion.
  * Historical inflow logs or past trade invoice audit explorer.
  * Client-side rebalancing math or portfolio optimization simulations (Go daemon remains the single source of truth).
  * Asset liquidation or sell order recommendations (strictly buy-only rebalancing).
  * Multi-user authentication, roles, or session management (strictly single-user personal tool).
  * Real-time price streaming or intraday candlestick charting.

## Alternatives Weighed

* **Client-Side Yahoo Finance Integration via `yahoo-finance2`:**
  * *Rejected during review:* Yahoo Finance's query endpoints do not support browser cross-origin requests (CORS) and require Node.js-level session/cookie handling. Scrapers inside browser bundles are blocked by browser security policies. Furthermore, the Go backend already maintains an isolated `internal/quote` cache. Running a second scraper in the client duplicates code and state.
* **Browser-to-Backend Direct Communication with CORS:**
  * *Rejected by author:* Required modifying the Go backend daemon to introduce CORS middleware and expose multiple ports. Replaced with an Nginx reverse proxy inside the frontend Docker container to unify routing under a single port.
* **Full CRUD Views for Asset Holdings:**
  * *Rejected by author:* Having a separate dedicated CRUD page for instruments was deemed unnecessary. Instead, inline editing for scores and balances was integrated directly into the portfolio maintenance view alongside an asset registration dialog.
* **Historical Inflow & Trade Audit Dashboard:**
  * *Rejected by author:* Historical ledger browsing adds scope without aiding the core monthly execution task. The application scope is kept strictly to active portfolio status and immediate monthly execution.
* **Client-Side Simulation / Pro-Rata Rebalancing:**
  * *Rejected during review:* Client-side recalculations would risk behavioral timing errors and violate the Bastter greedy waterfall doctrine enforced by the Go engine.
* **Tailwind CSS Utility Styling:**
  * *Rejected by author:* Angular Material was selected to provide consistent, pre-built functional UI components (tables, dialogs, form fields, steppers) without spending effort on custom design systems.

## Key Decisions & Staging for Next Steps

* **Key Decisions Resolved:**
  1. *Stack:* Angular 18/19 standalone components, Angular Material 3, Nginx 1.27, Docker multi-stage build.
  2. *Workflow Model:* Dual-view architecture: "Monthly Inflow Ritual" and "Portfolio & Assets Maintenance".
  3. *Fixed Income Execution:* Requires explicit `balance_after` input, pre-populated with current balance + invested amount, allowing statement reconciliation.
  4. *Leg Execution Independence:* Legs executed independently; unexecuted legs are ignored in the UI and automatically superseded on the backend when subsequent inflows occur.
  5. *Monetary Handling:* BRL-only, integer minor units (`int64`), basis points (`bps`), bidirectional formatting directives.
* **Staging for Next Steps:**
  1. Initialize the Angular project workspace with Angular Material in `/home/guildsmac/development/investments-allocator-fe`.
  2. Establish Dockerfile and Nginx configuration for single-port reverse proxying.
  3. Implement core HTTP services and data models matching the Go backend OpenAPI contract.
  4. Build the Portfolio Maintenance view (summary table, inline score/holding updates, asset registration).
  5. Build the Monthly Inflow workflow (amount input, waterfall execution, rationale card, leg execution modals).
