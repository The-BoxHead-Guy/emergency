#!/usr/bin/env bash
set -euo pipefail

# Manual mirror of libs/emergency to the public split repository.
# Fallback for when GitHub Actions minutes are exhausted.
#
# The mirror is built from the committed tree (git archive), not from the
# working directory, so untracked files (node_modules, dist, .env) can never
# leak into the public repository. It also regenerates the standalone
# pnpm-lock.yaml and proves the split builds and packs on its own.

readonly PACKAGE_NAME="@dataemergencia/emergency"
readonly DEFAULT_REMOTE="git@github.com:The-BoxHead-Guy/emergency.git"
readonly IIFE_BUDGET_BYTES=153600

usage() {
  cat <<'EOF'
Usage: bash scripts/split.sh <version> [options]

  <version>             Release version in X.Y.Z form, for example 0.1.0.
                        package.json and CHANGELOG.md must already match it.
  --push                Commit and push the mirror plus the split tag
                        (default: dry run)
  --publish             Publish to npm from the mirror after a successful push
                        (runs scripts/release.sh in the mirror, prompts for 2FA)
  --yes, -y             Skip the interactive confirmation
  --skip-tests          Skip the test suite (typecheck, build and pack still run)
  --keep                Keep the temporary split checkout for inspection
  --remote <url>        Split repository remote (default: SPLIT_REMOTE or the
                        SSH URL). Local paths are allowed for a test run.
  --allow-published-tag Skip the "version already on npm" guard (dangerous)
  -h, --help            Show this help

The script:
  1. Refuses to run when the package has uncommitted or untracked files.
  2. Verifies name, committed version and CHANGELOG entry, and checks npm for
     an existing version (npm versions are immutable).
  3. Runs check, test and build in the monorepo package.
  4. Mirrors the committed package tree into a clone of the split repository,
     excluding the Nx project file and internal plans.
  5. Regenerates pnpm-lock.yaml and runs install, check, test, build and pack
     inspection inside the mirror.
  6. Shows the exact changes, then pushes main and v<version> only with --push.
  7. Creates the local monorepo tag npm-v<version> (never pushes it).

Environment:
  SPLIT_REMOTE   Overrides the split repository remote.
EOF
}

# Keep the output readable in pipes and CI logs.
if [[ -t 1 && -z "${NO_COLOR:-}" ]]; then
  BOLD=$'\033[1m'
  DIM=$'\033[2m'
  RED=$'\033[31m'
  GREEN=$'\033[32m'
  YELLOW=$'\033[33m'
  BLUE=$'\033[34m'
  CYAN=$'\033[36m'
  RESET=$'\033[0m'
else
  BOLD=""
  DIM=""
  RED=""
  GREEN=""
  YELLOW=""
  BLUE=""
  CYAN=""
  RESET=""
fi

STEP_INDEX=0
STEP_TOTAL=0

banner() {
  printf '\n%s━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━%s\n' "$DIM" "$RESET"
  printf '  %s📦 %s split%s  %s·%s  %sv%s%s\n' \
    "$BOLD$CYAN" "$PACKAGE_NAME" "$RESET" "$DIM" "$RESET" "$BOLD" "$VERSION" "$RESET"
  printf '%s━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━%s\n' "$DIM" "$RESET"
}

step() {
  STEP_INDEX=$((STEP_INDEX + 1))
  printf '\n%s[%d/%d]%s %s %s%s%s\n' \
    "$BLUE$BOLD" "$STEP_INDEX" "$STEP_TOTAL" "$RESET" \
    "$1" "$BOLD" "$2" "$RESET"
}

ok() {
  printf '  %s✔%s %s\n' "$GREEN" "$RESET" "$*"
}

info() {
  printf '  %sℹ%s %s\n' "$CYAN" "$RESET" "$*"
}

warn() {
  printf '  %s▲%s %s\n' "$YELLOW" "$RESET" "$*"
}

die() {
  printf '\n  %s✖ error:%s %s\n' "$RED$BOLD" "$RESET" "$*" >&2
  exit 1
}

VERSION=""
PUSH=false
PUBLISH=false
ASSUME_YES=false
SKIP_TESTS=false
KEEP=false
ALLOW_PUBLISHED_TAG=false
REMOTE="${SPLIT_REMOTE:-$DEFAULT_REMOTE}"
REMOTE_EXPLICIT=false

