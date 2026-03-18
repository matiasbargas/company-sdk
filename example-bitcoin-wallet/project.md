# Project: Vault
## A Self-Custodial Bitcoin Wallet SDK
### Release: v2026.Q2.1 -- "Genesis"

---

> **How to read this file:**
> This is a conversation transcript and project record in one document. It shows the exact sequence of interactions between the Owner, CEO, Coordinator, and team leads for a medium-size project. Every message is a template you can reuse. The section headers mark who is speaking. Copy this structure, replace the content, and you have a running project.

---

## CONVERSATION 1 -- Owner briefs the CEO

**[OWNER → ELENA (CEO)]**

Elena, I want to build a Bitcoin wallet SDK. Not another wallet app. A developer-facing library -- something a developer drops into their project and has wallet generation, key management, and transaction signing working in an afternoon. Clean TypeScript API, minimal dependencies, self-custodial by default. I've been looking at bitcoinjs-lib and the developer experience is painful. There's an obvious gap between "I want my app to support Bitcoin" and "I understand UTXO accounting and BIP44 derivation paths." We can own that gap. Medium team, about 3 months.

---

## CONVERSATION 2 -- CEO: Strategic Framing

**[ELENA (CEO) → OWNER + NOVA (COORDINATOR)]**

```
PROJECT BRIEF: Vault
Date: 2026-03-16
Release target: v2026.Q2.1

Market truth:
Bitcoin adoption among developers is growing but the tooling sits at two extremes: full custody solutions that abstract everything away, and raw libraries that require deep cryptographic knowledge. The middle ground -- a clean, safe SDK that a competent developer can ship with in a weekend -- does not exist as a serious product. That is the gap.

Target customer:
A JavaScript/TypeScript developer building a fintech app, a game, a marketplace, or a protocol integration that needs to accept, hold, or send Bitcoin. They understand programming. They do not understand UTXO sets or BIP32 derivation schemes and should not need to. They want the answer to "how do I generate a wallet, sign a transaction, and get a balance?" to be a three-line code example.

What winning looks like at 18 months:
Vault is the default answer on Stack Overflow when someone asks "how do I add Bitcoin to my app in TypeScript." We have 5,000+ GitHub stars, 200+ production applications using the SDK, and an active community. Revenue is from a managed API tier (hosted node, monitoring, analytics) on top of the free SDK.

Non-negotiables:
- Self-custodial. The SDK never phones home with key material. Keys stay with the developer.
- TypeScript-first. Not a port. Written in TypeScript with full type safety.
- Zero mandatory dependencies on a Vault-hosted service. The SDK works standalone.
- Security audit before 1.0 public release.

What we are NOT building:
- A wallet app (Exodus, BlueWallet are in that market)
- A full node (bitcoinjs-lib already handles this; we wrap it)
- A multi-chain SDK (ETH, Solana, etc. come later -- Bitcoin only for v1)
- An account abstraction layer (no custodial key management, no MPC in v1)

Decision authority matrix:
- Technical architecture: CTO
- Security architecture: CISO equivalent (or CTO + external security reviewer)
- Scope changes: PM + Coordinator, CEO if >20% scope shift
- Launch go/no-go: CEO
```

---

## CONVERSATION 3 -- Nova opens the release and activates the team

**[NOVA (COORDINATOR) → ALL]**

```
FROM: Nova (Coordinator)
TO: ALL
RELEASE: v2026.Q2.1
PRIORITY: INFO

MESSAGE:
Vault is open. Release v2026.Q2.1 "Genesis" is now active.

Epic definition:
A TypeScript-first Bitcoin wallet SDK. Developer-facing. Self-custodial. Ships in ~12 weeks with a medium team (Tier 3 per the PLAYBOOK). Competing in the developer tooling space, not the end-user wallet space. Full brief in this project.md.

I am now running Phase 1 Discovery. Activating in sequence:

1. CTO (Bargas-equivalent / rename to yours) → technical feasibility + make/buy matrix
2. Legal lead → licensing, open source model, any regulatory exposure
3. Security lead → cryptographic standards, key management non-negotiables
4. CMO → market context, developer positioning, competitive landscape
5. PM → user story map, scope definition for v2026.Q2.1
6. EM + Staff Engineer → team sizing, critical path, interface contracts

Each activation message follows. Sprint 0 gate will not be called until all five have responded.

Current status: Discovery in progress.
Sprint 0 gate target: Sprint 0 ends [+2 weeks from project start].
v2026.Q2.1 engineering start: Sprint 1 [+2 weeks].
```

