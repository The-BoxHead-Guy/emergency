# npm publishing

Applies to: maintainers.

Public package: `@dataemergencia/emergency`.

The step-by-step release flow is [Releasing the client](releasing.md). This page
covers the package metadata, the publish mechanics and npm-specific failures.

## Package metadata

`package.json` must keep:

| Field                  | Value                                                  |
| ---------------------- | ------------------------------------------------------ |
| `name`                 | `@dataemergencia/emergency`                            |
| `license`              | `MIT`                                                  |
| `repository.url`       | `git+https://github.com/The-BoxHead-Guy/emergency.git` |
| `bugs.url`             | `https://github.com/The-BoxHead-Guy/emergency/issues`  |
| `homepage`             | `https://github.com/The-BoxHead-Guy/emergency#readme`  |
| `files`                | `["dist", "!dist/**/*.map"]`                           |
| `publishConfig.access` | `public`                                               |
| `exports`              | `.`, `./styles.css`, `./iife`                          |
| `unpkg` / `jsdelivr`   | `./dist/iife/emergency.iife.global.js`                 |
| `engines.node`         | `>=22.0.0`                                             |

`files` publishes `dist/` plus the package metadata and docs that npm always
includes; source, tests, docs and examples are not published.

## Inspect the tarball

```bash
cd libs/emergency
npm pack --dry-run
```

The `files` field in `package.json` defines the published contents: `dist/`
without source maps, plus the metadata npm always includes. The command is only
a manual preview; the release pipeline trusts `files` and the build.

## Publish mechanisms

`0.1.0` was published manually with npm 2FA. From `0.2.0` onward the split
repository publishes through Trusted Publishing and OIDC, so no `NPM_TOKEN` is
stored anywhere.

The split repository contains `.github/workflows/publish-npm.yml`, which:

- declares `permissions: id-token: write` and `environment: npm`,
- validates that the requested version matches `package.json` and `CHANGELOG.md`,
- lets the npm lifecycle run check, tests and build once,
- publishes with `npm publish --provenance`.

Configure on npmjs.com:

1. Package → **Settings** → **Trusted publishing**.
2. Publisher: GitHub Actions.
3. Organization/user: `The-BoxHead-Guy`.
4. Repository: `emergency`.
5. Workflow filename: `publish-npm.yml`.
6. Environment: `npm`.

Provenance is only generated when the workflow runs from the public split
repository; the private monorepo cannot sign it.

The manual equivalent, from a clone of the split repository, is:

```bash
pnpm install --frozen-lockfile
npm login
bash ./scripts/release.sh 0.2.0 --publish
```

`prepublishOnly` runs check and tests, and `prepack` rebuilds `dist/`, so a bare
`npm publish` cannot ship stale artifacts. `scripts/release.sh` delegates to
those hooks instead of repeating them. npm prompts for the one-time password;
never paste a token into a shell history.

## Rollback and deprecation

npm versions are immutable. You cannot republish an existing version.

- Bad release: publish a patch that fixes or reverts it.
- Broken install: deprecate the version with a message:

  ```bash
  npm deprecate "@dataemergencia/emergency@0.2.0" "Use 0.2.1; 0.2.0 breaks the session flow."
  ```

- Unpublish only within npm's 72-hour window and only with explicit approval.
  Never unpublish a version that consumers may depend on.

## Troubleshooting

| Symptom                                                                  | Cause                                                           | Fix                                                                    |
| ------------------------------------------------------------------------ | --------------------------------------------------------------- | ---------------------------------------------------------------------- |
| `E404` on publish                                                        | Scope missing or not logged in                                  | `npm login`, verify `npm whoami`                                       |
| `E403`                                                                   | No publish permission for the scope                             | Ask an org owner; confirm `publishConfig.access`                       |
| `EPUBLISHCONFLICT`                                                       | Version already exists                                          | Bump the version; never reuse                                          |
| `EOTP`                                                                   | 2FA required                                                    | Re-run and enter the current code                                      |
| Provenance error in CI                                                   | Workflow not run from the public repo, or wrong repo configured | Run from the split repo and re-check Trusted Publishing settings       |
| `refusing to allow a Personal Access Token to create or update workflow` | The split token lacks workflow permissions                      | Add `workflow` (classic) or `Workflows: read and write` (fine-grained) |
| Tarball missing `dist/`                                                  | Build was not run before pack                                   | `pnpm run build` first                                                 |
| Consumers cannot resolve types                                           | `exports` changed                                               | Restore the `types` conditions and publish a patch                     |

## Next step

[Releasing the client](releasing.md).