while (($#)); do
  case "$1" in
    --push) PUSH=true ;;
    --publish) PUSH=true PUBLISH=true ;;
    --yes | -y) ASSUME_YES=true ;;
    --skip-tests) SKIP_TESTS=true ;;
    --keep) KEEP=true ;;
    --allow-published-tag) ALLOW_PUBLISHED_TAG=true ;;
    --remote)
      shift
      (($#)) || die "--remote requires a URL"
      REMOTE="$1"
      REMOTE_EXPLICIT=true
      ;;
    -h | --help)
      usage
      exit 0
      ;;
    -*) die "unknown option: $1" ;;
    *)
      [[ -z "$VERSION" ]] || die "unexpected argument: $1"
      VERSION="$1"
      ;;
  esac
  shift
done

if [[ -z "$VERSION" ]]; then
  usage
  exit 1
fi

[[ "$VERSION" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]] ||
  die "version must be X.Y.Z, got: $VERSION"

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
PKG="$(cd -- "$SCRIPT_DIR/.." && pwd)"

if ! git -C "$PKG" rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  die "$PKG is not inside a git work tree"
fi

ROOT="$(git -C "$PKG" rev-parse --show-toplevel)"

# Monorepo layout: the package is libs/emergency and the archive subpath is
# needed. Split layout: the package is the repository root.
if [[ "$ROOT" == "$PKG" ]]; then
  ARCHIVE_PATH=""
  IS_MONOREPO=false
else
  ARCHIVE_PATH="libs/emergency"
  IS_MONOREPO=true
fi

TAG="npm-v$VERSION"
SPLIT_TAG="v$VERSION"

if [[ "$PUSH" == false ]]; then
  STEP_TOTAL=6
else
  STEP_TOTAL=7
  if [[ "$IS_MONOREPO" == true ]]; then
    STEP_TOTAL=$((STEP_TOTAL + 1))
  fi
  if [[ "$PUBLISH" == true ]]; then
    STEP_TOTAL=$((STEP_TOTAL + 1))
  fi
fi

banner

# ---------------------------------------------------------------------------
step "🔍" "Preflight"

[[ -f "$PKG/package.json" ]] || die "package.json not found in $PKG"

dirty="$(git -C "$PKG" status --porcelain --untracked-files=all -- .)"
if [[ -n "$dirty" ]]; then
  printf '%s\n' "$dirty" >&2
  die "the package has uncommitted or untracked files; commit them before releasing"
fi
ok "Package tree is clean"

PKG_NAME="$(node -p "require('$PKG/package.json').name")"
PKG_VERSION="$(node -p "require('$PKG/package.json').version")"

[[ "$PKG_NAME" == "$PACKAGE_NAME" ]] ||
  die "package.json name must be $PACKAGE_NAME, got: $PKG_NAME"

[[ "$PKG_VERSION" == "$VERSION" ]] || die "package.json is $PKG_VERSION but $VERSION was requested; bump and commit the version first"

grep -qE "^## \[$VERSION\]" "$PKG/CHANGELOG.md" ||
  die "CHANGELOG.md has no '## [$VERSION]' entry"
ok "Package identity and changelog entry are valid"

NODE_MAJOR="$(node -p "process.versions.node.split('.')[0]")"
[[ "$NODE_MAJOR" -ge 22 ]] || die "node >= 22 is required, found $(node -v)"
ok "node $(node -v), pnpm $(pnpm --version)"

if [[ "$REMOTE" == *github.com* && "$REMOTE" != *"The-BoxHead-Guy/emergency"* ]]; then
  die "remote $REMOTE is not The-BoxHead-Guy/emergency; pass --remote to override on purpose"
fi

if [[ "$REMOTE" != *"The-BoxHead-Guy/emergency"* ]]; then
  if [[ "$REMOTE_EXPLICIT" == true ]]; then
    warn "using non-default remote: $REMOTE"
  else
    die "unexpected split remote: $REMOTE"
  fi
fi

