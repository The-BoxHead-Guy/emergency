# Release checklist

Applies to: maintainers.

Release the BFF first, the client second. Do not publish the client against an
unpublished BFF contract.

## Preconditions

- [ ] `CHANGELOG.md` has an entry for the version.
- [ ] `package.json` has the version, committed.
- [ ] The monorepo working tree is clean.
- [ ] You have run the release tests on Node 24.22.2 and PHP 8.4.
- [ ] No secret, production credential or private URL is in the diff.

## Client (`@dataemergencia/emergency`)

- [ ] `pnpm install --frozen-lockfile`
- [ ] `pnpm nx run @dataemergencia/emergency:check`
- [ ] `pnpm nx run @dataemergencia/emergency:test`
- [ ] `pnpm nx run @dataemergencia/emergency:build`
- [ ] `bash ./scripts/release.sh X.Y.Z` (install, check, test, build, pack, IIFE budget)
- [ ] The tarball lists only `dist/`, `README.md`, `LICENSE` and `package.json`.
- [ ] The tarball has no `dist/**/*.map` files.
- [ ] IIFE gzip is at most 150 KiB.
- [ ] `examples/vanilla` works against the mock BFF.
- [ ] Docs link check passes (`pnpm docs:verify` from the monorepo root).

## Split

- [ ] `bash ./scripts/split.sh X.Y.Z --push` succeeds (workflow fallback).
- [ ] Split `main` has the release commit.
- [ ] Split tag `vX.Y.Z` points at that commit.
- [ ] Clean checkout of the split repo passes `pnpm install --frozen-lockfile`,
      check, test, build and `npm pack --dry-run`.

## Publish

- [ ] First release: `bash ./scripts/release.sh X.Y.Z --publish` with npm 2FA.
- [ ] Later releases: Trusted Publishing workflow on the split repo.
- [ ] `npm view @dataemergencia/emergency version` returns the new version.
- [ ] Install in a clean directory:

  ```bash
  mkdir /tmp/emergency-consumer && cd /tmp/emergency-consumer
  npm init -y
  npm install @dataemergencia/emergency@X.Y.Z
  node -e "console.log(typeof require('@dataemergencia/emergency').mount)"
  ```

  Expected: `function`.

- [ ] The IIFE URL loads and `window.DataEmergenciaEmergency.mount` exists.

## Docs

- [ ] The versioned docs are in the split tag.
- [ ] Quickstart is tested against the published version.
- [ ] The compatibility matrix is updated if the BFF changed.

## Rollback

- [ ] If the package is broken, publish a patch.
- [ ] Deprecate the broken version with a message.
- [ ] Update the changelog and docs.

Record the published version and date in the release notes.

## Next step

[Versioning](versioning.md) and [Split repositories](split-repositories.md).
