# Changelog

All notable changes to `@dataemergencia/emergency` are documented here.
The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/)
and [Semantic Versioning](https://semver.org/).

## [Unreleased]

## [0.1.0] - 2026-10-28

### Added

- Framework-agnostic emergency client core: typed phases, transition table,
  typed events, BFF client with CSRF handling, Zustand store per mount.
- Emergency lifecycle: session, resume from `GET /current`, activation with
  geolocation, simulation, refresh/reconcile and confirmed abort.
- Public Pusher subscription for delivery updates with reconnect, tab-focus and
  network-online reconciliation.
- Accessible React 19 panel: dialog semantics, focus trap, Escape close, abort
  and simulation confirmations, resume notification, fallback surface, realtime
  status and feedback.
- Mount API and IIFE bundle (`window.DataEmergenciaEmergency.mount`) with React
  bundled and CSS injected.
- ESM/CJS builds with declarations and extracted CSS.
- Vanilla no-build example, deterministic visual lab with fixture scenarios,
  mock BFF, split-repository workflow and release checklist.
