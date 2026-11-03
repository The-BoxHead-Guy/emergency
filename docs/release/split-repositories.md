# Split repositories

Applies to: maintainers.

`@dataemergencia/emergency` is developed in this monorepo at
`libs/emergency` and published from a public split repository. Packagist and npm
consume the split repository, never the monorepo.

The release steps are in [Releasing the client](releasing.md).

## Source of truth

| Item              | Value                                          |
| ----------------- | ---------------------------------------------- |
| Monorepo source   | `libs/emergency`                               |
| Public repository | `https://github.com/The-BoxHead-Guy/emergency` |
| Package           | `@dataemergencia/emergency`                    |
| Registry          | npm public                                     |
| Monorepo tags     | `emergency-client-vX.Y.Z`                      |
| Split tags        | `vX.Y.Z`                                       |
| Split workflow    | `.github/workflows/split-emergency-client.yml` |
| Split secret      | `EMERGENCY_CLIENT_SPLIT_TOKEN`                 |

Never edit the split repository directly. The next split uses
`rsync --delete` and overwrites it.

## Tag names are project-scoped

The monorepo hosts several packages, so a tag prefix that names only the
registry (`npm-v*`) would collide as soon as a second npm package is released,
and would trigger this split for the wrong package.

Use the project name in the tag:

```bash
# monorepo
git tag -a emergency-client-v0.2.0 -m "release: 0.2.0"
git push origin emergency-client-v0.2.0

# resulting split tag
v0.2.0
```

`npm-v0.1.0` and `npm-v0.2.0` are historical tags from the old scheme. Do not
create new ones.

The workflow can also be run manually with the `tag` input
(`emergency-client-vX.Y.Z`). Manual dispatch is useful when a tag already exists
but the split push failed.

## What the split copies

The workflow copies `libs/emergency/` to the split root, excluding:

- `.git`
- `node_modules`
- `dist`
- `project.json` (Nx project file)
- `docs/plans`
- `examples/vanilla/emergency.global.js`

It then regenerates `pnpm-lock.yaml` with `pnpm install --lockfile-only` so the
split repository has a standalone lockfile for its own CI.

The split repository receives:

- `src/`, `tests/`, `examples/`, `scripts/`
- `package.json`, `tsconfig.json`, `vite.config.ts`, `vitest.setup.ts`
- `README.md`, `CHANGELOG.md`, `LICENSE`
- `docs/`
- `.github/workflows/ci.yml` and `publish-npm.yml`
- the regenerated lockfile

It does not receive the monorepo Nx configuration or other packages.

## Tag flow

```text
monorepo commit
  └─ tag emergency-client-v0.2.0
       └─ split workflow
            ├─ validates the tag against package.json
            ├─ commit release: emergency-client-v0.2.0 on split main
            └─ force tag v0.2.0
```

## Before tagging

1. `CHANGELOG.md` has an entry for the version.
2. `package.json` has the same version, committed.
3. The monorepo working tree is clean.
4. `pnpm run check` passes in `libs/emergency`.
5. `pnpm run test` passes in `libs/emergency`.
6. `pnpm run build` passes in `libs/emergency`.
7. `npm pack --dry-run` contains only `dist/`, `README.md`, `LICENSE`,
   `CHANGELOG.md` and `package.json`.
8. The IIFE gzip size is at most 150 KiB.

`bash ./scripts/release.sh X.Y.Z` checks items 1, 2, 7 and 8 in one pass.

## What "read-only" means

- Do not push commits to the split repository by hand; use the workflow, or
  `scripts/split.sh` when the workflow cannot run.
- Do not create split tags by hand; the workflow and the script force-tag to keep
  the split commit and tag aligned.
- A hotfix goes through the monorepo, then a patch tag
  (`emergency-client-vX.Y.Z`).
- If a split run fails after tagging, fix the workflow or secret and re-run the
  workflow for the same tag. Do not delete the monorepo tag unless the release
  was never published; npm versions are immutable.

## Secrets

`EMERGENCY_CLIENT_SPLIT_TOKEN` is a fine-grained GitHub token scoped to
`The-BoxHead-Guy/emergency` with:

- **Contents: read and write** — clone, commit and push `main`.
- **Workflows: read and write** — the mirror updates `.github/workflows/`, and
  GitHub rejects those pushes without it.

A classic token needs the `repo` and `workflow` scopes. Without `workflow`, the
push fails with:

```text
refusing to allow a Personal Access Token to create or update workflow
`.github/workflows/publish-npm.yml` without `workflow` scope
```

Store the token as a repository secret in the monorepo. It is used only by the
split workflow and is never printed.

`NPM_TOKEN` is not used. Publishing goes through npm Trusted Publishing (OIDC)
from the split repository. See [npm publishing](npm.md).

To check a token before re-running the workflow:

```bash
curl -sS -D- -o /dev/null -H "Authorization: Bearer $TOKEN" \
  https://api.github.com/repos/The-BoxHead-Guy/emergency |
  grep -iE '^HTTP/|x-oauth-scopes|github-authentication-token-expiration'
```

## Manual split fallback

When Actions is quota-limited or the workflow cannot run, `scripts/split.sh`
performs the same mirror manually:

```bash
bash ./scripts/split.sh 0.2.0          # dry run: clones, mirrors, verifies
bash ./scripts/split.sh 0.2.0 --push   # commits, pushes main and v0.2.0
bash ./scripts/split.sh 0.2.0 --push --publish  # also publishes to npm
```

It refuses to run when the package tree is dirty, verifies the committed version
and the changelog entry, checks npm for an already published version, and accepts
`--remote <url>` for a test repository. The mirror is built with `git archive`
from `HEAD`, so only committed files can reach the public repository, and it
excludes `project.json` (Nx) and `docs/plans/` (internal notes).

Inside the mirror it regenerates `pnpm-lock.yaml`, runs the standalone install,
check, test, build and pack inspection, shows the exact diff, and only then
pushes `main` and the force-updated `vX.Y.Z` tag. The monorepo tag
`emergency-client-vX.Y.Z` is created locally and never pushed automatically.

## Clean checkout

The split repository must build without the monorepo:

```bash
git clone https://github.com/The-BoxHead-Guy/emergency.git
cd emergency
pnpm install --frozen-lockfile
pnpm run check
pnpm run test
pnpm run build
npm pack --dry-run
```

If this fails, the release is not complete even when npm published successfully.

## Next step

[npm publishing](npm.md).
