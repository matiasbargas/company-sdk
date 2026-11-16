---
surface:
  id: SURFACE-20261115-brain-identity-storage-001
  kind: decision
  title: Company brain storage and human identity model (how humans become principals that write to the brain)
  author_roles: [CTO]
  verifier_roster: [CFO, CISO, Mario, CLO]   # fixed minimum for irreversible: true (§34.4); CLO added because signed history holds personal data (discoverable artifact)
  depends_on:
    - project/context/intent/company-brain/design.md
    - project/context/intent/company-brain/decision-options.md
    - CHARTER.md
    - packages/holding/README.md
  produces: One Owner-signed decision on (1) where the brain's truth lives, (2) the principal id format, (3) the signature and verification scheme, (4) the transport sequence for human writes. Logged to history.md per §6 with Reversible NO only after the Owner signs.
  state: blocked
  irreversible: true
  evidence:
    - project/context/intent/company-brain/design.md
    - project/context/intent/company-brain/decision-options.md
    - project/team.md
    - packages/holding/README.md
    - packages/holding/src/commons/scan.js
    - scripts/hooks/protect-files.js
  release: v2026.Q2.3
---

# Company brain storage and human identity model

> Collaboration Surface per `protocol.md` §34. `irreversible: true`, so the fixed minimum roster applies (CFO, CISO, Mario) plus CLO. **This surface is prepared, not decided.** No agent decides it. The Owner signs, per CHARTER Autonomy Limit 4 and §34.7. The CTO block and the four verification blocks were written in one pipeline run (2026-11-15). Each verification block reasons only from its own role file (`team/roles/cfo.md`, `ciso.md`, `chief-engineer.md`, `clo.md`) and from the evidence listed above. The verifiers did not read each other's blocks.
>
> **Provenance hashes.** Each `LOOP-PROVENANCE` value is the SHA-256 of the block body: the lines between the block heading and the provenance line, with trailing whitespace trimmed. §32.5 canonicalization is still unspecified, so treat these hashes as integrity checks for this file only, not as gate tokens.

## Author block — CTO (2026-11-15)

**What is being decided, narrowed.** `design.md` frames this as one decision. It is really four, and only some of them are irreversible:

| # | Sub-decision | Irreversible? | Why |
|---|---|---|---|
| D1 | Truth lives in each company's own git repo; everything else is derived (`design.md` §1) | **Yes** | Every later tool, the commons and the holding proofs assume it. Moving truth to a database later means migrating every reader. |
| D2 | Principal id format (`human:<handle>`, `agent:<role>:<name>`) and where the registry lives | **Yes** | Ids are written into signed, append-only history. CHARTER Autonomy Limit 5 forbids rewriting that history, so an id scheme can never be renamed, only aliased. |
| D3 | Signature scheme and verification point (what makes a write "from human X") | **Mostly** | Old signatures must stay verifiable forever. Adding a second scheme later is cheap; dropping the first is not. |
| D4 | Transport for human writes (CLI, local MCP server, GitHub PR, HTTP gateway) | **No** | Every transport ends in the same signed commit. A transport can be added or removed without touching the record. |

The options below differ mainly on D3 and D4. All three keep D1 (git is the truth). I found no option that moves truth out of git and still meets CISO non-negotiable 3 (append-only, signed provenance) without building a second ledger, so a database-as-truth option is out of scope here.

**Facts the options must face (verified in the tree, 2026-11-15):**
- **No commit is signed today.** The last 20 commits on this branch all show `%G? = N`, and `commit.gpgsign` is unset. Agents commit under the Owner's git identity, with a `Co-Authored-By` trailer as the only marker. Right now, a human write and an agent write cannot be told apart.
- **No principal record exists.** `project/team.md` is the CHRO's agent roster (name, role, level, cultural profile). It has no `kind`, `id`, `can_ratify` or key fields.
- **Agents run as the Owner's OS user** in interactive sessions. Only holding-run sessions use the sandbox user (`_sdkco`, `packages/holding/README.md` → Security model), and v0 supports one company only.
- **The secret/PII scan exists at commons publish only** (`packages/holding/src/commons/scan.js`), not at brain ingestion.
- **`protect-files.js` guards Edit/Write/NotebookEdit only.** Its own header says Bash gets around it. It reduces mistakes; it is not an authorization control.
- **No CI exists** (`.github/workflows/` is absent), so nothing on the server side checks signatures today.

