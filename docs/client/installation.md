# Installation

Applies to: React and vanilla JavaScript integrators.

## Package manager

```bash
npm install @dataemergencia/emergency
```

```bash
pnpm add @dataemergencia/emergency
```

```bash
yarn add @dataemergencia/emergency
```

React 19 is a peer dependency. The package does not install React for you.

```bash
npm install react@19 react-dom@19
```

## Entry points

| Import                                    | Use                                                           |
| ----------------------------------------- | ------------------------------------------------------------- |
| `@dataemergencia/emergency`               | ESM/CJS `mount()` and the typed client. React stays external. |
| `@dataemergencia/emergency/styles.css`    | Required CSS for the ESM/CJS entry.                           |
| `@dataemergencia/emergency/iife`          | The IIFE file path, for bundlers that copy assets.            |
| CDN `/dist/iife/emergency.iife.global.js` | No-build script tag. React and CSS are bundled.               |

The `files` field publishes only `dist/`. The source TypeScript is not part of
the npm package.

## ESM

```tsx
import { mount } from '@dataemergencia/emergency';
import '@dataemergencia/emergency/styles.css';

const client = mount({
  root: '#emergency-root',
  bffBaseUrl: 'https://example.com/de-bff/emergency',
  code: 'DABC12',
});
```

## CommonJS

```js
const { mount } = require('@dataemergencia/emergency');
require('@dataemergencia/emergency/styles.css');
```

CommonJS receives `dist/index.cjs` and `dist/index.d.cts`. React stays a peer
dependency in both formats.

## No-build IIFE

```html
<script src="https://cdn.jsdelivr.net/npm/@dataemergencia/emergency/dist/iife/emergency.iife.global.js"></script>
```

The global is `window.DataEmergenciaEmergency`. The IIFE includes React,
ReactDOM, axios, pusher-js and zustand, and injects its CSS automatically.

Use a pinned version in production:

```html
<script src="https://cdn.jsdelivr.net/npm/@dataemergencia/emergency@0.1.0/dist/iife/emergency.iife.global.js"></script>
```

The `latest` URL follows whatever is published, so a compromised or regressed
release reaches your page without a deploy. Pin the version and add
Subresource Integrity:

```bash
curl -s https://cdn.jsdelivr.net/npm/@dataemergencia/emergency@0.1.0/dist/iife/emergency.iife.global.js \
  | openssl dgst -sha384 -binary | openssl base64 -A
```

```html
<script
  src="https://cdn.jsdelivr.net/npm/@dataemergencia/emergency@0.1.0/dist/iife/emergency.iife.global.js"
  integrity="sha384-<value from the command above>"
  crossorigin="anonymous"
></script>
```

Recompute the hash when you upgrade. A version published to npm is immutable,
so a pinned URL cannot change under you.

## Runtime dependencies

The ESM/CJS builds keep these packages external and declare them as
dependencies, so your package manager installs them:

- `axios`
- `pusher-js`
- `zustand`
- `react` / `react-dom` (peer, React 19)

The IIFE bundles all of them. There is no runtime dependency on the BFF package
from npm; the BFF is a separate Composer package.

## Build outputs

| Path                                  | Contents                                         |
| ------------------------------------- | ------------------------------------------------ |
| `dist/index.js`                       | ESM bundle, React external.                      |
| `dist/index.cjs`                      | CommonJS bundle, React external.                 |
| `dist/index.d.ts`, `dist/index.d.cts` | Type declarations.                               |
| `dist/styles.css`                     | Extracted CSS Modules for ESM/CJS.               |
| `dist/iife/emergency.iife.global.js`  | Minified IIFE, everything bundled, CSS injected. |

## Verify the install

```bash runnable
node -e "console.log(require('./libs/emergency/package.json').name)"
```

Expected: `@dataemergencia/emergency`.

In a browser, check that `window.DataEmergenciaEmergency.mount` is a function
after loading the IIFE.

## Next step

[Quickstart](quickstart.md).
