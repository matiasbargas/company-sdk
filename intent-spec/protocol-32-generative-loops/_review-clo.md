# Cross-domain shape review — CLO (Camila Geneva)
**Date:** 2026-06-14
**Reviewer:** CLO
**Target:** §32 Generative Loops v0.1 (sdd-v2.md, shaped-brief.md, critique-revise.md, red-team.md)
**Mode:** Blind shape review against CLO domain — Q1 / Q2 / Q3

---

## Q1 — Critique-Revise on a Compliance Memo

**Verdict: maps_with_caveat.**

The mechanism transports cleanly at the *workflow* layer — draft → critic against fixed constitution → one-pass revision → constitution-as-judge. A compliance memo absolutely benefits from a one-pass principle-bound critique that resists timidity-creep, and the `would-have-wrongly-killed:` discipline maps onto a real CLO failure mode (memo gets watered down by a reviewer who is conflict-averse, the bold recommendation gets stripped, the residual exposure becomes higher because the recommendation no longer commits to anything). So far so good.

The caveat is structural and worth naming because Greg asked the right question: **a compliance memo answers to *two* constitutions, not one.** Layer A (Constraints + Soul) is the SDK-internal moral spine — it tells us how *we* want to behave. The external constitution is the regulatory regime: GDPR Art. 6 lawful basis, CCPA §1798.100 right-to-know, SOC 2 CC6.1 logical access, jurisdictional case law, regulator guidance letters. These are not aspirational principles you can "preserve the bold version of." They are bright-line rules where the wrong answer triggers fines, consent decrees, or criminal referral. If a Constitutional Critic runs Critique-Revise on a compliance memo against Layer A only, the loop produces a memo that is *Soul-aligned* but may be *regulatorily wrong*, and the `would-have-wrongly-killed:` line would happily preserve a "bold" interpretation that a regulator would reject on its face. That is not a small distortion — that is the loop discharging the wrong constraint and emitting a provenance hash that says it was reviewed.

This does not block v0.1. But Critique-Revise needs a documented NON_TRIGGER for compliance memos against Layer A alone, OR the pattern needs to support a typed `constitution: <ref>` argument so a CLO loop can declare `constitution: gdpr-art-6+layer-a` and the critic reads against both. The cheap fix is the typed argument. The expensive fix is finding out at audit time that we ran 40 loops on compliance memos against the wrong constitution and the LOOP-PROVENANCE hash says we did our diligence.

---

## Q2 — Red-Team's "assumption not attacked" wording

**Verdict: fits_with_caveat.**

The mechanism is genuinely useful for compliance work. Naming the one assumption you didn't attack in this pass — say, "I assumed the data subjects in scope are EU-resident only and did not test the UK GDPR delta" — is exactly the discipline that prevents a memo from quietly importing an unexamined jurisdictional assumption. The cost-value ratio is right.

The caveat is *vocabulary collision in the document that gets discovered*. In regulatory writing, "risk accepted" is a load-bearing term of art: it means the decision-maker, with knowledge of the risk and authority to accept it, has signed off that this residual exposure is acceptable to the business. It generates a duty-of-care record. "Assumption not attacked" is a *process* artifact — it means the critic chose, for budget reasons, not to test this particular thing. These are not the same and the distinction matters at audit time: a "risk accepted" line implies informed acceptance by an authority; an "assumption-not-attacked" line implies *nothing* about authority or informed acceptance. If a regulator or plaintiff's counsel reads a compliance memo with an `assumption-not-attacked:` line, the natural inference will be "you knew this risk and chose not to address it" — i.e., they will read it as risk-accepted. That is worse than not having the line at all, because it converts a process limitation into apparent informed acceptance without the sign-off that informed acceptance requires.

The fix is small and worth doing in v0.1 protocol text: Red-Team on a CLO-owned artifact must phrase the line as `red-team-scope-limit:` not `assumption-not-attacked:`, OR the pattern doc must explicitly state that `assumption-not-attacked:` is a *process* artifact and does not constitute risk acceptance under §6 (decision log) — and any actual risk acceptance still requires a separate `history.md` entry per protocol §6. The pattern as currently written is silent on this, which means in regulated contexts it imports legal exposure the team has not chosen to accept.

---

## Q3 — Audit mechanism / persistence / discoverability — **load-bearing**

**Verdict: retention_policy_needed.** (Should be addressed before seal; does not block.)

