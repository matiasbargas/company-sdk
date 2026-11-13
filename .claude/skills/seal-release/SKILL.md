---
name: seal-release
description: Prepare and seal a team-sdk release: pre-tag review, CEO validation of project-map.md Section 11, Coordinator seal, then ship. Use when a release's missions are complete and the team wants to tag it.
---

# Seal a release

## Steps
1. **Run `sdk-pre-tag <dir>`** (add `--fix` only for the auto-fixable items it lists). Resolve or explicitly accept every finding.
2. **Close the work.** Every active role completes the `domain-close` skill. The PM seals the kanban in `product-log.md`, and the EM dissolves pods (both Guardian sign-offs are required, §8a and §31).
3. **CEO validation (Greg).** Walk `project-map.md` Section 11 item by item, and log the validation with the `log-decision` skill.
4. **Coordinator seal.** Write the release entry in `history.md` (§10) and update `current-status.md`.
5. **Ship.** This is outward-facing, so confirm with the Owner before running it: `sdk-ship <dir> <release-id>` (validate → tag → push → release notes).
6. **Afterwards**, schedule the sprint retro (`retro-sweep` in the `office-day` skill).

Commands: use the `sdk-*` bins; inside the SDK repo without `npm link`, run `node scripts/<name>.js`; in a generated project, `$SDK` is `sdkPath` from `./.sdkrc`.
