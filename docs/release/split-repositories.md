# Split repositories

Applies to: maintainers.

`@dataemergencia/emergency` is developed in this monorepo at
`libs/emergency` and published from a public split repository. Packagist and npm
consume the split repository, never the monorepo.

## Source of truth

| Item              | Value                                          |
| ----------------- | ---------------------------------------------- |
| Monorepo source   | `libs/emergency`                               |
| Public repository | `https://github.com/The-BoxHead-Guy/emergency` |
| Package           | `@dataemergencia/emergency`                    |
| Registry          | npm public                                     |
| Monorepo tags     | `npm-vX.Y.Z`                                   |
| Split tags        | `vX.Y.Z`                                       |
| Split workflow    | `.github/workflows/split-emergency-client.yml` |
| Split secret      | `EMERGENCY_CLIENT_SPLIT_TOKEN`                 |

Never edit the split repository directly. The next split uses
`rsync --delete` and overwrites it.

## What the split copies

The workflow copies `libs/emergency/` to the split root, excluding:

- `.git`
- `node_modules`
- `dist`
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
  └─ tag npm-v0.1.0
       └─ split workflow
            ├─ commit release: npm-v0.1.0 on split main
            └─ force tag v0.1.0
```

The split tag is derived by replacing `npm-` with nothing:

```bash
# monorepo
git tag npm-v0.1.0
git push origin npm-v0.1.0

# resulting split tag
v0.1.0
```

The workflow can also be run manually with the `tag` input
(`npm-vX.Y.Z`). Manual dispatch is useful when a tag already exists but the
split push failed.

## Before tagging

1. `CHANGELOG.md` has an entry for the version.
2. `package.json` has the version (the release script bumps it).
3. The monorepo working tree is clean.
4. `pnpm nx run @dataemergencia/emergency:typecheck` passes.
5. `pnpm nx run @dataemergencia/emergency:test` passes.
6. `pnpm nx run @dataemergencia/emergency:build` passes.
7. `npm pack --dry-run` contains only `dist/`, `README.md`, `LICENSE` and
   `package.json`.
8. The IIFE gzip size is at most 150 KiB.

## What "read-only" means

- Do not push commits to the split repository by hand; use the workflow, or
  `scripts/split.sh` when the workflow cannot run.
- Do not create split tags by hand; the workflow and the script force-tag to keep
  the split commit and tag aligned.
- A hotfix goes through the monorepo, then a patch tag (`npm-v0.1.1`).
- If a split run fails after tagging, fix the workflow or secret and re-run the
  workflow for the same tag. Do not delete the monorepo tag unless the release
  was never published; npm versions are immutable.

## Secrets

`EMERGENCY_CLIENT_SPLIT_TOKEN` is a fine-grained GitHub token with
**Contents: read and write** on `The-BoxHead-Guy/emergency`. Store it as a
repository secret in the monorepo. It is used only by the split workflow and is
never printed.

`NPM_TOKEN` is not used. The first publish is manual with 2FA; later publishes
use npm Trusted Publishing (OIDC) from the split repository. See
[npm publishing](npm.md).

## Manual split fallback

When the Actions quota is exhausted or the workflow cannot run, `scripts/split.sh`
performs the same mirror manually:

```bash
bash ./scripts/split.sh 0.1.0          # dry run: clones, mirrors, verifies
bash ./scripts/split.sh 0.1.0 --push   # commits, pushes main and v0.1.0
bash ./scripts/split.sh 0.1.0 --push --publish  # also publishes to npm
```

It refuses to run when the package tree is dirty, verifies the committed version
and the changelog entry, checks npm for an already published version, and passes
`--remote <url>` for a test repository. The mirror is built with `git archive`
from `HEAD`, so only committed files can reach the public repository, and it
excludes `project.json` (Nx) and `docs/plans/` (internal notes).

Inside the mirror it regenerates `pnpm-lock.yaml`, runs the standalone install,
check, test, build and pack inspection, shows the exact diff, and only then
pushes `main` and the force-updated `vX.Y.Z` tag. The monorepo tag `npm-vX.Y.Z`
is created locally and never pushed automatically.

## Clean checkout

The split repository must build without the monorepo:

```bash
git clone https://github.com/The-BoxHead-Guy/emergency.git
cd emergency
pnpm install --frozen-lockfile
pnpm run typecheck
pnpm run test
pnpm run build
npm pack --dry-run
```

If this fails, the release is not complete even when npm published successfully.

## Next step

[Versioning](versioning.md).
