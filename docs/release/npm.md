# npm publishing

Applies to: maintainers.

Public package: `@dataemergencia/emergency`.

## Package metadata

`package.json` must keep:

| Field                  | Value                                                  |
| ---------------------- | ------------------------------------------------------ |
| `name`                 | `@dataemergencia/emergency`                            |
| `license`              | `MIT`                                                  |
| `repository.url`       | `git+https://github.com/The-BoxHead-Guy/emergency.git` |
| `bugs.url`             | `https://github.com/The-BoxHead-Guy/emergency/issues`  |
| `homepage`             | `https://github.com/The-BoxHead-Guy/emergency#readme`  |
| `files`                | `["dist"]`                                             |
| `publishConfig.access` | `public`                                               |
| `exports`              | `.`, `./styles.css`, `./iife`                          |
| `unpkg` / `jsdelivr`   | `./dist/iife/emergency.iife.global.js`                 |
| `engines.node`         | `>=24.22.1`                                            |

`files: ["dist"]` means the tarball contains `dist/`, `README.md`, `LICENSE`,
`package.json` and `CHANGELOG.md`. Source files are not published.

## Inspect the tarball

```bash
pnpm nx run @dataemergencia/emergency:build
cd libs/emergency
npm pack --dry-run
```

Check:

- no `src/`, `tests/`, `docs/`, `examples/`, `node_modules/` or `.env` files,
- no `dist/**/*.map` files (source maps stay in the repository, not on npm),
- `dist/index.js`, `dist/index.cjs`, `dist/index.d.ts`, `dist/index.d.cts`,
  `dist/styles.css`,
- `dist/iife/emergency.iife.global.js`,
- the package version.

`scripts/release.sh` runs this inspection before publishing and fails on any
unexpected file.

## First publish (0.1.0)

The first publish is manual, from the split repository, with an interactive
2FA prompt. There is no long-lived token.

```bash
# 1. In the monorepo: verify, mirror and push the split repository.
bash ./scripts/split.sh 0.1.0 --push

# 2. In the split checkout, or through split.sh --publish:
git clone https://github.com/The-BoxHead-Guy/emergency.git
cd emergency
pnpm install --frozen-lockfile
npm login          # account with access to the @dataemergencia scope
bash ./scripts/release.sh 0.1.0 --publish
```

The version must already be committed in `package.json` with a matching
`CHANGELOG.md` entry; the script verifies both and refuses to bump silently. It
runs install, `pnpm run check`, tests, build, the tarball inspection and the IIFE
budget check, then calls:

```bash
npm publish --access public
```

`prepack` rebuilds `dist/` on every `npm pack` and `npm publish`, and
`prepublishOnly` re-runs check and tests, so a bare `npm publish` cannot ship
stale artifacts.

npm prompts for the one-time password. Do not paste a token into a shell
history. `--access public` is required for a scoped package.

After publishing:

```bash
npm view @dataemergencia/emergency version
npm view @dataemergencia/emergency dist-tags
```

Then tag the monorepo (`npm-v0.1.0`) so the split workflow creates `v0.1.0`.

## Later publishes: trusted publishing

The split repository contains
`.github/workflows/publish-npm.yml`. It uses OpenID Connect and provenance:

- `permissions: id-token: write`
- `environment: npm`
- `npm install -g npm@latest`
- `npm publish --access public --provenance`

Configure on npmjs.com:

1. Package → **Settings** → **Trusted publishing**.
2. Publisher: GitHub Actions.
3. Organization/user: `The-BoxHead-Guy`.
4. Repository: `emergency`.
5. Workflow filename: `publish-npm.yml`.
6. Environment: `npm`.

The workflow runs from the **public split repository**. Provenance cannot be
generated from the private monorepo. Do not add `NPM_TOKEN`; the OIDC exchange
replaces it.

Run the workflow with the version already in `package.json`:

```text
Actions → Publish to npm → Run workflow → version: 0.1.1
```

The workflow fails if `package.json` does not match the input.

## Release sequence

```bash
# monorepo
git tag npm-v0.1.1
git push origin npm-v0.1.1
```

The split workflow copies the package, regenerates the lockfile, commits
`release: npm-v0.1.1`, and force-tags `v0.1.1`. Then run the publish workflow
from the split repository (or let a maintainer do it after verifying the tag).

The first release is the exception: publish manually, then tag.

## Rollback and deprecation

npm versions are immutable. You cannot republish `0.1.1`.

- Bad release: publish a patch (`0.1.2`) that fixes or reverts it.
- Broken install: deprecate the version with a message:

  ```bash
  npm deprecate "@dataemergencia/emergency@0.1.1" "Use 0.1.2; 0.1.1 breaks the session flow."
  ```

- Unpublish only within npm's 72-hour window and only with explicit approval.
  Never unpublish a version that consumers may depend on.

## Troubleshooting

| Symptom                        | Cause                                                           | Fix                                                              |
| ------------------------------ | --------------------------------------------------------------- | ---------------------------------------------------------------- |
| `E404` on publish              | Scope missing or not logged in                                  | `npm login`, verify `npm whoami`                                 |
| `E403`                         | No publish permission for the scope                             | Ask an org owner; confirm `publishConfig.access`                 |
| `EPUBLISHCONFLICT`             | Version already exists                                          | Bump the version; never reuse                                    |
| `EOTP`                         | 2FA required                                                    | Re-run and enter the current code                                |
| Provenance error in CI         | Workflow not run from the public repo, or wrong repo configured | Run from the split repo and re-check Trusted Publishing settings |
| Tarball missing `dist/`        | Build was not run before pack                                   | `pnpm run build` first                                           |
| Consumers cannot resolve types | `exports` changed                                               | Restore the `types` conditions and publish a patch               |

## Next step

[Release checklist](release-checklist.md).
