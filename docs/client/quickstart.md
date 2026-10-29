# Quickstart

Applies to: React and vanilla JavaScript integrators.

This page mounts the panel, opens it from your own SOS button and explains what
the client does on its own.

## 1. Add a root element

```html
<div id="emergency-root"></div>
<button id="sos-button" type="button">SOS</button>
```

The root is where React renders. It can be any element; the panel itself is a
fixed overlay, so the root does not need a particular size.

## 2. Mount the client

```tsx
import { mount } from '@dataemergencia/emergency';
import '@dataemergencia/emergency/styles.css';

const client = mount({
  root: '#emergency-root',
  bffBaseUrl: 'https://example.com/de-bff/emergency',
  code: 'DABC12',
  trigger: '#sos-button',
  fallback: {
    phone: '+57 300 123 4567',
    label: 'Línea de emergencia',
  },
  onEvent: (event, payload) => {
    console.log('[emergency]', event, payload);
  },
});
```

`bffBaseUrl` is the full BFF route prefix, including `/de-bff/emergency`. It is
not only the origin.

`code` is the six-character identity code, supplied by your backend. The first
character must be a letter.

## 3. What happens on mount

- The client validates the options.
- It creates the store and renders the panel in the closed state.
- It calls `GET /current` to detect an emergency that survived a page reload.
- If an emergency exists, it shows the resume notification. It does **not**
  open the panel automatically.

Mounting never opens the panel and never starts an emergency.

## 4. Opening the panel

`trigger: '#sos-button'` attaches a click listener that calls `client.open()`.
You can also open it yourself:

```ts
client.open(); // reason defaults to "manual" when called through mount()
```

The first open starts the session lazily: `GET /config`, then `POST /session`.
The activation button lives inside the panel.

## 5. Activation

When the user presses **Activar emergencia**:

1. The panel stays open and shows the activating state.
2. The browser asks for geolocation.
3. The client sends `POST /activate` with the coordinates.
4. The panel shows the responders and their delivery status once the BFF
   confirms.

If geolocation fails, the client shows the typed error and the fallback phone
number. It never claims that an emergency was sent without a position.

## 6. Cleanup

```ts
client.destroy();
```

`destroy()` removes the trigger listener, aborts in-flight requests, disconnects
Pusher, clears the store and unmounts React. Call it when the page or component
that owns the client goes away.

## Complete no-build example

```html
<!doctype html>
<html lang="es">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Emergency panel</title>
  </head>
  <body>
    <button id="sos" type="button">SOS</button>
    <div id="emergency-root"></div>

    <script src="https://cdn.jsdelivr.net/npm/@dataemergencia/emergency@0.1.0/dist/iife/emergency.iife.global.js"></script>
    <script>
      const client = window.DataEmergenciaEmergency.mount({
        root: '#emergency-root',
        bffBaseUrl: 'https://example.com/de-bff/emergency',
        code: 'DABC12',
        trigger: '#sos',
        fallback: { phone: '+57 300 123 4567', label: 'Línea de emergencia' },
      });

      window.addEventListener('pagehide', () => client.destroy(), {
        once: true,
      });
    </script>
  </body>
</html>
```

The BFF must allow the page's origin. The default BFF rejects cross-origin
requests, so serve this page from the same origin as the BFF.

## Next step

The full vanilla PHP example that pairs this page with a BFF is
[`examples/vanilla-php`](https://github.com/The-BoxHead-Guy/emergency-bff/tree/v0.1.0/examples/vanilla-php).
It includes a mock upstream API, a demo page and a smoke test.

[Trigger](trigger.md) and [Configuration](configuration.md).
