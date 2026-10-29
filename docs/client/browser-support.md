# Browser support

Applies to: React and vanilla JavaScript integrators.

## Baseline

The builds target `es2022` and rely on:

- ES2022 syntax (`class` fields, top-level `await` is not used in entry code),
- `fetch`/XHR (axios uses XHR in browsers),
- `Intl.DateTimeFormat` and `Intl.NumberFormat`,
- `crypto.randomUUID()` for idempotency keys,
- `navigator.geolocation` for activation,
- `WebSocket` when realtime is configured,
- CSS custom properties and `rgb(… / …)` color syntax.

Practical baseline:

| Browser            | Minimum |
| ------------------ | ------- |
| Chrome / Edge      | 94+     |
| Firefox            | 93+     |
| Safari (macOS/iOS) | 15.4+   |
| Samsung Internet   | 16+     |

Older browsers are not tested. The panel may render but activation can fail
without `crypto.randomUUID`; if you must support an older browser, provide a
polyfill before mounting.

## Mobile

The panel is designed for mobile first:

- full-screen at 520 px and below,
- 44–48 px touch targets,
- safe-area padding is not added automatically; if your page uses a notch, keep
  the mount root inside the safe area or add
  `padding: env(safe-area-inset-*)` to your host wrapper.

iOS Safari requires a user gesture to open some permission prompts. The panel's
activation button is a real button, so the geolocation request happens inside a
click. If you call `client.activate()` from a non-gesture timer, iOS may reject
the permission prompt.

## Bundle size

- IIFE: ~114 KiB gzip (budget 150 KiB), includes React, ReactDOM, axios,
  pusher-js, zustand and CSS.
- ESM/CJS: the panel code only; React, axios, pusher-js and zustand come from
  your application's bundle.

The IIFE is the no-build path. If your application already has React and a
bundler, use the ESM entry to avoid shipping a second React.

## React in the IIFE

The IIFE bundles React 19 and ReactDOM. It does **not** reuse the host page's
React, even if one exists. This is why the IIFE is self-contained, and why you
must not load it twice on the same page.

If the host is a React application, use the ESM entry. Mixing the IIFE with a
host React tree means two Reacts and two roots, which is supported but wasteful.

## CSP

The IIFE injects a `<style>` element at runtime (see
[Vanilla integration](vanilla.md#css-injection)). A strict `style-src` policy
without `'unsafe-inline'` blocks it. Either allow inline styles on the page that
hosts the panel or use the ESM entry and import `styles.css` yourself.

The client does not use `eval`, `new Function`, or inline event handler
attributes.

## Cookies and storage

The client stores no identity, token or emergency data in `localStorage`. The
BFF session lives in an HTTP-only cookie. CSRF is kept in memory by default;
the Laravel cookie strategy reads `XSRF-TOKEN`, which Laravel manages.

## Next step

[Examples](../examples.md).
