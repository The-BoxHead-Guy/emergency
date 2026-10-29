# Emergency client documentation

`@dataemergencia/emergency` is the browser client for the DataEmergencia
emergency flow. It owns everything that happens after the SOS trigger: the
panel, the emergency lifecycle, public realtime updates and the fallback
surfaces.

The client never calls the upstream DataEmergencia API. Its only backend
contract is the emergency BFF (`/de-bff/emergency`), documented at
[`dataemergencia/emergency-bff`](https://github.com/The-BoxHead-Guy/emergency-bff).

## Start here

| If you are…                        | Read                                                                                                         |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| Adding the panel to a plain page   | [Installation](client/installation.md) → [Vanilla quickstart](client/vanilla.md)                             |
| Adding the panel to a React app    | [React guide](client/react.md)                                                                               |
| Building the whole flow            | [Zero to panel](https://github.com/The-BoxHead-Guy/emergency-bff/blob/main/docs/onboarding/zero-to-panel.md) |
| Configuring the client             | [Configuration](client/configuration.md)                                                                     |
| Styling or reviewing accessibility | [Theming](client/theming.md) and [Accessibility](client/accessibility.md)                                    |
| Publishing a release               | [Release and deployment](release/release-checklist.md)                                                       |

## Documentation map

The information architecture is: overview, quickstart, BFF configuration,
client configuration, API contract, examples, operations, migration, release and
deployment, and troubleshooting.

### Client guides

- [Installation](client/installation.md)
- [Quickstart](client/quickstart.md)
- [Trigger](client/trigger.md)
- [Configuration](client/configuration.md)
- [Methods and events](client/methods-and-events.md)
- [Theming](client/theming.md)
- [Accessibility](client/accessibility.md)
- [Safety behavior](client/safety.md)
- [Vanilla / IIFE](client/vanilla.md)
- [React](client/react.md)
- [Troubleshooting](client/troubleshooting.md)
- [Browser support](client/browser-support.md)

### Contract and examples

- [API contract](https://github.com/The-BoxHead-Guy/emergency-bff/blob/main/docs/api-contract.md)
- [Examples](examples.md)
- [BFF documentation](https://github.com/The-BoxHead-Guy/emergency-bff)

### Operations and release

- [Client operations FAQ](operations/faq.md)
- [Split repositories](release/split-repositories.md)
- [Versioning](release/versioning.md)
- [npm publication](release/npm.md)
- [Release checklist](release/release-checklist.md)

### Contributor documentation

- [Documentation standards](contributing/documentation.md)
- [Verification log](https://github.com/The-BoxHead-Guy/emergency-bff/blob/v0.1.0/docs/contributing/verification.md)

## Version

These docs describe `0.1.0` and are versioned with the package. The quickstart
is tested against the latest published tag.
