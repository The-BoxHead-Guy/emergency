# Accessibility

Applies to: React and vanilla JavaScript integrators.

The panel targets WCAG 2.2 AA for the interactions it owns. Your host page still
owns its own labels, contrast and language.

## Dialog semantics

The panel is a `div` with:

```html
<div role="dialog" aria-modal="true" aria-labelledby="…" tabindex="-1"></div>
```

It is not a native `<dialog>`, so it works in the same way across the supported
browsers and does not depend on `showModal()`.

The accessible name comes from the visible heading (`SOS` when idle,
`Emergencia activa` when active). There is no separate hidden title.

## Focus

On open:

1. The first focusable element inside the panel receives focus.
2. Focus is trapped with Tab and Shift+Tab.
3. The background page is not `inert`; the DOM trap is the boundary. Avoid
   rendering your own modal above the panel.

On close:

1. The keydown listener is removed.
2. Focus returns to the element that was focused before the panel opened, if it
   is still connected.

If the trigger was removed from the DOM while the panel was open, focus is not
moved; the browser decides where it lands.

## Keyboard

| Key             | Action                       |
| --------------- | ---------------------------- |
| Tab / Shift+Tab | Cycle inside the panel.      |
| Escape          | Close the panel.             |
| Enter / Space   | Activate the focused button. |

Escape closes the panel but does not abort an active emergency. The emergency
keeps running; the resume notification appears after closing if the panel stays
closed.

## Screen readers

- The resume notification is a `role="status"` region with an accessible name.
- Delivery status is visible text, not color alone (`Pendiente`, `Enviado`,
  `Entregado`, `Leído`, `Fallido`).
- Loading states use visible copy (`Activando emergencia…`, `Actualizando…`).
- Errors are rendered as text with the action to retry.
- The spinner is decorative; progress is announced through the changing copy.

## Language

The panel copy is Spanish. The root document should declare `lang="es"` for the
panel content, or the closest ancestor of the mount root should. If your page is
in another language, set `lang="es"` on the mount root:

```html
<div id="emergency-root" lang="es"></div>
```

`locale` does not change the panel language; it only affects date and number
formatting.

## Contrast

Defaults:

- text `#14181f` on `#ffffff`: AAA.
- muted `#5b6472` on `#ffffff`: AA for normal text.
- accent `#e11d2e` with white text: AA for large text and UI components; verify
  your custom accent with a contrast checker.

If you override `accent`, also set `accentContrast` so button labels stay
readable.

## Touch targets

Primary and secondary buttons have a minimum height of 44–48 px. The close
button has an accessible label (`Cerrar panel`), not only an icon.

## Reduced motion

`prefers-reduced-motion: reduce` slows the spinner to a 3-second rotation. No
other animation is required for understanding the state.

## Testing checklist

- Open with the keyboard only: Tab to the SOS control, press Enter.
- Tab through every control; focus never leaves the panel.
- Press Escape; focus returns to the SOS control.
- Activate with geolocation blocked; the error and fallback phone are readable.
- Run a screen reader over the activation states and the resume notification.
- Zoom to 200%; the panel remains usable and does not clip the abort action.

## Next step

[Safety](safety.md).
