# Vanilla example and visual lab

Two entry points share the mock BFF on `http://localhost:8787`:

- `index.html` — the IIFE demo: it loads `emergency.global.js` from this
  directory.
- `lab.html` — the Vite lab: it imports `src/mount.tsx` directly, so every edit
  hot-reloads. It is the reference page for visual parity reviews.

## Run

```bash
# Terminal 1 — deterministic mock BFF + fixture switch
pnpm run example:vanilla:mock

# Terminal 2 — IIFE demo (build + copy + Vite dev)
pnpm run example:vanilla

# Or, for the HMR lab only (serve the package root)
pnpm run lab
```

Open `http://localhost:5173/examples/vanilla/lab.html` (the port Vite prints)
and the IIFE demo at `/examples/vanilla/index.html`.

## Lab fixtures

Every button calls `POST /de-bff/emergency/__scenario` before driving the
client, so states are deterministic. The mock also supports the plain default
flow when no scenario is selected.

| Button                   | Scenario                | What to review                                    |
| ------------------------ | ----------------------- | ------------------------------------------------- |
| Idle                     | `default`               | Illustration, question, red/blue action buttons.  |
| Activando                | `slow`                  | Disabled footer, 1.2 s activation window.         |
| Activa (mixta)           | `active-mixed`          | 4-column grid, sent + delivered, no timestamps.   |
| Recibido y leído         | `active-delivered-read` | All cells checked, `h:mmam/pm` timestamps.        |
| Simulación exitosa       | `simulacrum-success`    | Green success surface and details.                |
| Simulación fallida       | `simulacrum-error`      | Red error surface.                                |
| Confirmar aborto         | `active-mixed`          | Destructive confirmation with explicit cancel.    |
| Aborto exitoso           | `active-mixed`          | Success feedback after abort.                     |
| Aborto fallido           | `abort-error`           | Error feedback, emergency stays active.           |
| Geolocalización denegada | `default`               | Typed message + `tel:` fallback, no "sent" claim. |
| Error al activar         | `activate-error`        | Error block with retry.                           |
| Error de sesión          | `session-error`         | Reloads with a failing `/session`.                |
| Emergencia en curso      | `active-mixed`          | Orange resume overlay above the panel.            |
| Mensajes fallidos        | `active-failed`         | Failed message rows and red sent icon.            |
| Reiniciar                | `default`               | Clears the fixture and reloads.                   |

## Visual review loop

1. Start the mock and the lab (see above).
2. Open the lab with Chrome DevTools at **360**, **768** and **1280** px. For
   each fixture take one screenshot and store it outside the repo, for example
   `/tmp/emergency-lab/<viewport>/<fixture>.png`.
3. Compare against the original `apps/bp.scaem.app` panel at the same viewport:
   header height/colors, body title, footer action sizes, 4-column status grid,
   message rows, orange resume overlay, error/success surfaces, confirmation
   dialogs.
4. Record deviations in the PR description. Known intentional deviations: the
   Poppins font is not loaded (the `--de-emergency-font` fallback is used), the
   branded photograph is replaced by the neutral inline mark, and transient
   confirmations follow the same palette but use the package's own keyframes.
5. Fix regressions in `src/styles/panel.module.css` (tokens live in
   `src/styles/tokens.css`) and repeat. Do not commit screenshots.

## Parity notes from the last review

Measured with Chrome DevTools in the lab against the bp reference:

- **360 px:** header `#ff0000` with white title, 56 px tall; footer `#f7f7f7`;
  action buttons 144 × 78 px; status grid `1fr .65fr .65fr .65fr`; abort
  button full width.
- **768 px:** status panel capped at 28 rem (448 px) and centered; refresh
  button centered under the table; abort label on one line.
- **1280 px:** same 448 px status panel centered in the full-screen grid; no
  horizontal overflow.

Intentional deviations: Poppins falls back to the token stack, the branded
photograph is replaced by the neutral inline mark, and the package keeps its
own confirmation keyframes. The bp overflow defect is fixed by giving the
middle grid row `overflow-y: auto`.