---

## CONVERSATION 4 -- Nova activates CMO first (market context before architecture)

**[NOVA → CMO]**

```
FROM: Nova (Coordinator)
TO: CMO
RELEASE: v2026.Q2.1
PRIORITY: DECISION NEEDED

MESSAGE:
The Owner wants Vault to win on simplicity. Before the CTO designs the API surface, I need your market context report.

Specific questions:
1. Who are the real competitors for a developer-facing Bitcoin SDK?
2. What do developers actually complain about with existing tools?
3. What does "simplicity" mean to this specific customer -- what does a simple SDK look like in their daily workflow?
4. What is the one sentence a developer would use to describe Vault to a colleague?

Your market context report will be reviewed by the CEO and will directly shape how the CTO designs the public API. If you find that "simplicity" means something specific in the market (e.g., 5-minute getting started, zero config, no account required), that becomes a design constraint, not a marketing claim.

DECISION BY: [3 days from activation]
ESCALATION: Elena (CEO)
```

---

## CONVERSATION 5 -- CMO: Market Context Report

**[CMO → NOVA + CEO + CTO]**

*(See `marketing-review.md` for the full market context report. Summary inline below.)*

```
FROM: CMO
TO: Nova, CEO, CTO
RELEASE: v2026.Q2.1
PRIORITY: INFO

MESSAGE:
Market context report for Vault is complete. Full analysis in marketing-review.md. Key findings for the team:

Competitive gap confirmed:
No current SDK occupies the "simple TypeScript Bitcoin SDK" position. bitcoinjs-lib is powerful and complex. BDK is Rust. Bitcore is Node-only and unmaintained. The gap is real.

What "simplicity" means to this customer (their words, not ours):
- "I spent three days understanding derivation paths before I could generate a single address."
- "The documentation assumes I already understand Bitcoin internals."
- "I just want to send and receive. Why is there no simple API for that?"

Simplicity = three things:
  1. Zero Bitcoin knowledge required to generate a wallet and receive funds
  2. Getting-started guide that works end-to-end in under 15 minutes
  3. TypeScript types that make the API self-documenting

Positioning statement:
"For TypeScript developers who need to add Bitcoin to their app without becoming Bitcoin experts, Vault is the SDK that handles the cryptography so you can focus on your product."

One sentence developers would say to a colleague:
"It's like Stripe for Bitcoin -- you don't need to know how the underlying rails work."

The "Stripe for Bitcoin" framing is not a claim we make. It is the mental model the customer already has when they see a clean API with great docs. Design to earn that comparison.

Recommendation to CTO:
The public API surface should be designed with a 15-minute getting started benchmark. If a developer cannot go from npm install to a funded testnet address in 15 minutes, the API is too complex regardless of technical correctness.
```

---

## CONVERSATION 6 -- CTO: Technical Feasibility + Architecture Brief

**[CTO → NOVA + CEO + STAFF ENGINEER]**