if npm view "$PACKAGE_NAME@$VERSION" version >/dev/null 2>&1; then
  [[ "$ALLOW_PUBLISHED_TAG" == true ]] ||
    die "$PACKAGE_NAME@$VERSION is already published; npm versions are immutable"
  warn "$PACKAGE_NAME@$VERSION is already published (--allow-published-tag)"
elif ! npm view "$PACKAGE_NAME" version >/dev/null 2>&1; then
  info "$PACKAGE_NAME is not on npm yet; this split prepares the first publish"
else
  info "$PACKAGE_NAME@$VERSION is not published yet"
fi
ok "Registry state checked"

# ---------------------------------------------------------------------------
step "🧪" "Verify source"

if [[ "$SKIP_TESTS" == false ]]; then
  (cd "$PKG" && pnpm run check >/dev/null)
  ok "check passed (format, lint and types)"
  (cd "$PKG" && pnpm run test >/dev/null)
  ok "tests passed"
else
  (cd "$PKG" && pnpm run check >/dev/null)
  ok "check passed (format, lint and types)"
  warn "tests skipped (--skip-tests)"
fi

(cd "$PKG" && pnpm run build >/dev/null)
ok "build passed"

# ---------------------------------------------------------------------------
step "📥" "Cloning split repository"

WORK="$(mktemp -d "${TMPDIR:-/tmp}/emergency-split.XXXXXX")"
WORKDIR="$WORK/split"

cleanup() {
  if [[ "$KEEP" == false && -n "${WORK:-}" && -d "$WORK" ]]; then
    rm -rf -- "$WORK"
  fi
}
trap cleanup EXIT

if [[ -d "$REMOTE" ]]; then
  git clone --quiet "$REMOTE" "$WORKDIR" ||
    die "could not clone $REMOTE"
else
  git clone --quiet "$REMOTE" "$WORKDIR" ||
    die "could not clone $REMOTE; check your SSH key or pass --remote"
fi
ok "Cloned split repository"

cd "$WORKDIR"

if ! git config user.email >/dev/null 2>&1; then
  die "git user.email is not configured; run 'git config --global user.email <email>'"
fi

# Always build the release commit on top of the split repository's main so the
# push is a fast-forward. A clone of a repository whose default branch is not
# main, or of a brand-new repository, can start on an unborn branch.
if git rev-parse -q --verify refs/remotes/origin/main >/dev/null; then
  git checkout --quiet -B main origin/main
  ok "Tracking split main at $(git rev-parse --short HEAD)"
else
  git checkout --quiet -B main 2>/dev/null ||
    git symbolic-ref HEAD refs/heads/main
  ok "Split repository has no main yet; the first commit creates it"
fi

# ---------------------------------------------------------------------------
step "📦" "Build mirror"

# The split repository is a generated mirror. Remove everything except .git.
find "$WORKDIR" -mindepth 1 -maxdepth 1 ! -name .git -exec rm -rf -- {} +

if [[ -n "$ARCHIVE_PATH" ]]; then
  git -C "$ROOT" archive --format=tar "HEAD:$ARCHIVE_PATH" |
    tar -xf - -C "$WORKDIR"
else
  git -C "$ROOT" archive --format=tar "HEAD" |
    tar -xf - -C "$WORKDIR"
fi

# Internal-only files that are tracked in the monorepo but must not be public.
for excluded in project.json docs/plans; do
  rm -rf -- "$WORKDIR/$excluded"
done

for forbidden in \
  node_modules dist coverage .nx .env .env.local .env.production \
  examples/vanilla/emergency.global.js; do
  [[ ! -e "$WORKDIR/$forbidden" ]] ||
    die "refusing to publish: $forbidden ended up in the mirror"
done

for required in \
  package.json README.md LICENSE CHANGELOG.md tsconfig.json \
  vite.config.ts vitest.setup.ts src/index.ts scripts/release.sh \
  scripts/split.sh .github/workflows/ci.yml .github/workflows/publish-npm.yml; do
  [[ -f "$WORKDIR/$required" ]] ||
    die "mirror is missing $required; check the archive source"
done
ok "Mirror contains only committed package files"

# ---------------------------------------------------------------------------
step "🧷" "Standalone verification"

cd "$WORKDIR"

pnpm install --lockfile-only >/dev/null
[[ -f pnpm-lock.yaml ]] || die "pnpm install --lockfile-only produced no lockfile"
pnpm install --frozen-lockfile >/dev/null
ok "Standalone lockfile regenerated and installed"

