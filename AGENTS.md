# AGENTS.md — @dataemergencia/emergency

Project-level rules for agents working in this library. They override the
monorepo defaults where they conflict.

## Commands

- **Never use `nx` here.** Run commands directly with `pnpm {command}` from this
  directory, but only if the command exists in `package.json` `scripts`.
- If a command is missing from `package.json`, do not invent one — add the script
  or use the closest existing one.

Examples:

```bash
pnpm build
pnpm typecheck
pnpm lint
pnpm test
pnpm check
```

## Changelog

- **Every change that gets committed must also add an entry to `CHANGELOG.md`.**
  The changelog is part of the shipped library and is required for release.
- Put the entry under `## [Unreleased]` in the matching section: `Added`,
  `Changed`, `Fixed`, `Removed`, `Deprecated` or `Security`.
- Create the section if it does not exist. Keep the existing style: one short
  bullet, wrapped, English.
- Commit the `CHANGELOG.md` edit together with the change it documents.