### Option (a): humans as signed-git-commit principals in `team.md`, plus a local MCP server per clone

- **Shape.** A `## Principals` table in `team.md` with `kind | id | roles | can_ratify | signing_key_fingerprint | valid_after | valid_before`. A git `allowed_signers` file is generated from that table. Humans sign commits with SSH keys. A local MCP server, one per clone, exposes the verbs from `design.md` §4 (surface author/verify, intent open/amend, decision propose/dissent, bus post/ack, asks query). Every write the server makes is a commit signed by the human's key.
- **Verification point.** Locally: a `commit-msg`-stage check plus `sdk-health`, both bypassable (`--no-verify`). On the server: a GitHub ruleset that requires signed commits on `main`. That needs an Owner action and a push, so it falls under Autonomy Limit 1.
- **Reversal cost.** *Low for transport* (D4): drop the MCP server and humans use the CLI or PRs. *High for D2/D3*: once signed commits with `human:<handle>` ids are on `main`, both are permanent. Estimate: changing the id scheme later means an alias table that every reader (cockpit, inbox, calibration, memory ingest) must resolve forever.
- **Against the 5 CISO non-negotiables (`design.md` §7):**
  1. *Strong per-person authentication.* **Partial.** A signed commit proves possession of a key, nothing more. If the key is an ordinary file in `~/.ssh` under the same OS user the agents run as, **an agent can sign as the human**. It is met only with a non-exportable key that needs a physical touch to sign (FIDO2 `ed25519-sk` on a hardware key, or a Secure Enclave key with user presence). No MFA or token revocation in the OIDC sense; revocation means setting `valid_before` in `allowed_signers`.
  2. *Per-company authorization at the server, with isolation between brains.* **Met by construction for storage**: one repo per company, access through GitHub repo permissions. Isolation of the *machine* is not met. Interactive agents share the Owner's OS user across every clone. The holding's per-company sandbox users are required before a second company (`packages/holding/README.md`).
  3. *Append-only, server-verified signed provenance, no edit/delete endpoints.* **Partial.** The MCP server exposes only append verbs. Verification by the server exists only once the GitHub ruleset is on. Force-push protection is likewise a GitHub setting, not code in this repo.
  4. *Human content tagged as untrusted, plus a passed prompt-injection red-team.* **Not met yet.** Delimiting can be built into the MCP write path. The §32 red-team loop has not been run.
  5. *Fail-closed secret/PII scan at ingestion, tamper-evident access log, incident plan.* **Not met.** The scan exists only at commons publish. A local MCP server has no access log anyone else can trust. There is no incident plan.

### Option (b): server-side identity (OIDC) and an HTTP gateway that writes signed commits

