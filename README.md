# @dataemergencia/emergency

Client for the DataEmergencia emergency flow. It owns everything that happens
after the SOS trigger: the panel, the emergency lifecycle, the public realtime
updates and the fallback surfaces.

The upstream DataEmergencia API is never called from the browser. The only
backend contract is the emergency BFF (`/de-bff/emergency`), which validates the
identity code, sends the WhatsApp messages and proxies the upstream state.

- Framework-agnostic TypeScript core (types, state machine, BFF client, store).
- React 19 presentation layer with accessible panel components.
- Mountable IIFE bundle for vanilla pages: no host React or build step.
- ESM/CJS bundles for React applications, with React kept external.
- No `localStorage`: the BFF is the source of truth and resume uses
  `GET /current`.

## Documentation

- [Documentation index](docs/README.md)
- [Client quickstart](docs/client/quickstart.md)
- [Vanilla, no-build guide](docs/client/vanilla.md)
- [Theming](docs/client/theming.md)
- [Troubleshooting](docs/client/troubleshooting.md)

The BFF is a separate package:
[`dataemergencia/emergency-bff`](https://github.com/The-BoxHead-Guy/emergency-bff).

## Requirements

- Node.js 24.22.1 or newer, LTS (the monorepo currently runs Node 26.13.0; the pinned LTS toolchain is 24.22.2).
- pnpm 10+ (the monorepo currently runs pnpm 12.8.1).
- Vite+ 1.4.0 for this package's build and test commands.

React 19 is a peer dependency for the ESM/CJS entry points. The IIFE entry
bundles React, so vanilla consumers need nothing.

## Install

```bash
pnpm add @dataemergencia/emergency
```

## React / ESM quickstart

```tsx
import { mount } from '@dataemergencia/emergency';
import '@dataemergencia/emergency/styles.css';

const client = mount({
  root: '#emergency-root',
  bffBaseUrl: 'https://api.dataemergencia.com/de-bff/emergency',
  code: 'DABC12',
  trigger: '#sos-button', // selector, element, or callback receiving open()
  fallback: {
    phone: '+57 300 123 4567',
    label: 'Línea de emergencia',
  },
  onEvent: (event, payload) => {
    console.log(event, payload);
  },
});

// Later, or from your own UI:
client.open();
client.destroy();
```

`mount()` never auto-opens the panel. The host decides when to call `open()` or
wires a trigger. `destroy()` unmounts React, removes the trigger listener,
cancels in-flight requests, disconnects Pusher and clears the store.

## Vanilla / IIFE quickstart

```html
<div id="emergency-root"></div>
<button id="sos">SOS</button>

<!-- Pin the version in production; see docs/client/installation.md for SRI. -->
<script src="https://cdn.jsdelivr.net/npm/@dataemergencia/emergency@0.1.0/dist/iife/emergency.iife.global.js"></script>
<script>
  window.DataEmergenciaEmergency.mount({
    root: '#emergency-root',
    bffBaseUrl: 'https://api.dataemergencia.com/de-bff/emergency',
    code: 'DABC12',
    trigger: '#sos',
    fallback: { phone: '+57 300 123 4567', label: 'Línea de emergencia' },
  });
</script>
```

The IIFE exposes `window.DataEmergenciaEmergency.mount`. React and ReactDOM are
included in the bundle; the host page does not need a build step.

For state-by-state review there is a lab page that imports the source through
Vite (HMR, CSS Modules) instead of the built IIFE. It drives every fixture
against the mock BFF: see
[`examples/vanilla/README.md`](examples/vanilla/README.md).

## Mount options

| Option                 | Type                                                      | Notes                                                         |
| ---------------------- | --------------------------------------------------------- | ------------------------------------------------------------- |
| `root`                 | `HTMLElement \| string`                                   | Host container. Validated at mount.                           |
| `bffBaseUrl`           | `string`                                                  | Full BFF route prefix, including `/de-bff/emergency`.         |
| `code`                 | `string`                                                  | 6-character identity code supplied by the host.               |
| `trigger`              | `string \| HTMLElement \| (open) => void \| (() => void)` | Optional. Click opens the panel.                              |
| `fallback`             | `{ phone, label }`                                        | Optional direct-call surface. No country number is hardcoded. |
| `theme`                | `EmergencyTheme`                                          | CSS variable overrides (see Theming).                         |
| `locale`               | `string`                                                  | Defaults to `es`; used for time formatting.                   |
| `geolocationTimeoutMs` | `number`                                                  | Defaults to `8000`.                                           |
| `requestTimeoutMs`     | `number`                                                  | Defaults to `15000`.                                          |
| `onEvent`              | `(name, payload) => void`                                 | Typed lifecycle events.                                       |

Invalid roots or codes do not throw into the host page. `mount()` reports a
`configuration` error through `onEvent('emergency:failed', …)`, logs it, and
returns an inert client.

## Client API

```ts
client.open(reason?)     // Opens the panel
client.close(reason?)    // Closes the panel
client.ensureSession()   // POST /session once; safe to repeat
client.resume()          // GET /current and exposes resumeAvailable
client.activate()        // Requests geolocation, then POST /activate
client.simulate()        // POST /simulacrum; never creates an emergency
client.refresh()         // POST /{id}/refresh
client.abort()           // DELETE /{id} after confirmation
client.getState()
client.subscribe(listener)
client.on(event, handler)
client.destroy()
```

Activation opens the panel immediately, requests geolocation and only reports
success after the BFF confirms. If geolocation is denied, unavailable, times out
or is unsupported, the client shows the typed error and the host-provided phone
fallback; it never implies that an emergency was sent without a location.

Abort requires confirmation: `requestAbortConfirmation()` sets the state that
the UI uses for the "keep active / cancel emergency" step, and `abort()` acts on
it.

Simulation is disabled while a real emergency is active.

## Events

`session:ready`, `emergency:activated`, `emergency:simulated`,
`emergency:resumed`, `emergency:updated`, `emergency:aborted`,
`emergency:failed`, `emergency:fallback`, `panel:opened`, `panel:closed`.

Events are typed in `EmergencyEventMap` (`src/core/types.ts`) and emitted by the
client's own emitter, not DOM custom events.

## BFF contract

The client expects the emergency BFF documented in
`packages/emergency-bff`:

| Method   | Route           | Purpose                                        |
| -------- | --------------- | ---------------------------------------------- |
| `GET`    | `/config`       | Initial CSRF token and public realtime config. |
| `POST`   | `/session`      | `{ code }` → session + rotated CSRF token.     |
| `GET`    | `/current`      | Active emergency for the session, if any.      |
| `POST`   | `/activate`     | `{ geolocation: { latitude, longitude } }`.    |
| `POST`   | `/simulacrum`   | Test message, no emergency created.            |
| `POST`   | `/{id}/refresh` | Reconcile snapshot and responder statuses.     |
| `DELETE` | `/{id}`         | Abort and notify contacts.                     |

Every mutating request sends the CSRF token in `X-CSRF-Token`. The default
strategy keeps the token in memory and updates it from `/config` and `/session`.
For a Laravel-compatible `XSRF-TOKEN` cookie, pass
`createCookieCsrfStrategy()` through `createBffClient()` (advanced use).

`createBffClient()` normalizes errors into `EmergencyError` while preserving the
HTTP status, BFF error code, message and `request_id`.

## Theming and visual contract

The panel reproduces the `bp.scaem.app` emergency surface. It is plain CSS
Modules: React and vanilla integrators do not need Tailwind, PostCSS,
FontAwesome or an icon package.

Local class names keep the original BEM names, for example
`.emergency-panel`, `.emergency-panel__header`,
`.emergency-panel__button--emergency`, `.emergency-status__row` and
`.emergency-resume-notification-overlay`. CSS Modules prefixes them at build
time (`de-emergency-emergency-panel-<hash>`), so target the stable BEM suffix in
overrides rather than the generated hash.

All themeable values are CSS custom properties in `src/styles/tokens.css`, and
every rule carries a literal fallback:

```css
:root {
  --de-emergency-red: #ff0000;
  --de-emergency-red-hover: #ff3535;
  --de-emergency-blue: #00adf6;
  --de-emergency-blue-hover: #29bfff;
  --de-emergency-primary: #007bff;
  --de-emergency-text: #3d4461;
  --de-emergency-white: #fff;
  --de-emergency-white-soft: #f7f7f7;
  --de-emergency-gray: #555;
  --de-emergency-radius: 0.5rem;
  --de-emergency-font: 'Poppins', ui-sans-serif, system-ui, sans-serif;
}
```

The `theme` option maps `accent`, `accentContrast`, `surface`, `text`, `muted`
and `radius` onto `--de-emergency-red`, `--de-emergency-on-red`,
`--de-emergency-white`, `--de-emergency-text`, `--de-emergency-text-secondary`
and `--de-emergency-radius`.

The IIFE bundle embeds this stylesheet in a single injected `<style>` tag and
removes it when the last mount is destroyed. Hosts using the IIFE must not load
a second copy of the CSS. ESM/CJS consumers import `styles.css` once.

## Accessibility

The panel renders as `role="dialog"` with `aria-modal`, `aria-labelledby`, a
focus trap, Escape-to-close and focus restoration to the trigger. Confirmation
steps are explicit dialogs with cancel and confirm actions. All controls are
native buttons with visible focus, icons are inline SVG with
`aria-hidden`, and status surfaces use `role="status"` or `role="alert"`.

## Development

```bash
pnpm install
pnpm run check      # format + lint + type checks
pnpm run lint
pnpm run fmt
pnpm run typecheck
pnpm run test
pnpm run build
pnpm run pack       # npm pack --dry-run
```

Examples and the visual lab:

```bash
# Terminal 1: deterministic mock BFF on :8787
pnpm run example:vanilla:mock

# Terminal 2: build, copy the IIFE and serve the vanilla demo
pnpm run example:vanilla

# Or the HMR lab only (serves the package root)
pnpm run lab
```

Build outputs:

| Path                                   | Contents                                     |
| -------------------------------------- | -------------------------------------------- |
| `dist/index.js` / `dist/index.cjs`     | ESM/CJS bundles, React external.             |
| `dist/index.d.ts` / `dist/index.d.cts` | Declarations.                                |
| `dist/styles.css`                      | Extracted CSS Modules for ESM/CJS consumers. |
| `dist/iife/emergency.iife.global.js`   | IIFE with React bundled and CSS injected.    |

The IIFE gzip budget is 150 KB (current build: ~115 KB).

## Repository split and release

This package lives at `libs/emergency` in the DataEmergencia monorepo and is
published from the public split repository `The-BoxHead-Guy/emergency` as
`@dataemergencia/emergency` (npm org `dataemergencia`).

- Monorepo tags: `npm-v0.1.0`.
- Split repository tags: `v0.1.0`.
- The split workflow `.github/workflows/split-emergency-client.yml` copies this
  directory to the split root, regenerates a standalone `pnpm-lock.yaml`, and
  pushes the tag.
- `scripts/split.sh <version> [--push] [--publish]` performs the same mirror
  manually and is the fallback when Actions minutes are exhausted.
- `scripts/release.sh <version> [--publish]` verifies the committed version, the
  changelog entry, the tarball contents and the IIFE budget before publishing.
- The first publish is manual (`scripts/release.sh <version> --publish`).
  Trusted Publishing is prepared in `.github/workflows/publish-npm.yml` for
  later releases.

The published tarball contains `dist/`, `README.md`, `LICENSE` and
`package.json`; `dist/**/*.map` files are excluded. Source maps stay in the
repository and in the CI artifacts.

See `docs/release/release-checklist.md` and `CHANGELOG.md`.

## License

MIT