```
FROM: CTO
TO: Nova, CEO, Staff Engineer
RELEASE: v2026.Q2.1
PRIORITY: INFO

MESSAGE:
Technical feasibility confirmed. This is achievable in 12 weeks with a 4-5 person team. Full architecture brief below.

ARCHITECTURE BRIEF: Vault v2026.Q2.1
Date: 2026-03-16

System components:
1. vault-core          -- BIP39/BIP44/BIP49/BIP84 key derivation, address generation, wallet management
2. vault-tx            -- PSBT construction, UTXO selection, fee estimation, transaction signing
3. vault-node          -- Bitcoin node adapter layer (connects to Electrum, public APIs, or own node)
4. vault-types         -- Shared TypeScript type definitions. Everything else imports from here.
5. vault-docs          -- Documentation site (Docusaurus). The 15-minute getting started lives here.

Data flow:
Seed phrase → BIP39 → Master key → BIP44 derivation → Child keys → Addresses
Transaction request → UTXO fetch (via vault-node) → PSBT construction → Sign (vault-core) → Broadcast

External integrations:
- Electrum server (testnet + mainnet): non-blocking, pluggable, developer provides their own or uses default
- Blockstream.info API: fallback for UTXO and broadcast (public, no auth required, rate-limited)
- npm registry: package distribution (no custom infrastructure needed at v1)

Security posture:
- All key material stays in memory during a session. Never written to disk by the library.
- No network calls from vault-core or vault-tx. Key operations are fully offline.
- vault-node is the only component that makes network requests. Developers can replace it entirely.
- Entropy source: platform-native (crypto.getRandomValues in browser, crypto.randomBytes in Node).
- BIP39 wordlist is included in the package. No external fetching at wallet generation time.

Scalability assumptions:
This is a library, not a service. It does not have traditional scalability concerns.
The optional managed API tier (v2+) will have scalability concerns. That is not v1 scope.

Irreversible decisions in this build:
1. Package structure (monorepo with separate packages). Changing this later breaks downstream consumers.
2. The TypeScript type signatures on the public API. These are the contract.
3. The default derivation paths (BIP84 for native SegWit by default, BIP44 available). Changing defaults is a breaking change.
4. The PSBT-first transaction model. This is the right choice and it locks us into PSBT for all signing.

Make/Buy/Partner matrix:
| Component | Decision | Vendor/Approach | Rationale |
|---|---|---|---|
| BIP39 implementation | Wrap | bip39 (npm) | Well-audited, widely used. Do not reinvent. |
| BIP32 HD derivation | Wrap | tiny-secp256k1 + bitcoinjs-lib for primitives | Security-critical. Use audited crypto, wrap with our API. |
| PSBT handling | Wrap | bitcoinjs-lib PSBT module | This is the hard part. Wrap it, don't rewrite it. |
| UTXO fetching | Build (thin adapter) | Custom adapter over Electrum/Blockstream | No vendor does this cleanly in TypeScript. 1 week of work. |
| Documentation | Buy (tools) | Docusaurus + TypeDoc | Best-in-class for SDKs. 2 days to set up. |
| CI/CD | Buy | GitHub Actions | Standard. No decision needed. |
| Security audit | Partner | External security firm | Required before 1.0. Budget: $15-30K. Start outreach Sprint 1. |

Team recommendation:
Tier 3 (Medium). 4 FTEs for 12 weeks.
- 1 Senior/Staff engineer: owns vault-core and vault-tx (the hard cryptography wrapping)
- 1 Senior engineer: owns vault-node adapter and the UTXO/broadcast layer
- 1 engineer (Mid-Senior): owns documentation site and getting-started experience
- 1 PM/DX engineer hybrid: owns developer experience, the 15-minute benchmark, and community feedback

Seniority floor: At least 1 Staff-level engineer. vault-core + vault-tx involve cryptographic primitives where a wrong decision has security consequences.
```

---

## CONVERSATION 7 -- PM: User Story Map + Scope

**[PM → NOVA + CTO + CMO]**

