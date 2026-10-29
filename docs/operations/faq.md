# Operations FAQ

Applies to: teams running the client in production.

## How do I know the client is working?

Listen for `session:ready` and `emergency:activated`. A healthy first
interaction produces, in order:

1. `session:ready` with `expiresIn`,
2. `panel:opened` with reason `trigger` or `manual`,
3. `emergency:activated` with the snapshot.

If you see `emergency:failed`, the error carries the BFF code and `requestId`.

## Should I call `resume()` on every page load?

No. `mount()` already calls `GET /current` and shows the resume notification.
`resume()` is for an explicit refresh or after a network recovery.

## Can I use the client without the panel?

The panel is always rendered by `mount()`. There is no headless-only entry in
`0.1.0`. You can close the panel immediately and use the controller methods, but
the React tree still exists.

## Can I use it in a server-rendered app?

Only in the browser. `mount()` requires `document`. Import it in a client-only
module or inside `useEffect`. Server rendering the package returns an inert
client.

## Where does the identity code come from?

Your backend. The client never collects it from the user. For multi-tenant
deployments, render the code for the authenticated account; never accept it from
a query parameter without server-side authorization.

## What happens if the user closes the tab during an emergency?

The emergency continues server-side. On the next visit, `GET /current` finds it
and the resume notification appears. Delivery status is fetched again.

## What happens during a BFF outage?

- The panel shows the network or `upstream_error` message.
- Activation does not create a local emergency.
- Realtime may disconnect; reconciliation retries on focus/online.
- The fallback phone remains available.

## How do I measure adoption?

Instrument `panel:opened`, `emergency:activated` and `emergency:simulated` in
`onEvent`. Do not send the identity code, phone numbers or coordinates to
analytics.

## Can I theme it to match my brand?

Yes, see [Theming](../client/theming.md). Keep the activation action visually
urgent and verify contrast.

## Does it support private Pusher channels?

Not in `0.1.0`. The BFF exposes a public channel with metadata-only events. Do
not add a Pusher secret to the browser. Private channels are post-MVP.

## How do I upgrade?

Read the [versioning policy](../release/versioning.md). Within `0.x`, minor versions
can contain breaking changes; pin a version and review the changelog.

## Next step

[Split repositories](../release/split-repositories.md).