- **Shape.** An OIDC provider (SSO with MFA, short-lived tokens) authenticates each human. A stateless HTTP gateway checks the token, checks the principal's company and verb, and turns the request into a commit signed by **the gateway's key**, held in a KMS. The human's identity goes in a commit trailer (`Principal: human:<handle>`, `Attested-By: gateway:<company>`).
- **Verification point.** The gateway, on every request, plus the GitHub ruleset on `main`.
- **Reversal cost.** *High.* It brings in a vendor (IdP), a hosted service with an on-call need, a KMS key whose loss or compromise taints every commit it signed, and a second provenance meaning: "the gateway vouches that X asked" rather than "X signed". Reversing it means keeping the gateway's public key verifiable forever and migrating every principal off the IdP. It is also a paid service (Autonomy Limit 2) and a network-facing service (Limit 1).
- **Against the 5 CISO non-negotiables:**
  1. **Met** as designed: OIDC/SSO with MFA, short-lived tokens, central revocation.
  2. **Met** if the gateway authorizes per company and runs per tenant. It needs design work; nothing is built.
  3. **Met** if the gateway has no edit or delete route and the ruleset blocks force-push. The trust root moves to the KMS key.
  4. **Not met yet.** Same red-team gap as (a). The gateway is a better place to enforce delimiting, because nothing can bypass it.
  5. **Can be met.** The gateway is a single choke point for a fail-closed scan and an access log. The incident plan (mass token revocation, the GDPR 72-hour clock) still has to be written.

### Option (c): hybrid, (a) now for internal humans and (b) later for external ones

- **Shape.** Ship (a) with the hardware-key condition for internal humans now. Build (b) only when a named external human must join (`design.md` §5, item 5). **From day one, define one provenance envelope** that covers both meanings: `signed_by` (the key that signed) and `principal` (who acted), with `attested_by` set only when the two differ. Without that, (c) forks the record into two formats.
- **Reversal cost.** *Low now, deferred later.* The irreversible part paid today is D1, D2 and the envelope format. The (b) cost is paid only if an external human appears, and the decision to build it comes back to the Owner then, under its own surface.
- **Against the 5 CISO non-negotiables.** For internal humans, the same as (a). For external humans, no access until (b) meets all five. The design already sets the rule "trust non-negotiables before **any external** human" (`design.md` §7).

### CTO recommendation

**(c), with the hardware-key and envelope conditions written in.** Reasons: it keeps truth in git (D1, the one decision every other piece already assumes). It pays for no hosted service before a named external human exists. It decides the id and envelope formats once, so the later gateway does not fork the record.

**What I am not sure of.** Whether internal humans will actually use hardware keys. If they won't, (a) does not meet non-negotiable 1, and then I would rather have no human write path at all than one an agent can impersonate.

LOOP-PROVENANCE: SURFACE-20261115-brain-identity-storage-001 + SHA256(01cc684d5d2ce60ccc7358f6d3418ea0d0198438299605233e092456d2d589ca)

## Verification — CFO (2026-11-15)

**Verdict:** concern
**Reasoning:**

There is no budget model behind any of the three options. A choice that commits the Owner's name or money cannot pass a CFO review on the strength of "probably cheap". The numbers below are my assumptions, each labelled. Nothing here has been priced with a vendor.

| Item | (a) | (b) | (c) now / later |
|---|---|---|---|
| Cash, one-time | Hardware keys: A1 about $50–$90 per human, two per human (primary plus backup) | IdP setup: A2 $0 on a free tier for a few users; enterprise SSO features often sit behind a paid tier | (a) now; (b) only if triggered |
| Cash, recurring | $0 (GitHub plan already in use: A3, unverified) | IdP per seat (A4 unknown), hosting for the gateway (A5 small), KMS key and requests (A6 small), uptime monitoring | (a) now: about $0 |
| Agent tokens to build | MCP server plus principal table plus signing checks: A7 medium | Gateway plus OIDC integration plus tenant authorization plus access log: A8 large, at least twice (a) | (a) now, plus the envelope work |
| Ongoing human time | Key enrolment and rotation | **On-call for a network service.** This is the largest real cost and it is open-ended. | Deferred |

