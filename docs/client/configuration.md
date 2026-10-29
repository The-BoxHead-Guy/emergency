# Configuration

Applies to: React and vanilla JavaScript integrators.

## Mount options

| Option                 | Type                                                      | Default | Notes                                                                          |
| ---------------------- | --------------------------------------------------------- | ------- | ------------------------------------------------------------------------------ |
| `root`                 | `HTMLElement \| string`                                   | —       | Required. Selector or element that receives the React tree.                    |
| `bffBaseUrl`           | `string`                                                  | —       | Required. Full BFF prefix, for example `https://example.com/de-bff/emergency`. |
| `code`                 | `string`                                                  | —       | Required. Six characters, first is a letter.                                   |
| `trigger`              | `string \| HTMLElement \| (open) => void \| (() => void)` | none    | Optional click trigger.                                                        |
| `fallback`             | `{ phone: string; label: string }`                        | none    | Direct-call surface used when geolocation fails.                               |
| `theme`                | `EmergencyTheme`                                          | none    | CSS variable overrides.                                                        |
| `locale`               | `string`                                                  | `es`    | BCP 47 locale for dates and numbers. Does not translate UI copy.               |
| `geolocationTimeoutMs` | `number`                                                  | `8000`  | Browser geolocation timeout.                                                   |
| `requestTimeoutMs`     | `number`                                                  | `15000` | BFF request timeout.                                                           |
| `onEvent`              | `(name, payload) => void`                                 | none    | Typed lifecycle events.                                                        |

## Validation

Invalid configuration never throws into the host page. `mount()`:

1. logs `[emergency] <message>` with `console.error`,
2. emits `emergency:failed` with operation `mount`,
3. returns an inert client whose methods are no-ops.

Cases:

- `root` selector does not match, or the value is not an `HTMLElement`.
- `bffBaseUrl` is empty after trimming.
- `bffBaseUrl` is not `https://`, not a path on the current origin, or is plain
  `http://` outside loopback.
- `code` does not match `^[A-Za-z][A-Za-z0-9]{5}$`.
- `fallback` is present but `phone` or `label` is blank.
- `mount()` is called outside a browser (`document` is undefined).

The error code is `configuration`.

## BFF base URL

The value is trimmed and trailing slashes are removed. Include the route prefix:

```ts
bffBaseUrl: 'https://example.com/de-bff/emergency';
```

If your BFF uses a custom `EMERGENCY_BFF_ROUTE_PREFIX`, use that value. The
client does not assume `/de-bff/emergency` at runtime.

Accepted forms:

- an absolute `https://` URL, for example `https://api.example.com/de-bff/emergency`;
- a same-origin path starting with a single slash, for example `/de-bff/emergency`;
- `http://` only for loopback hosts (`localhost`, `*.localhost`, `127.0.0.1`,
  `[::1]`) in local development.

Rejected forms: `http://` on any other host, `javascript:`, `data:`, `file:` and
other schemes, protocol-relative values such as `//example.com`, URLs without a
scheme, and URLs that embed credentials (`https://user:password@host`). The
client sends cookies (`withCredentials`) by default, so an insecure or
look-alike origin would expose the session; the validation fails loudly instead.

The page and the BFF must share an origin. The BFF rejects cross-origin requests
even if the client sends credentials.

`createBffClient` follows no HTTP redirects (`maxRedirects: 0`): a redirect would
move a credentialed request, including the `X-CSRF-Token` header, to a different
origin. If your deployment needs a redirect to the canonical host, fix the URL
instead of enabling redirects.

## Identity code

The code is supplied by your backend, not typed by the user in the panel. It is
the code encoded in the bracelet or assigned to the account.

Do not derive it from user input without server-side validation; the BFF
validates existence and returns `inactive_code` if the code is not active.

## Fallback

```ts
fallback: {
  phone: '+57 300 123 4567',
  label: 'Línea de emergencia',
}
```

The client does not hardcode a country emergency number. Provide the number your
organization operates. When geolocation is denied, unavailable, times out or is
unsupported, the panel shows this number with a `tel:` call button and a
`Llamar` action.

If you omit `fallback`, the panel still explains the geolocation error but
offers no direct-call action. Provide it.

## Theme

```ts
theme: {
  accent: '#0f766e',
  accentContrast: '#ffffff',
  surface: '#ffffff',
  text: '#111827',
  muted: '#6b7280',
  radius: '20px',
}
```

See [Theming](theming.md) for the CSS variables and defaults.

## Locale

`locale` is passed to `Intl.DateTimeFormat` and number formatting. It does not
change the Spanish UI copy, because the MVP ships a single copy catalog.

## Timeouts

- `geolocationTimeoutMs` controls `navigator.geolocation.getCurrentPosition`.
- `requestTimeoutMs` controls the axios request timeout to the BFF.

Both must be positive numbers. The client does not clamp them; an extremely low
value produces the corresponding timeout error.

## Realtime

Realtime is configured by the BFF, not by mount options. `GET /config` returns
the public Pusher key, cluster and channel pattern. The client subscribes only
when an emergency is active and responders exist.

There is no private-channel option in the MVP. Do not add a Pusher secret to
the browser.

## Multiple mounts

Each `mount()` creates an isolated store, controller and React root. Two mounts
on the same page are independent; `destroy()` on one does not affect the other.
Mount once per identity code per page.

## Next step

[Methods and events](methods-and-events.md).
