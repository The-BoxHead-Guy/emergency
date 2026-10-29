# React

Applies to: React 19 applications with a bundler.

The client renders its own React tree into a host element. Your application does
not need to wrap it in a provider, and you do not import internal components.

## Install

```bash
npm install @dataemergencia/emergency
```

React and ReactDOM are peer dependencies. The ESM build keeps them external so
your application has a single React instance.

## Mount in a component

```tsx
import { useEffect, useRef } from 'react';
import { mount, type EmergencyClient } from '@dataemergencia/emergency';
import '@dataemergencia/emergency/styles.css';

export function EmergencyPanelHost({
  bffBaseUrl,
  code,
}: {
  bffBaseUrl: string;
  code: string;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const clientRef = useRef<EmergencyClient | null>(null);

  useEffect(() => {
    if (!rootRef.current) {
      return;
    }

    const client = mount({
      root: rootRef.current,
      bffBaseUrl,
      code,
      fallback: {
        phone: '+57 300 123 4567',
        label: 'Línea de emergencia',
      },
      onEvent: (event, payload) => {
        console.info('[emergency]', event, payload);
      },
    });

    clientRef.current = client;

    return () => {
      client.destroy();
      clientRef.current = null;
    };
  }, [bffBaseUrl, code]);

  return (
    <>
      <button type="button" onClick={() => clientRef.current?.open('manual')}>
        SOS
      </button>
      <div ref={rootRef} />
    </>
  );
}
```

The cleanup is mandatory. `destroy()` removes the trigger listener, aborts
requests, disconnects Pusher and unmounts the panel.

## Trigger from React state

The `trigger` option needs a DOM node that exists when `mount()` runs. In React,
either pass a callback:

```tsx
trigger: (open) => {
  const button = document.querySelector<HTMLButtonElement>('#sos');
  button?.addEventListener('click', open);

  return () => button?.removeEventListener('click', open);
},
```

or skip `trigger` and call `client.open()` from your own handler, as above.

Do not pass a React synthetic event handler to `trigger`; it is not a DOM
element and the client ignores it.

## Strict Mode

React 19 Strict Mode mounts, unmounts and remounts effects in development. The
effect above creates and destroys the client twice. That is expected and safe:
the second client owns the root.

Do not memoize the client across Strict Mode cycles without a destroy; the panel
listener and Pusher connection would leak.

## Events in React

```tsx
useEffect(() => {
  const client = clientRef.current;

  if (!client) {
    return;
  }

  return client.on('emergency:activated', ({ snapshot }) => {
    setEmergencyId(snapshot.emergencyId);
  });
}, []);
```

`on()` returns an unsubscribe function, which is directly usable as the effect
cleanup.

## State in React

`client.subscribe()` works, but prefer `onEvent` for lifecycle transitions. If
you need the full state:

```tsx
const [state, setState] = useState(client.getState());

useEffect(() => client.subscribe(setState), [client]);
```

Do not create a second React context wrapper around the client; one mount is
one client.

## Next step

[Troubleshooting](troubleshooting.md).
