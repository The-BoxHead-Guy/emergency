# Examples

Applies to: client integrators.

One runnable example ships with the client package.

## Vanilla (no build)

`libs/emergency/examples/vanilla` mounts the IIFE with a real SOS button and a
mock BFF.

```bash
# terminal 1 — mock BFF on :8787
pnpm --filter @dataemergencia/emergency example:vanilla:mock

# terminal 2 — build the IIFE, copy it, serve the page
pnpm --filter @dataemergencia/emergency example:vanilla
```

What it demonstrates:

- `window.DataEmergenciaEmergency.mount`,
- a `#sos` trigger,
- session creation and CSRF against the mock,
- activation with simulated geolocation,
- abort and simulation,
- cleanup on `pagehide`.

Open the page and use the controls; the panel runs the same code as production.

## ESM in a bundled app

The [React guide](client/react.md) contains a copy-paste component that works
with any React 19 app and uses the built ESM entry. There is no separate example
application; the vanilla page and the lab page are the runnable references.

For a full host integration including a Laravel session and CSRF adapter, see
the [BFF Laravel example](https://github.com/The-BoxHead-Guy/emergency-bff/tree/v0.1.0/examples/laravel).

## Mock BFF

`libs/emergency/examples/vanilla/mock-bff.mjs` implements the BFF contract in
Node:

- `GET /config` and `POST /session` with `demo-csrf-token`,
- `GET /current`, `POST /activate`, `POST /simulacrum`, `DELETE /{id}`,
- `POST /{id}/refresh`,
- an active emergency for `DABC12` with two responders.

It exists so the client can be developed without PHP, credentials or WhatsApp
messages. It is not a production shim: it does not validate codes, persist
sessions or call the upstream API.

## Example checklist

- The page is served from the same origin as the BFF (or the mock).
- `bffBaseUrl` includes `/de-bff/emergency`.
- `code` is `DABC12` for the mock.
- `fallback` points to a test number, not a real emergency line.
- `destroy()` runs on page unload.

## Next step

[Operations FAQ](operations/faq.md).
