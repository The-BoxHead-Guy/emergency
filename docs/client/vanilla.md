# Vanilla JavaScript

Applies to: sites without a build step.

The IIFE build includes React, axios, pusher-js, zustand and the panel CSS.
There is nothing else to install.

## Script tag

```html
<script src="https://cdn.jsdelivr.net/npm/@dataemergencia/emergency@0.1.0/dist/iife/emergency.iife.global.js"></script>
```

Pin the version. `@latest` changes behavior without a code review.

For a self-hosted asset, copy the file from `node_modules` after install:

```bash
cp node_modules/@dataemergencia/emergency/dist/iife/emergency.iife.global.js public/emergency.global.js
```

The monorepo example does the same through `examples/vanilla/copy-iife.mjs`.

## Global

```js
window.DataEmergenciaEmergency.mount(options);
```

`mount()` returns the same controller as the ESM entry.

## Complete page

```html
<!doctype html>
<html lang="es">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Emergencia</title>
  </head>
  <body>
    <main>
      <h1>Mi cuenta</h1>
      <button id="sos" type="button">SOS</button>
      <div id="emergency-root"></div>
    </main>

    <script src="./emergency.global.js"></script>
    <script>
      const client = window.DataEmergenciaEmergency.mount({
        root: '#emergency-root',
        bffBaseUrl: 'https://example.com/de-bff/emergency',
        code: 'DABC12',
        trigger: '#sos',
        fallback: {
          phone: '+57 300 123 4567',
          label: 'Línea de emergencia',
        },
        onEvent(event, payload) {
          console.info('[emergency]', event, payload);
        },
      });

      window.addEventListener('pagehide', () => client.destroy(), {
        once: true,
      });
    </script>
  </body>
</html>
```

## CSS injection

The IIFE injects one `<style id="de-emergency-styles" data-de-emergency>` element
on the first mount. The style is reference-counted: it is removed when the last
client is destroyed.

Do not add `styles.css` as well; the IIFE already contains it.

If a Content Security Policy blocks inline styles, allow the injected style or
serve the panel from a page whose CSP permits it. The IIFE needs inline `<style>`
injection; there is no nonce option in `0.1.0`.

## Multiple clients

Each `mount()` is independent. The shared style element stays until the last
client is destroyed. You can mount two codes on one page, but the panels overlap;
prefer one client per page.

## Without a trigger

Omit `trigger` and open the panel from your own handler:

```js
const client = window.DataEmergenciaEmergency.mount({
  root: '#emergency-root',
  bffBaseUrl: '/de-bff/emergency',
  code: 'DABC12',
  fallback: { phone: '+57 300 123 4567', label: 'Emergencia' },
});

document.querySelector('#sos').addEventListener('click', () => {
  client.open('trigger');
});
```

## Same-origin requirement

Serve the page from the BFF origin. The default BFF rejects a request whose
`Origin` host and port differ from `Host`, even when the page sends credentials.

## Debugging

`onEvent` is the easiest hook:

```js
onEvent: (event, payload) => console.log(event, payload);
```

Every lifecycle event is emitted there, including failures and panel open/close
reasons.

## Next step

[React integration](react.md).