```
FROM: PM
TO: Nova, CTO, CMO
RELEASE: v2026.Q2.1
PRIORITY: INFO

USER STORY MAP: Vault v2026.Q2.1

The user:
A TypeScript developer at a startup. They are building a peer-to-peer marketplace where buyers and sellers settle in Bitcoin. They have shipped production apps before. They have never touched Bitcoin code. They found bitcoinjs-lib on GitHub and spent a week reading the source code before giving up and looking for an alternative. They are now evaluating Vault.

The job they are trying to do:
Accept Bitcoin payments in their app, display balances, and allow users to withdraw to their own wallets.

What they do today:
Nothing. They've been blocked on tooling. The alternative is to use a custodial service (Coinbase Commerce, OpenNode) which solves the problem but removes self-custody from their users. They don't want to be the custodian.

Why it is painful today:
- UTXO accounting is not intuitive coming from an account-based model
- Derivation paths require reading 3 BIPs before writing a line of code
- No TypeScript types in the main Bitcoin libraries -- runtime errors are the debugging experience
- Documentation assumes Bitcoin knowledge the developer does not have

The moment of value:
When the developer sees their first testnet address appear in the terminal after running three lines of code. Not a tutorial. Their code. Their address. In under 10 minutes.

Success signal:
A developer forks the getting-started example, modifies it, and pushes it to their own repo within 24 hours of discovery.

SCOPE: v2026.Q2.1

In scope:
- [ ] Mnemonic generation (BIP39, 12 and 24 word)
- [ ] HD wallet derivation (BIP84 native SegWit default, BIP44 legacy available)
- [ ] Address generation (receive addresses + change addresses)
- [ ] UTXO fetching (via Electrum adapter and Blockstream.info fallback)
- [ ] Transaction construction (PSBT)
- [ ] Transaction signing (single-sig)
- [ ] Transaction broadcasting
- [ ] Balance calculation
- [ ] TypeScript types for everything
- [ ] Getting started guide (15-minute benchmark)
- [ ] API reference documentation (TypeDoc generated)
- [ ] Testnet support (default) + mainnet support (explicit opt-in)

Out of scope (explicit):
- Multi-sig transactions (v2)
- Hardware wallet integration (Ledger/Trezor) (v2)
- Lightning Network (separate product decision)
- React/Vue/native framework bindings (v2 based on demand)
- Managed API tier / hosted node (v2 revenue layer)

Deferred with reason:
- Browser WebCrypto support -- deferred to v2026.Q2.2. Adds complexity to entropy handling. v1 ships as Node.js first.
- Watch-only wallets -- deferred to v2026.Q2.2. Required for the marketplace use case but not the core getting-started.
```

---

## CONVERSATION 8 -- EM: Critical Path + Team Activation

**[EM → NOVA]**

```
FROM: EM
TO: Nova (Coordinator)
RELEASE: v2026.Q2.1
PRIORITY: INFO

MESSAGE:
Critical path is mapped. 12-week plan below. Team is Tier 3. Ready to start Sprint 1 once Sprint 0 gate is called.

CRITICAL PATH: Vault v2026.Q2.1

Build sequence:
Week 1-2 (Sprint 0):     vault-types finalized. Repo structure. CI/CD. Security firm outreach.
Week 2-4 (Sprint 1):     vault-core: BIP39 + BIP32 + address generation.
Week 4-6 (Sprint 2):     vault-tx: PSBT construction + UTXO selection + fee estimation.
                          vault-node: Electrum adapter + Blockstream fallback.
Week 6-8 (Sprint 3):     Transaction signing + broadcasting. Integration tests.
Week 8-9 (Sprint 4):     Balance calculation. Getting started guide v1.
Week 9-10 (Sprint 5):    Developer experience pass: 15-minute benchmark test.
                          API documentation (TypeDoc + Docusaurus).
Week 10-11 (Sprint 6):   Security review (external firm). Hardening.
Week 11-12 (Sprint 7):   Beta: 5-10 external developers given access. Bug fixes.
                          Testnet → mainnet flag verified. Release candidate.

Critical path (no slack): vault-types → vault-core → vault-tx → sign → broadcast → beta
External dependency: security firm review (Weeks 10-11). If this is not booked in Sprint 1, it blocks the release.

Team needed:
1x Staff Engineer (vault-core + vault-tx lead)
1x Senior Engineer (vault-node + broadcast layer)
1x Mid-Senior Engineer (docs + DX)
1x PM/DX reviewer (15-minute benchmark + community)
EM: me, not counted in FTE above.
```

---

## CONVERSATION 9 -- Nova: Sprint 0 Gate Called

**[NOVA → ALL]**

