#!/usr/bin/env bash
set -euo pipefail

# Release the client package from its own root (the split repository root after
# the split, or libs/emergency inside the monorepo).
#
# Manual 2FA publish: the script never stores or reads a long-lived npm token.
# The version must already be committed: use `pnpm version <v> --no-git-tag-version`,
# update CHANGELOG.md, commit, then run this script.

usage() {
  cat <<'EOF'
Usage: bash ./scripts/release.sh <version> [options]

  <version>         Semver to release, for example 0.1.1
  --publish         Run `npm publish` after every check passes
                    (default is a dry run: install, check, test, build, pack)
  --skip-install    Skip `pnpm install --frozen-lockfile` when the tree is
                    already installed
  --skip-tests      Skip the test suite (check and build still run)
  --allow-dirty     Skip the clean-working-tree check (never with --publish)
  -h, --help        Show this help

Before publishing, confirm:
  - npm login with 2FA is active for the `dataemergencia` scope
  - CHANGELOG.md has a `## [<version>]` entry
  - the version is committed and the split repository is up to date

The script verifies the version and the changelog entry, then lets npm run
check, tests and build before publishing.
EOF
}

VERSION=""
PUBLISH=false
SKIP_INSTALL=false
SKIP_TESTS=false
ALLOW_DIRTY=false

for arg in "$@"; do
  case "$arg" in
    --publish) PUBLISH=true ;;
    --skip-install) SKIP_INSTALL=true ;;
    --skip-tests) SKIP_TESTS=true ;;
    --allow-dirty) ALLOW_DIRTY=true ;;
    -h | --help)
      usage
      exit 0
      ;;
    -*)
      echo "Unknown flag: $arg" >&2
      usage
      exit 1
      ;;
    *)
      if [[ -n "$VERSION" ]]; then
        echo "Unexpected argument: $arg" >&2
        usage
        exit 1
      fi
      VERSION="$arg"
      ;;
  esac
done

if [[ -z "$VERSION" ]]; then
  usage
  exit 1
fi

[[ "$VERSION" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]] || {
  echo "version must be X.Y.Z, got: $VERSION" >&2
  exit 1
}

if [[ "$PUBLISH" == true && "$ALLOW_DIRTY" == true ]]; then
  echo "--publish cannot be combined with --allow-dirty" >&2
  exit 1
fi

PKG="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PKG"

echo "==> Preflight"
[[ -f package.json ]] || {
  echo "package.json not found in $PKG" >&2
  exit 1
}

PKG_NAME="$(node -p "require('./package.json').name")"
PKG_VERSION="$(node -p "require('./package.json').version")"

[[ "$PKG_NAME" == "@dataemergencia/emergency" ]] || {
  echo "package.json name must be @dataemergencia/emergency, got: $PKG_NAME" >&2
  exit 1
}

[[ "$PKG_VERSION" == "$VERSION" ]] || {
  echo "package.json is $PKG_VERSION but $VERSION was requested." >&2
  echo "Run 'pnpm version $VERSION --no-git-tag-version', update CHANGELOG.md," >&2
  echo "commit the bump, then re-run this script." >&2
  exit 1
}

grep -qE "^## \[$VERSION\]" CHANGELOG.md || {
  echo "CHANGELOG.md has no '## [$VERSION]' entry" >&2
  exit 1
}

if git -C "$PKG" rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  if [[ "$ALLOW_DIRTY" == false ]]; then
    dirty="$(git -C "$PKG" status --porcelain --untracked-files=all -- .)"
    if [[ -n "$dirty" ]]; then
      printf '%s\n' "$dirty" >&2
      echo "the package tree has uncommitted or untracked files; commit them first" >&2
      exit 1
    fi
  fi
  echo "    commit $(git -C "$PKG" rev-parse --short HEAD)"
fi
echo "    $PKG_NAME@$PKG_VERSION"

if [[ "$SKIP_INSTALL" == false ]]; then
  echo "==> Installing dependencies (frozen lockfile)"
  pnpm install --frozen-lockfile
else
  echo "==> Skipping install (--skip-install)"
fi

PUBLISH_ARGS=(--access public)

if [[ "$SKIP_TESTS" == true ]]; then
  echo "==> Check"
  pnpm run check

  echo "==> Build"
  pnpm run build

  # Those steps already ran above; do not repeat them through npm hooks.
  PUBLISH_ARGS+=(--ignore-scripts)
else
  echo "==> Check, tests and build (npm lifecycle)"
fi

if [[ "$PUBLISH" == false ]]; then
  echo "==> Publish dry run"
  npm publish --dry-run "${PUBLISH_ARGS[@]}"
  echo
  echo "Dry run complete. Re-run with --publish to publish $PKG_NAME@$PKG_VERSION."
  exit 0
fi

echo "==> Publishing (npm will prompt for the one-time password)"
npm publish "${PUBLISH_ARGS[@]}"

echo
echo "Published $PKG_NAME@$VERSION"
echo "Verify: npm view $PKG_NAME version dist-tags"
echo "Next: tag the split repository v$VERSION and the monorepo emergency-client-v$VERSION."
