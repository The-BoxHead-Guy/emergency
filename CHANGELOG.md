# Changelog

All notable changes to `@dataemergencia/emergency` are documented here.
The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/)
and [Semantic Versioning](https://semver.org/).

## [Unreleased]

## [0.5.0] - 2026-11-05

### Added

- `pre-emergency` screen shown the first time the primary screen's emergency
  button is pressed during a panel session. It asks for a Venezuelan mobile
  phone number with a fixed `+58` prefix, formats the national number, validates
  it as `4xx + 7 digits`, and enables the emergency action only when the number
  is valid.
- `contactPhone` client state and `setContactPhone()`, cleared by `close()` and
  `destroy()`. The captured phone is kept client-side for the current panel
  session and is not sent to the BFF yet.

### Changed

- All screen body areas now use a uniform `0.75rem` padding.
- While the primary screen is idle, its header shows only a dark close button on
  a transparent background; the panel title stays available to assistive
  technology but is visually hidden. Activation, loading and feedback states
  keep the original opaque header.
- The idle primary body splits the space evenly: the administrative
  availability block and the emergency prompt take half each, with the red rule
  keeping its natural height between them.
- The resume notification now uses the emergency palette tokens instead of
  hardcoded orange values, and its action button follows the shared emergency
  button convention.
- Pricing package cards now show the rounds footnote above their select button
  on a subtly darker background, replacing the single footnote below the
  catalog.
- The per-message copy reads "IVA Incluido" and the package labels are
  corrected to `$0.07` and `$0.06`, dropping the extra package-2 price note.
- The border radius defaults to `0.75rem` instead of `0.5rem`, and panel
  corners now reference the `--de-emergency-radius` token instead of repeating
  the literal value.

### Fixed

- `pnpm check` now runs the package lint configuration, so local, monorepo and
  split-repository validation report the same lint errors.
- Removed redundant event payload assertions and typed React CSS custom
  properties so `consistent-type-assertions` passes without disabling it.

## [0.4.0] - 2026-11-04

### Added

- Availability section on the emergency panel's primary screen with the
  remaining alert rounds, plus an in-memory screen system for the `primary`,
  `pricing` and `details` screens.
- Package catalog on the `pricing` screen, including the highlighted
  best-value package and a local package selection.

## [0.3.0] - 2026-11-03

### Added

- `realtime` mount option carrying the public Pusher `key`, `cluster` and an
  optional `channelPattern`. Omitting it keeps the client in pull mode.

### Changed

- The client subscribes directly to the API's Pusher app instead of reading
  realtime settings from `GET /config` and `GET /current`.
- Channel names replace `{phone}` with the responder phone in digits-only form,
  matching the API's `PhoneNumberFormatter::stripNonDigits`.
- This is a MINOR release (`0.3.0`): the mount option is a new public
  capability, and removing the BFF-sourced realtime field is a coordinated
  contract change that PATCH would misrepresent.
- `validateConfig` accepts an `EmergencyConfigInput` whose `realtime` value is
  untrusted, matching the runtime validation it already performs. Tests no
  longer need a type assertion to exercise invalid realtime input.

### Removed

- `RealtimePusherConfig`, `RealtimePublicConfig`, the `realtime` field on the
  `ConfigResponse` and `CurrentResponse` types, and the `isRealtimeConfig`
  guard. The client ignores an extra `realtime` key from older BFFs.

## [0.2.1] - 2026-11-03

### Changed

- The release pipeline runs check, tests and build once through npm lifecycle
  hooks; CI and the publish workflow no longer repeat those steps.

### Removed

- The custom tarball inspection. `package.json` `files` already defines the
  published contents, so the release only needs check, tests and build.
- Top-level `responders` from `RefreshResponse`. Read responders from
  `emergency.responders`.

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
