# Trigger

Applies to: React and vanilla JavaScript integrators.

The trigger connects your SOS control to the panel. It is optional; you can open
the panel from your own code instead.

## Selector

```ts
mount({ root: '#emergency-root', trigger: '#sos-button' /* … */ });
```

`document.querySelector` resolves the selector once at mount. The listener calls
`event.preventDefault()` and then `client.open()`.

If the selector does not match, the client mounts normally and simply has no
click trigger. No exception is thrown.

## Element

```ts
const button = document.querySelector('#sos-button');

mount({ root: '#emergency-root', trigger: button /* … */ });
```

The element must exist at mount time. If it does not, pass a callback instead.

## Callback

```ts
mount({
  root: '#emergency-root',
  trigger: (open) => {
    const button = document.querySelector('#sos-button');
    button?.addEventListener('click', open);

    return () => button?.removeEventListener('click', open);
  },
  /* … */
});
```

The callback receives the `open` function and may return a cleanup function.
The cleanup runs from `destroy()`. This form is useful when the trigger lives in
a component that mounts later, or when you want to attach more than one event.

## Opening and closing

```ts
client.open(); // reason "manual" through mount()
client.open('trigger'); // explicit reason in events
client.close(); // reason "manual" through mount()
client.destroy();
```

- `open()` shows the panel. It does not start an emergency.
- `close()` hides the panel. An active emergency keeps running.
- `destroy()` removes the trigger listener, closes the panel with reason
  `destroy`, aborts requests, disconnects realtime and clears the store.

## No auto-open

Mounting never opens the panel. This is intentional:

- The host decides the interaction and the copy on its own SOS control.
- A page reload must not show an emergency panel by itself.
- A resumed emergency produces a dismissible notification instead.

The single exception is activation: `client.activate()` opens the panel so the
user can see progress and errors.

## Replacing your SOS control

The panel has its own **Activar emergencia** button. You can keep your host
button as the only entry point, or call `client.activate()` directly from your
own UI:

```ts
document.querySelector('#sos-button')?.addEventListener('click', () => {
  void client.activate();
});
```

`activate()` requests geolocation before opening the panel content. If you want
the panel visible during the permission prompt, call `client.open()` first.

## Next step

[Configuration](configuration.md).