```
FROM: Nova (Coordinator)
TO: ALL
RELEASE: v2026.Q2.1
PRIORITY: INFO

MESSAGE:
Sprint 0 gate is called. All inputs received. Checking gate:

Sprint 0 Gate -- Vault v2026.Q2.1:
[x] Epic definition complete and Owner-approved
[x] Discovery complete (architecture brief, market context, user story map)
[x] CTO: technical feasibility confirmed, architecture brief written
[x] CMO: market context report complete (full analysis in marketing-review.md)
[x] PM: user story map + scope definition complete
[x] EM: critical path mapped, team sizing confirmed
[ ] Security firm: outreach must begin in Sprint 1, Week 1 -- not Sprint 6
[ ] Repo + CI/CD scaffolding: Sprint 0 task for EM
[x] Make/buy/partner decisions locked
[x] External dependencies identified (security audit as the only blocking one)
[x] Owner aligned on scope, timeline, budget

Gate status: OPEN with two Sprint 0 actions outstanding (security firm outreach + repo setup). These are Sprint 0 deliverables, not blockers to calling the gate.

Release plan confirmed:
v2026.Q2.1 "Genesis"  -- Core SDK: wallet gen, UTXO, sign, broadcast. 12 weeks. 4 FTE.
v2026.Q2.2 "Horizon"  -- Browser support, watch-only wallets, hardware wallet stub (TBD based on v1 feedback)
v2026.Q3.1 "Revenue"  -- Managed API tier. Hosted Electrum node. Dashboard. Monetization.

Engineering starts: Sprint 1.
Sprint 1 kickoff: [date].

Next sync point: Sprint 1 end -- EM squad status + PM friction log update.
```

---

## RELEASE PLAN -- v2026.Q2.1 "Genesis"

**Release ID:** v2026.Q2.1
**Name:** Genesis
**Target ship date:** [+12 weeks from Sprint 1 start]
**Team tier:** Tier 3 (Medium)
**FTEs:** 4 + EM

### Outcome
A developer can go from `npm install @vault-sdk/core` to a signed testnet transaction in under 15 minutes. The SDK is self-custodial, TypeScript-first, and has zero mandatory dependencies on Vault-hosted infrastructure.

### Scope Shipped
- Mnemonic generation (BIP39)
- HD wallet derivation (BIP84 default)
- Address generation (receive + change)
- UTXO fetch (Electrum + Blockstream fallback)
- PSBT transaction construction
- Single-sig transaction signing
- Transaction broadcast
- Balance calculation
- TypeScript type definitions for all public APIs
- Getting started guide (15-minute benchmark)
- API reference (TypeDoc)

### Scope Deferred
- Browser/WebCrypto support → v2026.Q2.2
- Watch-only wallets → v2026.Q2.2
- Multi-sig → v2026.Q3.x
- Hardware wallet → v2026.Q3.x

### Dependencies
- Security audit firm booked and completed by Sprint 6 (Sprint 1 action)
- Staff engineer hired or contracted before Sprint 1

### Budget
- Engineering (4 FTE x 12 weeks): see cost model
- Security audit: $15-30K (one-time)
- Infrastructure (GitHub, CI, docs hosting): ~$200/month

### Sprint Sequence
| Sprint | Focus | Gate |
|---|---|---|
| Sprint 0 | Repo + types + CI/CD. Security firm booked. | Gate: types finalized, CI green |
| Sprint 1 | vault-core: BIP39, BIP32, address gen | Gate: address generation E2E test passing |
| Sprint 2 | vault-tx + vault-node | Gate: UTXO fetch + PSBT construction in test |
| Sprint 3 | Signing + broadcasting | Gate: full flow -- generate → sign → broadcast on testnet |
| Sprint 4 | Balance + DX pass 1 | Gate: 15-min benchmark attempted internally |
| Sprint 5 | Docs + 15-min benchmark pass | Gate: 15-min benchmark verified by non-team developer |
| Sprint 6 | Security review + hardening | Gate: security firm report + all critical findings resolved |
| Sprint 7 | Beta + bug fixes | Gate: 5 external developers complete getting started without help |

---

## OPEN DECISIONS LOG

| Decision | Owner | Status | Due |
|---|---|---|---|
| Which Electrum server is default for testnet getting-started? | CTO | Open | Sprint 0 |
| Security firm selection (trail of bits / NCC Group / independent) | CTO + CEO | Open | Sprint 1 Week 1 |
| npm org name: @vault-sdk or @vaultbtc or other? | CEO + CMO | Open | Sprint 0 |
| License: MIT vs. Apache 2.0? | Legal lead | Open | Sprint 0 |
| Getting started benchmark tester: who is the first external developer to attempt it? | PM + CMO | Open | Sprint 4 |

---

*project.md v1.0 -- Vault / v2026.Q2.1 "Genesis" -- Updated 2026-03-16 by Nova*
*This file is the living record of the project. Every decision made is logged here. Every agent who joins the project reads this first.*
