# Releasing the client

Applies to: maintainers. This page is the single source of truth for releasing
`@dataemergencia/emergency`. Everything else in `docs/release/` explains one
part of this flow.

When a release changes the HTTP contract, publish the package that tolerates
both contracts first. Mergeable additive fields can ship in either order; a
removed or renamed field requires the tolerant side to ship first.

For example, `@dataemergencia/emergency` `0.3.0` ships before `emergency-bff`
`0.2.0`: the new client ignores the legacy `realtime` key, while published
`0.2.x` clients require it. Reversing that order breaks those clients.

## One-time setup

- Repository secret `EMERGENCY_CLIENT_SPLIT_TOKEN`: a fine-grained token with
  **Contents: read and write** and **Workflows: read and write** on
  `The-BoxHead-Guy/emergency`.
- npm Trusted Publishing configured for the split repository, per
  [npm publishing](npm.md).
- Permission to push tags to `The-BoxHead-Guy/dataemergencia`.

A classic token with only `repo` is not enough: the mirror updates
`.github/workflows/` in the split repository, and GitHub rejects that push
without the `workflow` scope.

## 1. Choose the version

| Change                                            | Version |
| ------------------------------------------------- | ------- |
| Bug fix, docs, internal refactor, no API change   | patch   |
| New feature or a potentially breaking pre-1.0 API | minor   |
| First stable commitment (from `1.0.0`)            | major   |

The rules in detail: [Versioning](versioning.md).

## 2. Update the changelog

Move the `Unreleased` entries under the new version with today's date:

```markdown
## [0.2.1] - 2026-11-05

### Fixed

- ...
```

## 3. Bump the package

From the package directory:

```bash
cd libs/emergency
pnpm bump 0.2.1
```

`pnpm bump` is `pnpm version --no-git-tag-version`: it writes the version to
`package.json` and creates no commit or tag. Commit the changelog entry and the
version bump (one file per commit, per the monorepo git rules).

## 4. Verify

From the monorepo root:

```bash
pnpm install --frozen-lockfile
```

Then from `libs/emergency`:

```bash
pnpm run check
pnpm run test
pnpm run build
```

`npm publish` runs the same work through `prepublishOnly` (check and tests) and
`prepack` (build), so publishing never repeats a step.

Or run the whole release preflight at once, which also checks the version and
the changelog entry:

```bash
bash ./scripts/release.sh 0.2.1
```

The pull request check `Monorepo Libraries - Verify (emergency-client)` runs the
same check, test and build steps.

## 5. Tag and push

Tags are project-scoped so several packages can coexist in one repository:

| Monorepo tag              | Split repository tag |
| ------------------------- | -------------------- |
| `emergency-client-v0.2.1` | `v0.2.1`             |

```bash
git tag -a emergency-client-v0.2.1 -m "release: 0.2.1"
git push origin emergency-client-v0.2.1
```

Pushing the tag runs
`.github/workflows/split-emergency-client.yml`:

1. Validates the tag format and refuses to continue when `package.json` has a
   different version.
2. Mirrors `libs/emergency` to `The-BoxHead-Guy/emergency`.
3. Regenerates the standalone lockfile.
4. Pushes `main` and force-updates `v0.2.1`.

Do not remove `.github/` from the mirror and do not tag other packages with this
prefix.

## 6. Publish to npm

In the split repository (`The-BoxHead-Guy/emergency`):

1. Actions → **Publish to npm** → Run workflow.
2. `version`: `0.2.1` (must equal `package.json`).
3. `confirm`: `publish`.

The workflow publishes with provenance through OIDC; no `NPM_TOKEN` is stored.
The manual equivalent, from a clone of the split repository, is:

```bash
bash ./scripts/release.sh 0.2.1 --publish
```

## 7. Verify the release

```bash
npm view @dataemergencia/emergency version
npm view @dataemergencia/emergency dist-tags
git ls-remote --tags https://github.com/The-BoxHead-Guy/emergency.git "v0.2.1"
```

Then install in a clean directory and confirm `mount` is a function:

```bash
mkdir -p /tmp/emergency-consumer && cd /tmp/emergency-consumer
npm init -y
npm install @dataemergencia/emergency@0.2.1
node -e "console.log(typeof require('@dataemergencia/emergency').mount)"
```

## Manual fallback

When Actions is unavailable, `scripts/split.sh` performs the same mirror locally
from the committed tree:

```bash
cd libs/emergency
bash ./scripts/split.sh 0.2.1          # dry run: mirror, install, check, test, build, pack
bash ./scripts/split.sh 0.2.1 --push   # commit, push main and v0.2.1
bash ./scripts/split.sh 0.2.1 --push --publish  # also publish with npm 2FA
```

## Troubleshooting

| Symptom                                                                                             | Cause                                                           | Fix                                                                                       |
| --------------------------------------------------------------------------------------------------- | --------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| `Invalid username or token. Password authentication is not supported`                               | Secret empty, expired, revoked, or not scoped to the split repo | Re-create the token, update the secret, re-run the workflow                               |
| `refusing to allow a Personal Access Token to create or update workflow ... without workflow scope` | Token may push contents but not workflow files                  | Add `workflow` to a classic token, or `Workflows: read and write` to a fine-grained token |
| `Tag must look like emergency-client-vX.Y.Z`                                                        | Wrong tag name                                                  | Delete the local tag and tag again with the project-scoped prefix                         |
| `package.json is X but the tag says Y`                                                              | Version bumped after tagging, or tag created without a bump     | Bump, commit, then tag the commit                                                         |
| `E403` or `EOTP` on publish                                                                         | Missing scope permission, or 2FA required                       | Check the npm scope and re-run with a fresh one-time password                             |
| `EPUBLISHCONFLICT`                                                                                  | Version already on npm                                          | Bump to a new version; npm versions are immutable                                         |

## Next step

- [Split repositories](split-repositories.md) for the mirror contract.
- [Versioning](versioning.md) for compatibility with the BFF.
