# Theming

Applies to: React and vanilla JavaScript integrators.

The panel is styled with CSS Modules and a small set of CSS custom properties.
It mirrors the `bp.scaem.app` emergency surface. You do not need Tailwind,
PostCSS, FontAwesome, an icon package or a particular host framework.

## Class names

Local class names use the original BEM names: `.emergency-panel`,
`.emergency-panel__header`, `.emergency-status__row`,
`.emergency-resume-notification-overlay`, and so on. At build time CSS Modules
prefixes them with `de-emergency-` and appends a hash, for example
`de-emergency-emergency-panel-abc123`. Do not target the generated name; match
the stable BEM suffix when you need to override a rule.

## CSS variables

| Variable                        | Default       | Used for                             |
| ------------------------------- | ------------- | ------------------------------------ |
| `--de-emergency-red`            | `#ff0000`     | Header, emergency button, failures.  |
| `--de-emergency-red-hover`      | `#ff3535`     | Emergency hover.                     |
| `--de-emergency-on-red`         | `#fff`        | Text and icons on red/blue surfaces. |
| `--de-emergency-blue`           | `#00adf6`     | Test/simulation button.              |
| `--de-emergency-blue-hover`     | `#29bfff`     | Test hover.                          |
| `--de-emergency-primary`        | `#007bff`     | Status header, refresh, links.       |
| `--de-emergency-text`           | `#3d4461`     | Primary text.                        |
| `--de-emergency-text-secondary` | `#686868`     | Secondary text.                      |
| `--de-emergency-white`          | `#fff`        | Panel surface.                       |
| `--de-emergency-white-soft`     | `#f7f7f7`     | Footer and soft surfaces.            |
| `--de-emergency-white-pearl`    | `#f1f1f1`     | Row hover.                           |
| `--de-emergency-gray`           | `#555`        | Disabled state, muted icons.         |
| `--de-emergency-gray-medium`    | `#55555555`   | Borders and dashed outlines.         |
| `--de-emergency-gray-light`     | `#929292`     | Timestamps.                          |
| `--de-emergency-success`        | `#4cd03a`     | Checked icons, success outline.      |
| `--de-emergency-error`          | `#dc3545`     | Error icon, failed outline.          |
| `--de-emergency-radius`         | `0.5rem`      | Panel and card corners.              |
| `--de-emergency-font`           | Poppins stack | Typography; the font is not bundled. |

Every rule also has a literal fallback, so the panel renders correctly even if
the variables are missing.

## Theme option

```ts
mount({
  /* … */
  theme: {
    accent: '#ff0000',
    accentContrast: '#ffffff',
    surface: '#ffffff',
    text: '#3d4461',
    muted: '#686868',
    radius: '0.5rem',
  },
});
```

The client maps these keys to the variables above and applies them inline on the
panel root, so they win over host-level declarations for that mount. Only
truthy values are emitted.

## CSS override

```css
:root {
  --de-emergency-primary: #0056b3;
  --de-emergency-radius: 0.75rem;
}
```

## Visual identity

- Full-screen fixed panel with a red header and a white scrollable body.
- A three-row grid: header, body, footer.
- A 4-column responder table: name, sent, delivered, read.
- An orange resume overlay above the panel.
- Red success/failure feedback surfaces; the simulation surface uses the
  information blue/green family.

No Tailwind, PostCSS, FontAwesome or icon package is required. Icons are inline
SVG sized with `currentColor` and `1em`.

## Z-index

The panel uses `z-index: 100` and the resume notification uses `1000`. Raise a
host layer only for content that must sit above the panel.

## Responsive behavior

At `max-width: 600px` the status grid switches to
`1fr 0.65fr 0.65fr 0.65fr`; at `480px` the footer and resume card tighten their
padding. Buttons keep a 44–48 px touch target.

## Motion

The panel respects `prefers-reduced-motion: reduce`. Transitions and the
slide-up animation are removed; the spinner slows to a 3-second rotation
instead of disappearing, because it still communicates progress.

## Next step

[Accessibility](accessibility.md).