- **(b) cannot be validated.** It brings recurring spend and an on-call duty with no named user to justify them. Autonomy Limit 2 forbids committing it without the Owner. If (b) were the recommendation, my verdict would be no-go: a recurring cost with no demand behind it is the cost-of-delay argument run backwards.
- **(c) is financially right only if the trigger for (b) is written as a number, not a feeling.** Condition: the Owner's signature names the trigger ("a named external human who needs write access and cannot use git") and states that reaching it reopens the decision with a CFO budget. It must never be an automatic build.
- **The cost of delaying the decision is real but small.** Nothing human-facing waits on it: B4 (`sdk-doc inbox`) uses existing primitives. The cost of deciding wrong on D2 is the alias table forever, which costs build time rather than cash.
- **Concern, not no-go**, because (c) as authored keeps cash spend near zero. **Open item:** someone must check whether the GitHub plan in use supports the "require signed commits" ruleset on the repo (A3). If it does not, that is a recurring cost the CTO block does not show.

LOOP-PROVENANCE: SURFACE-20261115-brain-identity-storage-001 + SHA256(1c378f1738dac4f602d0e46d0ffa4feb6c40c987fce7d87255c1699a199a958e)

## Verification — CISO (2026-11-15)

**Verdict:** no-go
**Reasoning:**

**No-go on all three options as they would land today. Specifically, no-go on opening any human write path before conditions C1–C4 below are met and evidenced.** I am not rejecting the direction. The direction (c) is right. What I am rejecting is the claim that (a) "meets the non-negotiables for internal humans in v0". In this repo it does not.

