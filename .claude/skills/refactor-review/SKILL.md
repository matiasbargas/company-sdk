---
name: refactor-review
description: Hold the refactor discussion when sdk-health reports "refactor discussion due" (a file over limits.refactorReviewLines, or grown past its acknowledged size), or before rewriting any module from scratch. Makes sure no capability is lost.
---

# Refactor review

Rule: `protocol.md` §30 → Specs outlive implementations. A rewrite is safe only when everything the module does is written as capabilities and covered by tests that don't depend on the implementation.

## Steps
1. **Inventory what the module does.** List its observable behaviour: CLI flags, files read and written, exit codes, messages other tools parse. Compare that list with `context/spec/*/claims.yaml`, and add any missing behaviour as `kind: capability` claims with given/when/then acceptance criteria.
2. **Close coverage gaps first.** Every behaviour the rewrite must keep needs a `status: built` capability, and a test that runs in `npm test` and declares `@covers <id>`. Write those tests against the public interface (CLI, files), not internals, so they pass against both the old and new implementation. Run `node scripts/lib/test-capability-coverage.js`.
3. **Discuss.** CTO proposes, with Mario and the Test Engineer, using the `peer-consult` skill. Options: **refactor now**, **split** (extract one module), or **defer** (with a named prerequisite). For a large rewrite, record it as a §34 surface.
4. **Record the outcome** in `context/spec/_refactor-watch.json`: `{lines, date, decision, prerequisite, by}`. That resets the growth trigger. Log consequential decisions with the `log-decision` skill.
5. **If refactoring:** keep the conformance suite green at every commit. A capability that no longer applies is retired explicitly (`status: retired`, with the reason); it is never dropped silently. Bump the protocol or package version if an interface changes.
