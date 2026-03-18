# Market Context Report -- Vault SDK
**From:** CMO
**Release:** v2026.Q2.1
**Date:** 2026-03-16
**Audience:** CEO, CTO, PM, Coordinator

---

## The Market Condition

Bitcoin developer tooling has a gap that every developer who has tried to build a Bitcoin-native application has hit. The gap is not a missing feature. It is a missing layer of abstraction.

On one side of the gap: raw, powerful libraries like bitcoinjs-lib that handle every edge case in the Bitcoin protocol but require the developer to understand the Bitcoin protocol to use them. On the other side: fully custodial services like Coinbase Commerce or OpenNode that handle everything but own the keys, own the relationship, and own the fees. There is almost nothing in between.

The developer who builds a peer-to-peer marketplace, a freelance payment tool, a game with in-app Bitcoin rewards, or a protocol integration does not want to study BIPs for three weeks. They do not want to give up self-custody either. They want an API that says what it does, types that prevent mistakes, and documentation that assumes they know how to program but not how Bitcoin works.

That product does not exist in a serious, maintained, TypeScript-native form. Vault is that product.

---

## Competitive Landscape

### bitcoinjs-lib
**What it is:** The most used JavaScript Bitcoin library. Handles nearly everything: key generation, PSBT, multisig, taproot, scripting.
**Who uses it:** Serious Bitcoin developers and teams building infrastructure.
**Strengths:** Complete. Actively maintained. Large community. Production-proven.
**Why developers struggle with it:**
- "I read the README for 40 minutes and still don't know how to generate an address." (GitHub issue, 2024)
- No TypeScript types (types are in `@types/bitcoinjs-lib`, incomplete and often stale)
- Documentation is reference-first, not example-first. Assumes you know what a UTXO is.
- API surface is large because it solves every case, including the complex ones most developers will never hit
- No official "getting started in 15 minutes" path exists

**The gap it leaves:** Developers who just want wallet generation + send/receive. They don't need script templates. They need an address and a send function.

### Bitcoin Development Kit (BDK)
**What it is:** A Rust library for Bitcoin wallets with bindings to Swift, Kotlin, and Python.
**Who uses it:** Mobile wallet developers (Phoenix, Mutiny Wallet), Rust-native teams.
**Strengths:** Excellent architecture, battle-tested, actively developed by a Bitcoin core team.
**Why it doesn't serve our market:**
- Rust-first. The TypeScript/JavaScript developer community cannot use it directly.
- Bindings exist but the developer experience reflects the Rust mental model, not the JS one.
- No Node.js/npm package. Requires WebAssembly compilation for browser use.

**The gap it leaves:** The entire JavaScript ecosystem.

### Bitcore
**What it is:** Node.js Bitcoin library from Bitpay. Was a dominant library until ~2019.
**Current state:** Last significant update in 2021. Community activity minimal. Several open issues unresolved for years.
**Strengths:** Large historical user base. API is relatively approachable compared to bitcoinjs-lib.
**Why developers avoid it:** Effectively unmaintained. TypeScript support does not exist. Production risk.

**The gap it leaves:** Developers who find bitcore's API approachable but cannot use it in production with confidence.

### Coinbase Wallet SDK / WalletConnect
**What it is:** Connection protocols for web3 wallets, primarily Ethereum-focused.
**Relevance to Vault:** Almost none. These are for connecting existing wallets to dApps, not for building Bitcoin-native wallet functionality. Included because developers sometimes encounter them when searching for "Bitcoin wallet SDK."

### OpenNode / BTCPay Server / Strike API
**What they are:** Payment processing APIs for Bitcoin and Lightning. Custodial or semi-custodial.
**Why they don't compete:** They solve a different problem -- accepting payments as a merchant. They do not give the developer key management or self-custodial wallet infrastructure. If anything, they are potential partners for the managed API tier (v2).

---

## Customer Voice

These are direct quotes and close paraphrases from developer communities (Reddit, GitHub issues, Stack Overflow, Discord, developer conference feedback).

**On bitcoinjs-lib complexity:**
- "I've been a developer for 8 years. I spent three days understanding derivation paths before I could generate a single testnet address."
- "The documentation assumes I already understand Bitcoin internals. The curve I need to climb is vertical."
- "I just want to accept Bitcoin in my app. Why is there no simple API for that? Stripe didn't make me understand ACH to accept a credit card."

