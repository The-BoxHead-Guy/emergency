# Troubleshooting

Applies to: React and vanilla JavaScript integrators.

Start with `onEvent` logging. It includes the typed error, the operation and the
BFF `requestId`.

## The panel does not mount

Check the console for `[emergency] …`. Invalid options do not throw; the client
logs, emits `emergency:failed` with operation `mount`, and returns an inert
client.

Common causes:

- `root` selector does not exist when `mount()` runs. Mount after the DOM node
  exists, or pass the element.
- `bffBaseUrl` is empty.
- `code` is not six characters starting with a letter.
- `mount()` ran during server-side rendering.

## 401 `unauthenticated`

The BFF session cookie was not sent or expired.

- The page and BFF must be same-origin.
- Fetch must use credentials. The client uses axios with
  `withCredentials: true`; if you proxy the BFF through a different path, keep
  the cookie path and origin consistent.
- Native PHP sessions expire after `EMERGENCY_BFF_SESSION_TTL` (default 3600
  seconds of inactivity). Re-open the panel to create a new session.

## 403 `csrf_failed`

The client reads the token from `GET /config` and `POST /session` and sends it
as `X-CSRF-Token`.

- A service worker or proxy that caches `GET /config` can serve a stale token.
  The BFF sends `Cache-Control: no-store`; do not override it.
- If you use Laravel's `XSRF-TOKEN` cookie strategy, pass
  `createCookieCsrfStrategy()` to the client. The default strategy is in-memory.
- Do not fetch the BFF through two different origins in one session.

## 403 `cross_origin_denied`

The BFF's `SameOriginMiddleware` compares the `Origin` host and port with the
`Host` header. A reverse proxy that rewrites `Host` breaks this check.

- Preserve the original `Host` at the proxy.
- Serve the panel from the BFF origin in development and production.
- The MVP does not support a CORS allowlist.

## 404 `inactive_code` or 422 `invalid_code`

- Six characters, first is a letter, for example `DABC12`.
- The code must exist upstream. `invalid_code` means the shape is wrong;
  `inactive_code` means the upstream lookup found no active FMD.
- Codes are case-sensitive as supplied by the BFF backend. Do not uppercase user
  input blindly.

## 409 `emergency_already_active`

An emergency is already active for this identity. The client detects the current
emergency and shows it instead of overwriting it.

- The panel's **Actualizar** reconciles the status.
- Abort the existing emergency before starting a new one.
- If the BFF reports an emergency the UI does not know about, reload the page;
  mount calls `GET /current`.

## Geolocation denied or timed out

The client emits `geolocation_denied`, `geolocation_timeout`,
`geolocation_unavailable` or `geolocation_unsupported` and shows the fallback
phone.

- Geolocation requires HTTPS (or `localhost`).
- The user may have denied permission permanently; the fallback is the designed
  path.
- `geolocationTimeoutMs` defaults to 8000 ms. A very short timeout produces
  `geolocation_timeout`.
- High accuracy can be slow indoors; do not lower the timeout below a few
  seconds.

## Activation fails with `whatsapp_delivery_failed`

The BFF could not deliver to any emergency contact. The emergency was not
created.

- Verify the contacts have valid phone numbers upstream.
- Check the BFF logs for the upstream WhatsApp status.
- Retry after fixing the contact data.

Partial failures (`Algunos contactos no pudieron ser notificados`) still create
the emergency and show which contacts failed.

## No realtime updates

- `GET /config` must return a non-null `realtime.pusher.key` and `cluster`. The
  BFF exposes only the public key; there is no secret in the browser.
- The BFF must be reachable from the browser at Pusher's WebSocket endpoint.
  Corporate proxies can block `wss://`.
- The panel still works without realtime; **Actualizar** and automatic
  reconciliation on focus keep it current.
- The channel pattern is `whatsapp.{phone}` with the leading `+` removed.

## Styles look wrong

- ESM/CJS: import `@dataemergencia/emergency/styles.css` once.
- IIFE: do not import the CSS; the bundle injects it.
- A host CSS reset that targets `button` or `div` broadly can override panel
  styles. Scope your reset instead of raising specificity against generated
  class names.
- Check that a host overlay is not above `z-index: 2147483000`.

## Bundler errors

- React 19 must be installed; React 18 is not supported by the peer range.
- The package is ESM-first. Ensure your bundler resolves the `exports` map.
- `axios`, `pusher-js` and `zustand` are dependencies; do not mark them external
  manually unless you also install them.
- Vite users on the monorepo need the Vite+ toolchain for development of the
  package itself; consuming the published package does not require Vite+.

## The panel closed but the emergency continues

Closing via Escape or the close button does not abort. This is intentional.
Abort from the panel or call `client.abort()` after
`requestAbortConfirmation()`.

## Still stuck

Collect:

- the `onEvent` log,
- the failing request's `requestId`,
- the BFF error code and HTTP status,
- the browser and version,
- whether realtime is configured.

Then follow the BFF
[operations troubleshooting](https://github.com/The-BoxHead-Guy/emergency-bff/blob/v0.1.0/docs/operations/troubleshooting.md)
for server-side causes.