**Threat model (summary).**
- *Assets:* the authority of a human's signature (ratification, verification verdicts, `can_ratify`), the brain's integrity, and the Owner's ability to tell a human decision from an agent decision.
- *Adversaries:*
  - an agent session following injected instructions (likelihood **HIGH**: every human-authored file is untrusted input to agents, CHARTER Precedence #8);
  - a compromised developer machine (MEDIUM);
  - a malicious insider (LOW at the current team size);
  - a compromised vendor (relevant to (b) only).

| Vector | Likelihood | Impact | Mitigation | Status |
|---|---|---|---|---|
| Agent signs as a human with a file-based key in `~/.ssh` (same OS user) | HIGH | **CRITICAL**: forged ratification. Silence is never a pass, but a forged pass is worse. | Non-exportable key with user presence (FIDO2 `-sk` or Secure Enclave); the signature requires a physical touch | Not implemented |
| Agent edits `team.md` principals or `allowed_signers` to add its own key | HIGH | CRITICAL | Registry changes require an Owner-signed commit, verified on the server. `protect-files.js` is not a control here, because Bash bypasses it (its own header says so). | Not implemented |
| Local verification skipped (`--no-verify`, hook not installed) | MEDIUM | HIGH | Server-side check: GitHub ruleset requiring signed commits, plus a CI job that verifies against `allowed_signers` | Not implemented (no CI exists) |
| Prompt injection through human-authored surface or claim text | HIGH | HIGH | Delimiting at the write path and a passed §32 red-team loop | Not implemented |
| Secret or personal data committed into signed history (cannot be removed, Limit 5) | MEDIUM | HIGH | Fail-closed scan at ingestion. `commons/scan.js` runs only at publish today. | Not implemented |

**Ruling on each option:**
- **(a)** fails non-negotiable 1 against the HIGH adversary unless the key needs a physical touch. It fails 3 (no server-side check exists), 4 (no red-team) and 5 (no ingestion scan, no access log, no incident plan).
- **(b)** meets 1 by design. But it moves the whole trust root into one KMS key and adds a vendor. I will not review it further without a named external human and an architecture to threat-model.
- **(c)** is acceptable as a sequence once the following conditions are met.

**Conditions to withdraw this no-go (each needs evidence, not a plan):**
- **C1.** Human signing keys are non-exportable and require user presence. Enrolment is recorded in an Owner-signed commit.
- **C2.** Changes to `allowed_signers` and the principal registry are accepted only from Owner-signed commits. This is verified on the server (ruleset plus CI) before any human verdict counts.
- **C3.** A fail-closed secret/PII scan runs on every write through the human path, before the commit. Reuse `commons/scan.js`; do not write a second scanner.
- **C4.** A §32 red-team loop on human-content injection has run and passed against the real write path.

**Before any external human:** add the full non-negotiable 5 (tamper-evident access log, incident plan with mass revocation and the GDPR 72-hour clock), and run (b) through its own surface.

**Not lowered.** Per my Safe-Change Rules, these conditions cannot be relaxed without CEO sign-off and logged justification.

LOOP-PROVENANCE: SURFACE-20261115-brain-identity-storage-001 + SHA256(4d1387a62b3ca989b092822fafdbcb518391c5d23b5572fa4414a46c2d004f43)

## Verification — Mario (2026-11-15)

**Verdict:** concern
**Reasoning:**

```
IRREVERSIBLE DECISION REVIEW: Brain storage and human identity model
Date: 2026-11-15
Release: v2026.Q2.3
Reviewed by: Mario (Chief Engineer)
CTO decision as proposed: (c) hybrid; git is the truth; signed-commit principals now; OIDC gateway later; one provenance envelope from day one.

Assessment:
[x] Holds at 10x current scale: human write rate is tens per day per company; git handles it.
    allowed_signers grows by one line per key, with no performance concern.
[ ] Failure modes understood and acceptable: key rotation and the envelope are not specified (below).
[x] Engineer inheriting this in two years will understand it, IF the envelope is one format.
[x] No cross-project implications unaccounted for: the commons already bridges brains by
    content hash, not by author, so principal ids stay inside each company.

Named alternative: (b) first. Rejected because: it pays the irreversible KMS trust root and a
  second provenance meaning before any user needs them.
Reversal cost / trigger: D2 (id format) and the envelope cannot be reversed once on main
  (Autonomy Limit 5). Trigger that would force a reversal: a second company or an external
  human whose identity cannot be expressed as `human:<handle>`, e.g. a handle collision across
  companies once people move between them.
```

**The CTO block narrowed the decision correctly.** D4 is reversible and should not wait on this surface. The concerns sit on D2 and D3.

1. **Rotation must not break history.** A revoked or rotated key must still verify the commits it signed before revocation. Condition: `allowed_signers` entries carry `valid-after` / `valid-before` (git supports both). Revocation sets `valid-before` and never deletes a line. Deleting a line silently turns every past human verdict into "unverified". That is a record rewrite in effect, even though no commit changed.
2. **One envelope, written now.** `principal`, `signed_by`, `attested_by` (optional) and `kind`, in commit trailers *and* in surface block provenance. If (b) arrives later with its own trailer format, every reader branches forever. Condition: the envelope is part of what the Owner signs, not a follow-up.
3. **Id namespace.** `human:<handle>` must be per company, and nothing may assume it is globally unique. The commons must never carry a principal id as a join key. Condition: write that rule into the decision text.
4. **The agent identity has the same gap.** Agents commit as the Owner today. If humans get signed ids and agents do not, "unsigned" becomes the agent marker, and an unsigned human mistake reads as an agent action. Condition: agent commits carry `principal: agent:<role>:<name>` in the same envelope, even while unsigned.

### Near Misses
- **Investigated:** whether git as the truth fails at 10x (write contention, repo size).
  **Dismissed because:** human writes are low volume. The heavy writers (loops, runs) already go to `record/` as append-only files. Merge contention on `surfaces/` is one file per surface.
- **Investigated:** whether the local MCP server is itself an irreversible choice (protocol churn).
  **Dismissed because:** it is transport (D4). It writes the same commits as the CLI, and deleting it loses nothing in the record.
- **Investigated:** whether SSH signing locks us out of GPG or sigstore later.
  **Dismissed because:** git verifies each commit by its own signature format. A second scheme can be added beside the first, and old commits stay verifiable as long as their public keys stay in `allowed_signers` (condition 1).

**Sign-off:** APPROVED WITH CONDITIONS (1–4). This concern does not lift the CISO no-go, and implementation must not begin while that no-go is open.

LOOP-PROVENANCE: SURFACE-20261115-brain-identity-storage-001 + SHA256(f14fbbe15466f842df0264e8ed169ecb09b5362fbec4c30bdfdfc6eb643943b4)

## Verification — CLO (2026-11-15)

**Verdict:** concern
**Reasoning:**

I flag exposure. Whether to accept it is the CEO's and the Owner's call. This is a generalist read, not jurisdiction-specific counsel. Each point carries its confidence level.

1. **Signed, append-only history holds personal data that cannot be erased.**
   - Commit author names and emails, handles, and public-key fingerprints tied to a person are personal data under GDPR when the person is in the EU. *Confidence: settled for names and emails; my read for key fingerprints.*
   - Art. 17 (erasure) runs into Autonomy Limit 5 (no rewriting the record) and into a pushed GitHub history.
   - **Mitigation, product design:** principals use pseudonymous handles and noreply commit emails. The handle-to-person mapping lives *outside* git, so it can be erased (with the IdP for (b); for (a), with the Owner, off-repo). The principal table stores no email, name or phone. The existing `commons/scan.js` patterns for email and phone can run over the principal table as a check.
   - Residual risk: **MEDIUM** with the mitigation; **HIGH** without it.
2. **Internal humans (option (a) half).** *My read:* whether a contributor is an employee or a contractor decides who owns what they write into the brain. Condition: before a second internal human writes, a short written contributor term assigns content IP to the company. It also tells them their handle and signature are permanent in the record. Without that, the first dispute over a ratified decision has no basis.
3. **External humans (option (b) half).** Before any external human writes, three things must exist:
   - a DPA with the IdP vendor (my contract non-signs apply);
   - contributor terms that cover IP and confidentiality;
   - a breach process that starts the GDPR 72-hour clock.

   This is a **hard blocker for the (b) half**, not for (c) as sequenced. That is why my verdict is a concern and not a no-go.
4. **Signed verdicts are discoverable artifacts.** A signed human `pass` on an irreversible surface is evidence of who approved what, in any later dispute. That is the point of signing. Humans must be told before they are enrolled, and the condition-1 notice covers it.
5. **The access log (CISO non-negotiable 5) is itself personal data.** It needs a stated retention period. Default proposal: 12 months, then aggregate. *Confidence: my read.*

**Hard blockers:**
- (b) half: DPA, contributor terms and a breach process before any external human.
- Any half: no real names or emails in the principal registry.

**Soft:** the retention period for the access log.

LOOP-PROVENANCE: SURFACE-20261115-brain-identity-storage-001 + SHA256(b165e83631c2000f369766c06280107a5a682274e09f70c24224453f18ce3968)

## Independent re-verification (2026-11-15, four separate sessions)

The blocks above were written by one agent during the pipeline run. They were re-run as four **independent** sessions (CFO, CISO, Mario, CLO), each told to ignore the prior block and form its own view first. **The verdicts did not change. The substance did:** each verifier found defects in the text the Owner would sign.

| Verifier | Verdict | Agrees with prior block? |
|---|---|---|
| CISO | **no-go** | Same verdict, different substance |
| Mario | concern (approve (c) with sheet changes) | Same verdict, different substance |
| CLO | concern | Same verdict, different substance |
| CFO | concern | Same verdict, different reason |

### Convergent findings (found by two or more verifiers)
- **`valid-before` is not revocation (CISO + Mario).** Git checks the window against the commit's own timestamp, which the signer controls. A stolen key can backdate commits and still verify. Revocation must be enforced at push time (CI/ruleset rejects any new commit signed by a revoked key, whatever its date), plus a first-seen anchor per pushed commit.
- **The `principal` trailer is self-asserted (CISO + Mario).** The decision text must state the binding rule: a `human:` principal counts only when the signing key maps to that principal in `allowed_signers`. Otherwise the commit is **unattributed**, never "unverified human".
- **The Owner's key is the weak trust root (CISO + Mario).** C2 roots trust in Owner-signed commits, but C1 only covered "human keys". Agents commit as the Owner today; a global `commit.gpgsign` would train habit-touching, so agent writes inherit Owner authority. Owner and human keys sign only explicit `-S` ratification commits, outside agent sessions (no reachable `SSH_AUTH_SOCK` / `-sk` handle, `verify-required` PIN). Agent commits need their own path to `main`.
- **The Owner's signature on *this* decision (CLO + CISO).** A checkbox in an unsigned commit, under the identity agents also use, is weak evidence for the act Autonomy Limit 4 requires.

### Single-verifier findings
- **CISO:** no local or server controls exist today: `protect-files.js` does not cover `team.md`/`allowed_signers` or Bash; `.claude/settings.json` denies `git push --force` / `-f` but not `git push origin +main`; no ruleset, no `.github/`. Extra C4 red-team cases: trailer spoofing, backdated revoked-key commits, agent-initiated signing prompt.
- **Mario:** `agent:<role>:<name>` puts a random spawn name in a permanent id (this repo's `team.md` lists Chief Engineer as "Ravi Colombo"; reviews sign "Mario"). Use `<kind>:<id>` grammar with an open kind set (`human`, `agent`, `gateway`), `agent:<role>` with the session id in a separate field, handles immutable and never reused. Strike the registry *location* from the irreversible text. Add `Provenance-Version: 1`. Name or forbid GitHub's web-flow merge key. At 10x, per-company revocation repeats N times: a second quantitative trigger for (b).
- **CLO:** pseudonymous handles are still personal data while the Owner holds the mapping; the realistic position is Art. 17(3)(b)/(e) retention plus a legitimate-interest assessment and an Art. 13 notice **[LAWYER]**. **CHARTER Limit 5 (never rewrite history) has no legal-compulsion carve-out**; signing D1–D3 as irreversible locks that in. DPAs are needed now for GitHub and the LLM provider, not only for (b). Contributor terms start at the *first* non-Owner human and must cover third-party-content warranties, the commons licence and per-company confidentiality. Human performance data (ratings, calibration, the under-30s signal) must not "never decay".
- **CFO:** the real cost of (c)-now is 2–3x the CTO's "medium" (CI from nothing, C2 server checks, scan wiring, a §32 red-team, M1–M4, contributor terms) plus Owner hours; possible recurring lines (GitHub plan for signed-commit rulesets on a private repo, Actions minutes) are Limit 2 items. **Recommendation: split the signature. Sign the formats now; build the human write path only on a named-internal-human trigger.** Per-company sandbox isolation for the orchestrator comes first, because it also closes CISO NN2.

**Effect:** the original signature sheet is superseded by **sheet v2** in `decision-options.md` §4. The surface stays `blocked`.

## State: `blocked`

**Path:** `authored → under-verification → reconciling → blocked`.
- The CISO recorded a **no-go** (§34.5). The surface is `irreversible: true` and the no-go is unresolved, so it goes to `blocked` (§34.3). It cannot advance until the Owner decides (§34.7, an irreversible surface reaching `blocked`) or a §29 resolution clears it.
- **No reconciliation block is written.** None is allowed until the no-go is actually resolved, either by evidence that C1–C4 are met or by an Owner-logged override (§34.8).
- This surface **must not be marked `verified`** by any agent. Even after the CISO withdraws, Autonomy Limit 4 needs Mario's review (given above, with conditions) **and** the Owner's signature.
- **Roster notification.** The four verifiers were spawned inside the 2026-11-15 pipeline run. No Bus message was logged to `bus-log.md` (outside this deliverable's scope). Whoever lands this surface should post the §1 BLOCKER message and log it.

## Decision for the Owner

**Recommended option:** **(c) hybrid.** Truth stays in each company's git repo. Internal humans become signed-commit principals now. The OIDC gateway is built only when a named external human needs it, and it comes back to you as its own surface with a CFO budget.

**The dissent, first:**
- **CISO, no-go.** Do not open any human write path until C1–C4 are evidenced:
  - C1: touch-required, non-exportable signing keys;
  - C2: registry changes accepted only from Owner-signed commits, verified on the server;
  - C3: a fail-closed scan at ingestion;
  - C4: a passed red-team on human-content injection.

  Today an agent running as your OS user could sign as a human with a file-based key. A forged ratification is worse than none.
- **CFO, concern.** (b) has no budget and no demand. The trigger to build it must be a written, named condition, not automatic.
- **Mario, concern.** He approves with conditions:
  - keys rotate by `valid-before` and lines are never deleted;
  - one provenance envelope (`principal`, `signed_by`, `attested_by`, `kind`) is decided now;
  - ids are scoped per company;
  - agents carry `agent:<role>:<name>` principals too.
- **CLO, concern.** Pseudonymous handles only, with the person mapping kept outside git. Contributor IP terms before a second human writes. DPA, contributor terms and a breach process are hard blockers before any external human.

**Exactly what you sign: sheet v2** (full text with checkboxes in `project/context/intent/company-brain/decision-options.md` §4). It follows the CFO split: **formats now, build on trigger**.

*Part 1. Formats (irreversible, sign now):*
1. **D1:** each company's brain truth is its own git repository. Everything else is derived.
2. **D2:** principal ids use the grammar `<kind>:<id>` with an open kind set (`human`, `agent`, `gateway`). Agents are `agent:<role>` (session id in a separate field). Handles are pseudonymous, immutable and never reused, scoped per company, never a cross-company join key. *(Registry location is an implementation choice, not signed.)*
3. **Envelope v1:** `Provenance-Version: 1`, `principal`, `signed_by`, `attested_by?`, `kind`. **Binding rule:** a `human:` principal counts only if the signing key maps to that principal in `allowed_signers`; otherwise the commit is unattributed.
4. **The gate:** no human verdict counts until the CISO withdraws the no-go on evidence of C1–C4 (C1 now includes the Owner's own key).

*Part 2. Build triggers (sign now, nothing is built yet):*
5. **Human write path (MCP, CI, signing, scan):** built only when a named non-Owner internal human will write to a brain. It reopens with a CTO costed estimate and a CFO budget. D3 (signing scheme) is decided then, with push-time revocation, not `valid-before` alone.
6. **(b) gateway:** a named external human who needs write access and cannot use git, **or** one person active in enough companies that per-company revocation becomes a burden. Reopens with a CFO budget and the CLO blockers.

*Also needed, but not part of this signature:* a CHARTER amendment for a legal-compulsion exception to Limit 5 (Layer A, so you ratify it separately); your signature on this decision made as a signed commit, or recorded outside the agents' identity.

You may instead choose (a) or (b), or reject all three. Any of those is logged as your decision, with the dissent above recorded beside it.

**What proceeds while you decide:** all reversible work (B1–B4). `sdk-doc inbox` works without human identity, because it reads existing Bus and surface primitives.

**Cost of delay:** low. No reversible work waits on this, and the only thing blocked is a human write path, which does not exist yet.

**Deadline:** none forced. Decide before the first non-Owner human is invited to write to any company's brain.

## improvement_signal (emitted on blocked)

```yaml
improvement_signal:
  friction: "An irreversible surface reached blocked because the security baseline it assumes (signed commits, server-side checks, an ingestion scan) does not exist yet. The design doc presented that baseline as already met for internal humans."
  suggested_target: workflow
  evidence_link: "project/surfaces/SURFACE-20261115-brain-identity-storage-001.md"
```

*Not yet appended to `record/metrics/_signals.jsonl`: that file is outside this deliverable's scope. The landing commit must append it, per §34.6.*
