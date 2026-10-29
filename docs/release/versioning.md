# Versioning

Applies to: maintainers and integrators.

The BFF and the client are versioned independently. A client release does not
require a BFF release, and the reverse is also true.

## Current line

| Package                        | Registry  | Initial version |
| ------------------------------ | --------- | --------------- |
| `dataemergencia/emergency-bff` | Packagist | `0.1.0`         |
| `@dataemergencia/emergency`    | npm       | `0.1.0`         |

## Pre-1.0 policy

Both packages are `0.x`. Semver applies, with the pre-1.0 convention:

- **Patch** (`0.1.1`): bug fixes, documentation fixes, no API change.
- **Minor** (`0.2.0`): new features and potentially breaking changes. Read the
  changelog before upgrading.
- **Major** (`1.0.0`): the first stability commitment.

Once a package reaches `1.0.0`, breaking changes require a major version.

## Compatibility

The client and BFF speak the HTTP contract documented in the
[BFF API contract](https://github.com/The-BoxHead-Guy/emergency-bff/blob/v0.1.0/docs/api-contract.md).
The contract is versioned with the BFF.

| Client  | BFF     | Status                                                    |
| ------- | ------- | --------------------------------------------------------- |
| `0.1.x` | `0.1.x` | Supported.                                                |
| `0.1.x` | `0.2.x` | Read the BFF changelog; additive changes are compatible.  |
| `0.2.x` | `0.1.x` | Not supported unless the client changelog says otherwise. |

Additive response fields are not breaking: both packages ignore unknown keys.
Removing, renaming or changing the type of a field is breaking.

The client does not pin the BFF version at runtime. Version compatibility is a
documentation and release-test concern.

## Tags

| Package | Monorepo tag | Split tag |
| ------- | ------------ | --------- |
| BFF     | `php-v0.1.0` | `v0.1.0`  |
| Client  | `npm-v0.1.0` | `v0.1.0`  |

The two `v0.1.0` tags live in different repositories, so they do not collide.
The monorepo prefixes disambiguate them.

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

Publish the BFF first when a change touches both packages, because the client
depends on the BFF contract. Release the client second. See
[Release checklist](release-checklist.md).

## Next step

[npm publishing](npm.md).