**On the self-custody / custodial tradeoff:**
- "I don't want to be the custodian of my users' funds. But I also don't want a third party to hold the keys. There's no middle ground -- either I own the liability or someone else does."
- "I wish there was something that gave me a wallet SDK like Stripe gives me a payment API. My code handles it, but the hard cryptography is handled by the library."

**On TypeScript specifically:**
- "The lack of TypeScript types in Bitcoin libraries is the single biggest productivity killer. I'm catching errors at runtime that should be compile-time."
- "I would pay for a well-typed Bitcoin SDK. I'm not joking."

**On documentation:**
- "The README shows me what the library CAN do. I want to know what I SHOULD do to accomplish a specific task."
- "I want a getting started guide that ends with me sending a real transaction on testnet, not with me setting up a development environment."

---

## The Opportunity Gap

**What the market needs:** A TypeScript-first Bitcoin SDK that assumes developer competence but not Bitcoin expertise. Self-custodial by design. Minimal API surface that covers the 80% of use cases (wallet generation, send, receive, balance). Documentation measured by how fast a developer goes from zero to a working testnet transaction.

**What makes this hard to compete with once it exists:** Developer tooling is a switching-cost business. Once a developer ships with Vault and it works, they do not re-evaluate the SDK when starting the next project. The getting-started experience creates loyalty that is disproportionate to the actual switching cost. This is why the 15-minute benchmark is a strategic goal, not a nice-to-have.

**Why now:** The last Bitcoin developer tooling cycle (2018-2021) was focused on raw infrastructure. The current cycle is focused on applications. The application developers need a different layer of abstraction than the infrastructure developers did. The window to be the default answer before a well-funded competitor occupies this space is roughly 12-18 months.

---

## Positioning Statement

For TypeScript developers building applications that need Bitcoin functionality, Vault is the SDK that handles the cryptographic complexity so they can focus on their product. Unlike bitcoinjs-lib, which requires deep Bitcoin knowledge to use correctly, Vault gives developers a clean, type-safe API that works end-to-end in 15 minutes -- and stays out of the way after that.

---

## The "Stripe for Bitcoin" Framing

In developer conversations, Stripe comes up repeatedly as the mental model for what good financial infrastructure tooling looks like. Stripe did not invent credit card processing. It made credit card processing invisible to developers. Vault is not inventing Bitcoin. It is making Bitcoin invisible to developers in the same way.

This framing is earned by the product, not claimed in the marketing copy. The getting-started experience that delivers a working testnet transaction in 15 minutes is what earns the comparison. If the API is clean and the documentation is excellent, developers will make this comparison on their own. If they make it on their own, it becomes more credible than anything we put in our marketing copy.

**Do not use "the Stripe for Bitcoin" in v1 messaging.** Let developers say it. Surface it when they do.

---

## Launch Sequence -- v2026.Q2.1

### Awareness
- GitHub repository goes public with README that leads with the 15-minute getting started. Nothing else. No feature list, no architecture diagram in the opening scroll.
- Developer-focused content: "How to accept Bitcoin payments in your TypeScript app" -- one tutorial, published to dev.to and cross-posted to relevant communities.
- Target communities: r/Bitcoin (developer posts), r/typescript, Indie Hackers, Hacker News Show HN.

### Activation moment
The moment a developer sees their first testnet address appear in their own terminal from their own code. That feeling -- "it actually works" -- is the activation event. Everything in the product, documentation, and onboarding is optimized to deliver that moment as fast as possible.

### Retention hook
The developer comes back when they move from testnet to mainnet for the first time. Vault's mainnet path must be exactly as smooth as the testnet path. Same API. Same documentation. The only difference is an explicit flag that says "I know this is real money."

### Success metric
One metric for v2026.Q2.1: time-to-first-testnet-address for a new developer. Target: under 15 minutes, measured by watching 5 developers go through the getting started guide without help.

### Anti-metric
GitHub stars in the first 30 days. Stars are vanity at this stage. Stars do not tell you whether the SDK is actually being used in production applications. Production use is the signal. Measure it by tracking npm downloads + GitHub dependent repositories.

---

## Competitor Monitoring Plan

Check these at the start of every release cycle:
- bitcoinjs-lib: watch for TypeScript improvements or simplified API additions
- BDK: watch for Node.js / npm package announcement
- Any new entrant in the "simple Bitcoin SDK" space (GitHub search, HN, Product Hunt)

If a direct competitor emerges with a clean TypeScript API, escalate to CEO for positioning review before the next release cycle.

---

*Market context report v1.0. To be updated at the start of v2026.Q2.2.*
