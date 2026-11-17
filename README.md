# Investments Allocator Frontend (`investments-allocator-fe`)

Angular 19 + Angular Material 3 single-user web console for the **Investments Allocator** rebalancing engine.

## Overview

- **Methodology**: Follows the Bastter greedy waterfall rebalancing methodology.
- **Precision**: Zero floating-point drift. All monetary values are processed as integer minor units (cents in BRL).
- **Architecture**: Modern standalone Angular 19 components with Angular Signals, Angular Material 3, and reverse-proxied via Nginx.
- **Responsive**: Fully responsive across desktop (dense `mat-table`) and mobile (stacked cards via Angular CDK `BreakpointObserver`).

## Prerequisites

- Node.js 22+ (tested with Node.js 24)
- npm 10+
- Go allocator backend running on `http://localhost:8080` (or Docker network `investments-allocator_default`)

## Local Development

```bash
# Install dependencies
npm install

# Start development server with proxy to backend on :8080
npm start
# or: ng serve --proxy-config proxy.conf.json
```

Open `http://localhost:4200` in your browser.

## Build and Test

```bash
# Production build
npm run build

# Run unit tests
npm test -- --watch=false --browsers=ChromeHeadless
```

## Docker Containerization

```bash
# Build Docker image
docker build -t investments-allocator-fe:latest .

# Run with Docker Compose
docker compose up -d
```
