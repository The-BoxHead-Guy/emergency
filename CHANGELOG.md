# Changelog

All notable changes to `@dataemergencia/emergency` are documented here.
The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/)
and [Semantic Versioning](https://semver.org/).

## [Unreleased]

## [0.2.0] - 2026-11-03

### Added

- Runtime injection of the Google Sans, Montserrat and Poppins Google Fonts,
  configurable per family through the `fontLoading` mount option. Font
  installation now happens independently of controller creation.

### Changed

- Geolocation failures now surface as the standard error feedback card, which
  can be dismissed and auto-dismisses after five seconds, instead of the inline
  phone fallback card. Their messages guide users to grant permission or retry
  instead of directing them to call. The `emergency:fallback` event still
  carries the host fallback configuration.
- The abort and simulation confirmation dialogs now follow the original
  `bp.scaem.app` modal skin: evenly padded body and footer, an unboxed 4rem icon
  at 75% opacity, an `h5` title that shares the body text colour at a heavier
  weight, lighter body text, and full-width `scaem-btn` actions that grow inside
  the footer, which is reversed so cancel sits on the right. The card is capped
  at 28rem on desktop. Simulation keeps its blue confirm action, while cancel is
  a neutral transparent action with a light hover background. The abort confirm
  action darkens on hover through the new `--de-emergency-red-pressed` token.
- The `emergency` icon is drawn as a filled Star of Life with its own 640x640
  viewBox, and the refreshed paramedical mark artwork moved to
  `react/components/icons` alongside the other icons.
- Status panel layout: footer actions are centered and no longer wrap, buttons
  are wider on mobile, and spacing plus header contrast were adjusted with a
  new `--de-emergency-primary-foreground` token.
- Feedback message icons reuse the shared `status-icon` sizing, feedback text
  uses balanced wrapping, and the generic error title now reads
  `Ha ocurrido un error`.
- Abort and simulation feedback now hides the status panel and dismisses itself
  after three seconds, so the panel comes back without an extra click.

### Fixed

- Activation failures now surface as the transient error feedback card, which
  auto-dismisses like geolocation errors, instead of the persistent error
  surface that rendered alongside the paramedical mark and question.
- Dismissing failed simulation or abort feedback now removes the
  acknowledged message without revealing the generic error surface again.
- The illustration and question are hidden while the emergency session loads,
  with the spinner centered in a column.
- The illustration and question are also hidden while abort or simulation
  feedback is displayed, so transient results do not compete with the idle
  prompt.
- Footer actions are disabled while feedback is displayed, since they cannot
  run until the feedback is dismissed.

### Removed

- The inline `EmergencyFallback` phone surface, its component and its
  `fallbackTitle`, `fallbackDescription` and `fallbackCall` copy. The `fallback`
  configuration is still emitted through `emergency:fallback`.
- Per-responder emergency message row from the status panel, along with its
  `EmergencyMessageRow` component and unused styles.

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
