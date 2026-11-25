# Versioning

Applies to: maintainers and integrators.

The BFF and the client are versioned independently. A client release does not
require a BFF release, and the reverse is also true.

## Current version

This document does not pin a version number. The canonical current version of
each package is its `package.json` (when it has one) and its changelog:

- `@dataemergencia/emergency`: [`package.json`](../../package.json) and
  [`CHANGELOG.md`](../../CHANGELOG.md).
- `dataemergencia/emergency-bff`: the latest `emergency-bff-v*` tag and
  [`packages/emergency-bff/CHANGELOG.md`](../../../../packages/emergency-bff/CHANGELOG.md).
  The BFF has no `version` field; the tag is its release marker.

Registries: Packagist for the BFF, npm for the client.

## Development line (`0.y.z`)

Both packages are still in the `0.y.z` line. Semver applies, with the pre-1.0
convention:

- **Patch**: bump the last number. Bug fixes, documentation fixes, no API
  change.
- **Minor**: bump the middle number and reset the last to zero. New features and
  potentially breaking changes. Read the changelog before upgrading.
- **Major** (`1.0.0`): the first public release after general testing. It is not
  reached merely by finishing a feature; publish it once the library leaves
  internal testing and is in use by the public.

Once a package reaches `1.0.0`, breaking changes require a major version.

## Compatibility

The client and BFF speak the HTTP contract documented in the
[BFF HTTP contract](https://github.com/The-BoxHead-Guy/emergency-bff/blob/main/docs/bff/routes.md).
The contract is versioned with the BFF.

| Client  | BFF     | Status                                                    |
| ------- | ------- | --------------------------------------------------------- |
| `0.1.x` | `0.1.x` | Supported.                                                |
| `0.1.x` | `0.2.x` | Not supported: BFF 0.2.0 removes the `realtime` block.    |
| `0.2.x` | `0.1.x` | Not supported unless the client changelog says otherwise. |
| `0.2.x` | `0.2.x` | Not supported: BFF 0.2.0 removes the `realtime` block.    |
| `0.3.x` | `0.1.x` | Supported. The client ignores the legacy `realtime` key.  |
| `0.3.x` | `0.2.x` | Supported. The client ignores the legacy `realtime` key.  |

Additive response fields are not breaking: both packages ignore unknown keys.
Removing, renaming or changing the type of a field is breaking.

The client does not pin the BFF version at runtime. Version compatibility is a
documentation and release-test concern.

## Tags

| Package                        | Monorepo tag              | Split tag |
| ------------------------------ | ------------------------- | --------- |
| `dataemergencia/emergency-bff` | `emergency-bff-vX.Y.Z`    | `vX.Y.Z`  |
| `@dataemergencia/emergency`    | `emergency-client-vX.Y.Z` | `vX.Y.Z`  |

Monorepo tags are project-scoped so several packages can release independently in
one repository. Split tags stay plain `vX.Y.Z` because each package has its own
repository.

The prefix also routes the release: only `emergency-client-v*` starts the client
split workflow, and only `emergency-bff-v*` starts the BFF split workflow. Never
reuse the old `npm-v*` and `php-v*` prefixes.

## Deprecation

- Announce a deprecation in the changelog and in the docs for the release that
  introduces it.
- Keep the deprecated behavior for at least one minor release before removal.
- Do not remove a public method, option, environment variable or response field
  in a patch release.

## Changelogs

Both packages use [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) with
an `Unreleased` section.

```markdown
## [Unreleased]

### Added

### Changed

### Deprecated

### Removed

### Fixed

### Security
```

Every user-visible change gets an entry in the same pull request. A release
moves `Unreleased` entries under the version and date.

## Docs version

The docs in `docs/` describe the current development state. Each release tag
contains the docs for that release. Quickstarts are tested against the latest
tag, not against `main`.

## Release order

Publish first the package that tolerates both contracts. A change that only adds
fields can ship in either order because both packages ignore unknown keys. A
change that removes or renames a field ships after the tolerant consumer.

For the realtime-ownership change, publish `@dataemergencia/emergency` `0.3.0`
before `emergency-bff` `0.2.0`: the new client ignores the legacy `realtime` key,
but published `0.2.x` clients require it. See
[Releasing the client](releasing.md).

## Next step

[npm publishing](npm.md).
