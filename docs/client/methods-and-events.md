# Methods and events

Applies to: React and vanilla JavaScript integrators.

The mounted client is the public controller. All methods are safe to call from
your own UI; the panel uses the same ones.

## State

```ts
const state = client.getState();
const unsubscribe = client.subscribe((next) => {
  console.log(next.phase.kind, next.panelOpen);
});
unsubscribe();
```

`getState()` returns a frozen snapshot of the current state. `subscribe()`
returns an unsubscribe function.

Important state fields:

| Field                    | Meaning                                                           |
| ------------------------ | ----------------------------------------------------------------- |
| `phase`                  | Current lifecycle phase, see below.                               |
| `panelOpen`              | Whether the overlay is visible.                                   |
| `sessionReady`           | The BFF session exists and CSRF is available.                     |
| `resumeAvailable`        | An active emergency was detected and not dismissed.               |
| `snapshot`               | The active or simulated emergency.                                |
| `responders`             | Flattened responder list with delivery status.                    |
| `failures`               | Contacts the BFF could not notify.                                |
| `messages`               | Message rows derived from the snapshot.                           |
| `lastError`              | Last typed error.                                                 |
| `geolocation`            | Last coordinates.                                                 |
| `geolocationError`       | Last geolocation error.                                           |
| `realtimeStatus`         | `idle`, `connecting`, `connected`, `disconnected`, `unavailable`. |
| `abortResult`            | Result of the last abort attempt.                                 |
| `simulationResult`       | Result of the last simulation attempt.                            |
| `abortConfirmation`      | Whether the abort confirmation is open.                           |
| `simulationConfirmation` | Whether the simulation confirmation is open.                      |
| `destroyed`              | Whether `destroy()` ran.                                          |

### Phases

| Phase          | Meaning                                           |
| -------------- | ------------------------------------------------- |
| `idle`         | Mounted, panel closed.                            |
| `initializing` | Session or resume request in flight.              |
| `ready`        | Session ready, no active emergency.               |
| `activating`   | Activation in flight.                             |
| `simulating`   | Simulation in flight.                             |
| `active`       | A real emergency is active.                       |
| `refreshing`   | Reconciliation in flight.                         |
| `aborting`     | Abort in flight.                                  |
| `error`        | The last operation failed; the panel shows retry. |

## Lifecycle methods

```ts
client.open(reason?: PanelOpenReason): void
client.close(reason?: PanelCloseReason): void
client.destroy(): void
client.ensureSession(): Promise<void>
client.resume(): Promise<void>
client.dismissResume(): void
```

- `ensureSession()` calls `GET /config` then `POST /session` if needed. It is
  idempotent while a session is ready.
- `resume()` calls `ensureSession()` then `GET /current`. If an emergency is
  active it hydrates the snapshot and emits `emergency:resumed`; otherwise it
  clears the resume notification.
- `dismissResume()` hides the resume notification without changing the
  emergency. The notification appears again on the next page load.

## Emergency methods

```ts
client.activate(): Promise<void>
client.simulate(): Promise<void>
client.refresh(): Promise<void>
client.abort(): Promise<void>
```

- `activate()` requests geolocation, opens the panel, ensures the session and
  sends `POST /activate`. It does not throw; failures arrive as
  `emergency:failed` and in `lastError`.
- `simulate()` sends a test message to the emergency contacts without creating
  an emergency. It is a no-op while a real emergency is active.
- `refresh()` reconciles the active emergency with `GET /current`. It is
  throttled to one call per 1500 ms and is triggered automatically by realtime
  events, window focus, `online` and visibility changes.
- `abort()` cancels the active emergency. A confirmation is required; see
  below. Aborting a simulated emergency is a no-op.

All four resolve when the attempt finishes, successful or not. Inspect
`lastError`, `abortResult` or `simulationResult` for the outcome.

## Confirmation methods

```ts
client.requestAbortConfirmation(): void
client.cancelAbortConfirmation(): void
client.requestSimulationConfirmation(): void
client.cancelSimulationConfirmation(): void
```

The panel uses these to show its confirmation dialogs. If you build your own UI,
call the request method, render your confirmation, then call `abort()` or
`simulate()`.

`abort()` refuses to run unless `abortConfirmation` is true. This prevents a
stray click from cancelling a real emergency.

## Events

```ts
const unsubscribe = client.on('emergency:activated', ({ snapshot }) => {
  console.log(snapshot.emergencyId);
});

client.off('emergency:activated', handler);
```

Events are delivered synchronously. A throwing handler is caught and logged; it
does not break the client.

| Event                 | Payload                       |
| --------------------- | ----------------------------- |
| `session:ready`       | `{ code, expiresIn }`         |
| `emergency:activated` | `{ snapshot }`                |
| `emergency:simulated` | `{ responders, failures }`    |
| `emergency:resumed`   | `{ snapshot }`                |
| `emergency:updated`   | `{ snapshot }`                |
| `emergency:aborted`   | `{ emergencyId, responders }` |
| `emergency:failed`    | `{ error, operation }`        |
| `emergency:fallback`  | `{ error, fallback }`         |
| `panel:opened`        | `{ reason }`                  |
| `panel:closed`        | `{ reason }`                  |

`operation` is one of `mount`, `session`, `resume`, `activate`, `simulate`,
`refresh`, `abort`, `geolocation`, `realtime`.

`panel:opened` reasons: `trigger`, `activate`, `resume`, `manual`.
`panel:closed` reasons: `escape`, `close`, `abort`, `destroy`, `manual`.

## Errors

Errors are typed objects, not raw axios errors:

```ts
type EmergencyError = {
  code: string;
  message: string;
  status?: number;
  requestId?: string;
  details?: unknown;
};
```

The client preserves the BFF error code (`invalid_code`, `inactive_code`,
`emergency_already_active`, `rate_limited`, `csrf_failed`, …), the HTTP status
and the `X-Request-Id` value. Client-only codes include `configuration`,
`geolocation_denied`, `geolocation_timeout`, `geolocation_unavailable`,
`geolocation_unsupported` and `network_error`.

See the [BFF error table](https://github.com/The-BoxHead-Guy/emergency-bff/blob/v0.1.0/docs/api-contract.md#errors) for the server codes.

## Snapshot shape

```ts
type EmergencySnapshot = {
  emergencyId: string;
  code: string;
  active: boolean;
  simulated: boolean;
  responders: readonly Responder[];
  createdAt: string | null;
  updatedAt: string | null;
  raw: unknown;
};

type Responder = {
  phone: string;
  name: string;
  status: 'pending' | 'sent' | 'delivered' | 'read' | 'failed';
  messageId?: string;
};
```

Status precedence in the UI is `failed > read > delivered > sent > pending`.

## Next step

[Theming](theming.md).
