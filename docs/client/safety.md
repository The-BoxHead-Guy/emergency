# Safety behavior

Applies to: React and vanilla JavaScript integrators.

This page describes what the client guarantees to the person under stress, and
what it deliberately does not do.

## Simulation is labeled

**Probar** sends `POST /simulacrum`. The BFF sends the confirmation template to
the emergency contacts but does not create an emergency.

In the panel:

- the simulation confirmation explains that no real emergency is created;
- after a successful run the panel shows `Mensaje de prueba enviado.`;
- a simulation failure shows `No se pudo enviar el mensaje de prueba.`;
- a partial failure says `Algunos contactos no pudieron ser notificados. Revisa la lista.`;
- the simulation result never sets an active snapshot.

The API exposes `simulate()` for programmatic use. Unlike `abort()`, it does not
require a confirmation flag; the confirmation is a panel interaction. If you
call it from your own UI, show your own confirmation first.

## Resume notification

If an emergency was started earlier and is still active, a reload does not
re-open the panel silently. Instead the client shows a notification:

> Tienes una emergencia activa
> Toca para ver el estado y los contactos notificados.

**Ver emergencia** opens the panel and refreshes the data. **Ahora no** dismisses
the notification without aborting. The notification is not a promise that
contacts were reached; the panel shows per-contact delivery status.

## Abort is explicit

Cancelling has two steps:

1. **Cancelar emergencia** opens a confirmation that explains contacts will be
   notified of the cancellation and that it cannot be undone.
2. **Sí, cancelar emergencia** sends `DELETE /{id}`.

`client.abort()` enforces the confirmation flag: the first call sets
`abortConfirmation` and returns without sending a request. The second call
performs the abort. `cancelAbortConfirmation()` clears it.

The BFF sends the abort template to the contacts before deleting the emergency
state. If the BFF call fails, the panel reports
`No se pudo cancelar la emergencia. Inténtalo de nuevo.` and keeps the
emergency active; it does not pretend the cancellation succeeded.

Aborting a simulated result is a no-op with an informational message, because
there is no real emergency to cancel.

## Geolocation is required for activation

The client requests high-accuracy geolocation before `POST /activate`. If the
browser denies, times out, is unavailable or unsupported, the client:

1. emits `emergency:failed` with operation `geolocation`,
2. emits `emergency:fallback`,
3. shows the typed explanation and your `fallback` phone number,
4. does not call the BFF and does not claim an emergency was created.

The fallback number comes from the host:

```ts
fallback: { phone: '+57 300 123 4567', label: 'Línea de emergencia' }
```

The client does not guess a country's emergency number. Choose the number your
organization operates and label it honestly.

Geolocation requires a secure context (`https://` or `localhost`). On plain
HTTP in production the browser rejects the request; the fallback path is the
only option.

## Partial delivery is visible

The BFF returns per-responder delivery results. The client:

- shows every responder with `Pendiente`, `Enviado`, `Entregado`, `Leído` or
  `Fallido`;
- shows a partial-failure warning when some contacts failed;
- keeps the emergency active even if some messages failed.

If every contact fails, the BFF returns `whatsapp_delivery_failed` and the
client reports the failure. Reconcile with **Actualizar** or start the
emergency again after fixing the upstream issue.

## Status is live but not authoritative

With public Pusher channels configured, delivery status updates arrive in real
time. Realtime is a convenience:

- if Pusher is not configured or the connection drops, the panel still works;
- the client reconciles with `GET /current` on focus, `online`, visibility
  change and realtime events (throttled to 1500 ms);
- the BFF remains the source of truth.

Pusher payloads are metadata-only. The client never trusts a Pusher payload as a
complete snapshot; it refreshes the BFF.

## Error copy is not success copy

The client never converts a failed request into a success message. Failures
surface as red error text plus the action to retry, and the corresponding event
carries the typed error with `requestId` when the BFF supplied one.

## Transport and data exposure

- Every request uses your origin, cookies and an in-memory CSRF token. The
  client never stores the CSRF token or the identity code in `localStorage`,
  `sessionStorage` or a readable cookie.
- HTTP redirects are disabled. A 3xx response becomes an error instead of
  forwarding the credentialed request to another origin.
- Error details are bounded before they reach your code: objects are truncated
  to two levels and twenty entries, and strings to 200 characters. This keeps
  upstream payloads (phone numbers, contact names) from being copied verbatim
  into host telemetry.
- Snapshots still include the raw BFF payload in `snapshot.raw`. Treat that value
  as personal data: do not log it, and do not forward it to third-party
  analytics.
- The IIFE global `window.DataEmergenciaEmergency` is a single slot. Two
  different pages in one shell, or a second copy of the bundle, overwrite each
  other; call `destroy()` before loading another instance.

## What the host still owns

- A working emergency phone number in `fallback`.
- Accurate identity codes; the panel does not let the user type a code.
- Not hiding the panel behind host overlays.
- Not calling `destroy()` while an emergency is active unless the page is
  really going away.
- Telling users what the service does before they need it.

## Next step

[Vanilla integration](vanilla.md).
