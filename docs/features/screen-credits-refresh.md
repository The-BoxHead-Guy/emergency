# Feature history — screen-scoped credit refresh

Permanent record of the credit loading and polling work shipped on 2026-11-25.
The execution plan was removed after completion; this page keeps the problem,
the shipped shape and the decisions an integrator needs.

## Problem

The session eagerly fetched both the credit summary and the full history, and
nothing refreshed the ledger afterwards. History stayed stale after a
simulation or abort even though the summary refreshed. The details and history
screens also showed a plain loading message instead of a layout that matched the
loaded content.

## Shipped

- The session fetches only the credit summary. History loads on demand when the
  user enters the details or history screen.
- `CreditsFetchOptions.silent` skips the `loading` state, keeps cached data on
  success and failure, and falls back to `error` only when no value exists.
  Overlapping requests for the same resource are coalesced.
- `useCreditsRefresh` polls the declared resources every 10 seconds while the
  details or history screen is mounted, pauses while the document is hidden,
  and refreshes when it becomes visible again. Mount requests are silent when
  data already exists.
- `refreshLoadedHistory()` refreshes a previously loaded page after activation,
  simulation, abort and `emergency_not_found`. Mutations do not request history
  when the user never opened it.
- Details and history render `role="status"` / `aria-live="polite"` skeletons on
  first load. Skeletons never replace cached content during a silent refresh.
- `initializing` is no longer treated as a reason to force the panel back to
  `primary`, so entering details or history can start the session without the
  screen being reset. `activating` still forces `primary`.

## Decisions

- The primary screen keeps the eager summary because it needs the balance.
- History requests stay on the current page (`credits.pagination.currentPage`,
  default `1`) with the server page size. Older pages and pagination UI remain
  out of scope.
- No BFF endpoint or response contract changed.
- The abort ledger label remains `Aborto`; it names the abort of an emergency
  message, not a cancellation.

## Verification

- `pnpm check`, `pnpm test` and `pnpm build` pass from `libs/emergency`.
- Controller tests cover lazy loading, silent refreshes, coalescing,
  mutation-driven history refresh and fresh data after activate/abort.
- Hook tests cover mount revalidation, the 10-second interval, visibility
  pausing and unmount cleanup.