This is the question only I would catch and Greg was right to single it out. Let me state what §32 actually ships, in CLO terms:

1. **A discoverable record.** `loops/<id>/state.md` + `metrics/_signals.jsonl` are append-only, content-hashed, grep-able, and persist in the project tree. Anyone with discovery access (regulator, plaintiff's counsel, acquirer in M&A diligence, internal whistleblower) gets the full critique log, every `would-have-wrongly-killed:` line, every `assumption-not-attacked:` line, every `friction:` signal, indefinitely.

2. **An audit mechanism with stated criteria.** The CISO 5-dimension quarterly audit creates a *documented internal standard* for critique quality. Once we say in protocol text that lines scoring ≤5/15 are "suspected sycophantic-compliance emissions" and that >25% failure means §32 is "failing its anti-sycophancy contract" — we have just established a duty-of-care standard for ourselves. A future plaintiff or regulator can point at our own protocol and ask: did you run the audit? Did the audit find boilerplate? What did you do about it? An audit standard you wrote and then ignored is worse than no standard, because the standard is admissible against you.

3. **A mechanism that will, in production, capture sensitive content.** Compliance memos run through Critique-Revise will contain analysis of legal exposure, regulatory positions taken, candid assessments of where the company is non-compliant, and the critic's view of where the memo's recommendation is weak. CTO architecture briefs run through Red-Team will contain candid threat assessments. PM SDDs will contain market-bet reasoning. None of this content is marked privileged; none of it has a retention boundary; the LOOP-PROVENANCE hash makes it tamper-evident, which *cuts against* the team if the content is unfavorable — you cannot quietly correct a state.md once it's hashed and emitted.

The combination — discoverable + audit-standard-bearing + sensitive-content-carrying — is the legal exposure profile of a corporate internal audit function, except no one has decided to take on that exposure consciously.

**Three things v0.1 needs before seal to make this exposure chosen rather than imported:**

a) **A retention policy** in §32 text. Default proposal: `loops/<id>/state.md` retained for the life of the artifact it shaped; `metrics/_signals.jsonl` retained for two release cycles (long enough for ritual consumption); both subject to legal-hold override that *suspends* normal retention when discovery is reasonably anticipated. This is one paragraph in protocol text and is cheaper to write now than to retrofit after the first subpoena.

b) **A privilege-protection scope statement.** When `loops/<id>/state.md` is generated for a legal-domain artifact (compliance memo, contract review, regulatory position), the loop opens with `PRIVILEGE_SCOPE: attorney-client-work-product` and the resulting state.md gets a header marking it as such. This does not *create* privilege (only an attorney-client relationship plus actual work-product can do that), but it preserves the *option* to assert privilege later. Without the header, the option is foreclosed because the document looks indistinguishable from any other internal artifact. The pattern docs currently have no concept of privilege scope, which means in regulated environments §32 silently waives a protection the team would want to preserve.

c) **A discoverability acknowledgment in protocol §32 text.** One sentence: "Loop state files and the signals stream are designed as discoverable records and create a duty-of-care standard the team commits to meet. Loops MUST NOT be opened on artifacts the team is not prepared to have read in adversarial discovery." This forces the spawning agent to consciously accept the exposure at loop-open time, which is the moment when the choice is cheap. After the loop runs, the choice is no longer available.

The reason this is `retention_policy_needed` rather than `blocks_seal`: none of this affects how Critique-Revise *behaves*. The mechanism is sound. But it converts the team's internal critique substrate from an ephemeral working artifact into a permanent corpus with legal weight, and that conversion deserves a CLO sign-off, not a CLO silence. We have never had this conversation about persistence before — the project-template has `history.md` and area logs, but those are decision records (CLO-aware by design) rather than candid critique transcripts. §32's state.md is closer to deposition material than to a kanban log, and v0.1 should ship knowing that.

---

## Bottom line

- Q1: maps with a fixable caveat (typed constitution argument)
- Q2: fits with a fixable caveat (rename or scope-statement on Red-Team line in legal contexts)
- Q3: the persistence model needs a one-paragraph retention + privilege-scope addition before seal. This is the substantive concern.

Q3 is the load-bearing one. If §32 ships without it, the next compliance memo run through Critique-Revise creates a discoverable record that the team has not chosen to create, and the audit mechanism establishes a duty-of-care standard the team has not chosen to meet. The fix is one paragraph in §32 text and one optional field on loop open. Cheap now. Expensive after the first subpoena.

— Camila Geneva, CLO