if [[ "$SKIP_TESTS" == false ]]; then
  bash ./scripts/release.sh "$VERSION" --skip-install --allow-dirty
else
  bash ./scripts/release.sh "$VERSION" --skip-install --allow-dirty --skip-tests
fi
ok "Standalone check, build and pack inspection passed"

# ---------------------------------------------------------------------------
step "🔎" "Review changes"

git add -A
CHANGES="$(git status --porcelain)"
if [[ -n "$CHANGES" ]]; then
  printf '%s\n' "$CHANGES"
  git diff --cached --stat
else
  info "No content changes (the split repository already matches HEAD)"
fi

if [[ "$PUSH" == false ]]; then
  info "Dry run: nothing was pushed"
  info "Inspect the mirror: $WORKDIR"
  info "Publish with: bash scripts/split.sh $VERSION --push"
  KEEP=true
  exit 0
fi

if [[ "$ASSUME_YES" == false ]]; then
  [[ -t 0 ]] || die "non-interactive session; pass --yes to push without a prompt"
  printf '\n  %s?%s Push %s to main and force-update tag %s in %s? [y/N] ' \
    "$YELLOW$BOLD" "$RESET" "$PACKAGE_NAME" "$SPLIT_TAG" "$REMOTE"
  read -r reply
  [[ "$reply" == "y" || "$reply" == "Y" || "$reply" == "yes" ]] ||
    die "aborted; the temporary mirror is at $WORKDIR"
fi

step "🚀" "Push release"

if [[ -n "$CHANGES" ]]; then
  git commit --quiet -m "release: $SPLIT_TAG"
  ok "Committed $SPLIT_TAG"
fi
git push origin main
ok "Pushed split main"
git tag -f "$SPLIT_TAG"
git push --force origin "$SPLIT_TAG"
ok "Pushed $SPLIT_TAG"

git ls-remote --tags origin "refs/tags/$SPLIT_TAG" | grep -q . ||
  die "pushed, but $SPLIT_TAG is not visible on the remote"
ok "Verified $SPLIT_TAG on the remote"

REMOTE_HEAD="$(git ls-remote --symref origin HEAD | awk '/^ref:/ {print $2}')"
if [[ -z "$REMOTE_HEAD" ]]; then
  warn "the remote has no default branch yet; set it to main in the repository settings"
elif [[ "$REMOTE_HEAD" != "refs/heads/main" ]]; then
  warn "the remote default branch is ${REMOTE_HEAD#refs/heads/}, not main"
fi

if [[ "$IS_MONOREPO" == true ]]; then
  step "🏷️" "Monorepo tag"
  if git -C "$ROOT" rev-parse -q --verify "refs/tags/$TAG" >/dev/null; then
    info "Monorepo tag $TAG already exists"
  else
    git -C "$ROOT" tag -a "$TAG" -m "release: $VERSION"
    ok "Created local monorepo tag $TAG"
    info "Push it when Actions quota allows: git -C \"$ROOT\" push origin $TAG"
  fi
fi

if [[ "$PUBLISH" == true ]]; then
  step "📤" "Publish to npm"
  info "npm will prompt for the one-time password"
  bash ./scripts/release.sh "$VERSION" --skip-install --allow-dirty --publish ||
    die "push succeeded, but npm publish failed; fix it and re-run the publish step"
  npm view "$PACKAGE_NAME@$VERSION" version >/dev/null ||
    die "publish reported success, but $PACKAGE_NAME@$VERSION is not on npm"
  ok "Verified $PACKAGE_NAME@$VERSION on npm"
fi

cat <<EOF

${GREEN}${BOLD}✅ Published $SPLIT_TAG${RESET} ${DIM}from $(git -C "$ROOT" rev-parse --short HEAD)${RESET}

${BOLD}Next steps:${RESET}
  1. Verify: npm view $PACKAGE_NAME version dist-tags
EOF

if [[ "$IS_MONOREPO" == true ]]; then
  echo "  2. Push the monorepo tag: git push origin $TAG"
fi

if [[ "$KEEP" == true ]]; then
  info "Temporary checkout kept: $WORKDIR"
fi
