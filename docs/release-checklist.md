# Release checklist

This file moved. The maintained checklist is
[Release and deployment](release/release-checklist.md).

Quick reference for `@dataemergencia/emergency`:

1. Update `CHANGELOG.md` and `package.json`, commit the bump.
2. `bash ./scripts/release.sh X.Y.Z` for a full dry run.
3. `bash ./scripts/split.sh X.Y.Z --push` to mirror the split repository.
4. `bash ./scripts/release.sh X.Y.Z --publish` from the split checkout.
5. Verify with `npm view @dataemergencia/emergency version dist-tags`.
6. Push the monorepo tag `npm-vX.Y.Z`.
