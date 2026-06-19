# Mesa Técnica synthesis (CTO Nicolás)

## The four guardrails ranked

1. **Staff (schema freeze + public RFC + SHA-pin + validator CI).** This is the load-bearing one. If the `_signals.jsonl` envelope is not frozen v1.0, SHA-pinned in the contract, and CI-validated before lighthouse #1, every other guardrail collapses — Mario's irreversibility check has nothing to ratchet against, PM's 30-minute slice has nothing stable to query, and Pablo's portability eval has no contract to assert behavioral equivalence on. The schema is the substrate.
2. **Mario (v1.0 freeze + Halloway Ratchet + bet #2 buyer-persona sign-off).** Mario operationalizes Staff's contract into the cross-segment generalization test. The Halloway Ratchet + Model Risk reviewer is what prevents a devtool-shaped schema from forcing a breaking migration when BFSI reads the same corpus in Q1 2027. Without this, we ship a substrate that the regulated bet cannot inherit.
3. **PM (signed 30-minute slice + explicit kill-list).** This is the GTM guardrail with technical teeth. It prevents the substrate bet from silently mutating into a SaaS-vendor bet under the gravitational pull of "but a dashboard would be easy." Critically: it converts a scope question into a contract clause with a downgrade penalty.
4. **Pablo / CAIO (two-provider portability CI on a public eval set).** Highest absolute exit cost on an 18-month horizon, but the lowest day-30 blast radius — if provider portability is missing at lighthouse #1, we still ship; we just accumulate exit debt. It is ongoing-discipline rather than pre-commit blocking. Ranked #4 only because the other three must exist for it to be enforceable.
5. **CTO addition (see below): Bus-to-`_signals.jsonl` lineage invariant.**

## Where the panel converged

All four panelists, working independently, named `_signals.jsonl` as the single contract that determines whether this is a substrate or a product. Mario freezes it, Staff publishes and SHA-pins it, PM queries it as the 30-minute proof, Pablo asserts portability by writing to it. This is the cross-domain signal: the jsonl line is not a logging format — it is the **public API of the company**, and every panelist independently arrived at the same load-bearing artifact. A wedge architecture would have produced four different answers. The fact that it didn't is the strongest evidence that the substrate framing is technically real.

## Where the panel disagreed (and how I adjudicate as chair)

Mario and PM are in latent tension on **what "v1.0" includes**: Mario wants the schema rich enough that a bet #2 Model Risk reviewer signs off (implying cross-segment fields — audit, lineage, attestation), while PM wants v1.0 minimal enough that a staff engineer hits the 30-minute slice with zero hosted surface. Left unresolved, Mario's reviewer asks for fields PM's kill-list would treat as scope creep. **I adjudicate by separating envelope from payload (Staff's framing already implies this and I'm making it explicit and binding):** envelope v1.0 is frozen, minimal, and ships in the 30-minute slice — `schema_version`, `timestamp`, `actor`, `event_type`, `release_id`, `payload_namespace`, `payload`. Payload namespaces (`devtool.*`, `regulated.*`, `agency.*`) evolve independently under the Halloway Ratchet. Mario's bet #2 reviewer signs the *envelope*, not the *payload* — that satisfies cross-segment generalization without forcing regulated fields into the devtool slice.

## What CTO would add that the panel did not name

**Bus-to-`_signals.jsonl` lineage invariant:** every line in `_signals.jsonl` must be reconstructible from the Bus log, and a CI replay test must prove it on every PR. The panel guardrailed the schema, the slice, and the AI layer — but nobody guardrailed the **derivation pipeline** between agent communication (Bus) and the public corpus (`_signals.jsonl`). If that derivation is lossy, ad-hoc, or per-lighthouse, the substrate becomes a re-implementation surface, not a queryable record. The invariant: `_signals.jsonl` is a pure function of the Bus log + the release ID. No side-channel writes. Enforced by a replay CI job that fails if reconstruction diverges by a single line.

## The artifact each guardrail produces before commit

| Guardrail | Required artifact | Owner | Due |
|---|---|---|---|
| Staff: schema freeze + RFC + validator | Public `signals-schema` repo, `Contract Stability Policy.md`, `signals-validator` CLI, team-sdk CI job | Staff Engineer | Before contract signing |
| Mario: Halloway Ratchet + bet #2 sign-off | `/intent-spec/schemas/signals-v1.0.md` git-tagged, ratchet entries per field, Model Risk reviewer signature | Mario + CTO + bet #2 persona reviewer | Before contract signing |
| PM: signed 30-minute slice + kill-list | `lighthouse-1-slice.md` with recorded fresh-laptop session, OUT-OF-SCOPE list, contract downgrade clause | PM + lighthouse counterparty | Before contract signing |
| Pablo: two-provider portability CI | `eval-portability` CI job, frozen public eval set (≥30 scenarios), `LLMProvider` interface, rubric doc | CAIO + Staff | By day-30 of lighthouse |
| CTO add: Bus→jsonl lineage invariant | Replay CI job, lineage spec doc, "no side-channel writes" lint rule | CTO + Staff | Before contract signing |

## What I refuse to ship without all 4+1 in place

I will log dissent to `history.md` and block the lighthouse #1 contract countersignature if any of the four pre-commit artifacts is missing on contract day. The two-provider portability CI (Pablo) is the only one I will accept as a day-30 deliverable rather than a contract-day blocker — and only if the `LLMProvider` interface is already abstracted in the code on contract day, so the CI job is a measurement of an existing seam rather than a retrofit. Everything else — schema freeze, ratchet sign-off, scope kill-list, lineage invariant — must exist as committed artifacts before a buyer signs. A substrate bet that ships its first lighthouse without these four becomes a vendor pitch within two quarters, and the panel was unanimous that the vendor-pitch failure mode is the one that kills the company.
