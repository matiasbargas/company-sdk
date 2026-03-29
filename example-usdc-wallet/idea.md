# Idea: Vault
**Status:** Raw idea — not yet shaped
**Created:** 2026-03-16

---

> **How to use this file:**
> Fill in the sections below with whatever you know right now. Nothing needs to be polished. When the idea is sharp enough to run, activate Greg (CEO) with the brief in Section 4 and let the team take it from there.
> Use the AI prompts in Section 3 to iterate on the idea before activating the full team.

---

## 1. The Idea (one paragraph)

A self-custodial stablecoin yield wallet for regular people — not DeFi users. Someone opens the app, deposits their USDC, USDT, PYUSD, or DAI, and starts earning the best available yield across battle-tested DeFi protocols automatically. No DeFi knowledge required. The user never needs to know what Aave is, what a liquidity pool is, or how to compare APYs across five protocols. Vault does that for them. They just see: "Your $1,000 USDC is earning 5.2% APY." Clean mobile-first interface.

---

## 2. What I Know So Far

**The person this is for:**
Maya. 34. Product manager at a tech company. She holds $8,000 in USDC on Coinbase. She knows it's "just sitting there." She's heard of DeFi but tried to use Uniswap once and got lost. She doesn't want to learn DeFi. She wants her USDC to earn something — safely, simply, without paying attention to it. She doesn't fully trust exchanges after the FTX collapse. She wants to own her own keys but doesn't know how to set that up.

**The problem today:**
She leaves USDC on Coinbase earning 2% (custodial). She knows she could do better but doesn't know how without risking her funds on something she doesn't understand. Every DeFi app she's tried has shown her gas fees, contract addresses, and protocol jargon before she could do anything useful. She doesn't know how to compare Aave vs. Compound and doesn't want to.

**What "solved" looks like:**
When Maya sees "Your $8,000 USDC is earning 4.8% APY via Aave. You earned $1.05 today." — and she set it up in under 10 minutes, her seed phrase is backed up, and she can withdraw to her bank anytime. She recommends Vault to a friend within 30 days of her first deposit.

**What makes this different:**
No consumer app occupies the "simple, safe, self-custodial stablecoin yield" position. Existing yield products are either DeFi-native (complex, scary to outsiders) or custodial (exchange savings accounts). The gap is real and growing as stablecoin adoption expands outside crypto-native audiences. Safety to this customer means three things: self-custodial (funds accessible via seed phrase even if the app disappears), named recognizable protocols ("Aave" and "Compound" are names they've heard), and no surprises on fees.

**What I'm most uncertain about:**
Whether routing user funds to DeFi protocols constitutes a regulated financial service in target markets. If legal says yes, the product architecture and launch timeline change significantly. This is the riskiest assumption and must be resolved before vault-yield work begins.

---

## 3. AI Iteration Prompts

Use these prompts in a conversation to sharpen the idea before activating the team. You don't need to use all of them — stop when the idea is clear enough to write a brief.

**Sharpen the problem:**
> "I'm building [one-line description]. The core problem I'm solving is [problem]. Challenge this. What am I probably wrong about? What am I not seeing?"

**Identify the customer:**
> "My target user is [description]. Help me get more specific. What is their typical day like? When would they actually use this? What would they have to believe to pay for it?"

**Stress-test the differentiation:**
> "Someone already solves [problem] with [existing solution]. Why would my target user switch to something new? What would have to be true about my solution for the switch to be obvious?"

**Find the Appetite:**
> "I want to build [idea]. What's the smallest version of this that would be meaningfully better than nothing? What's the minimum that would make someone tell a colleague about it?"

**Discover the non-negotiables:**
> "If I'm building [idea] for [user], what are the things that absolutely cannot be wrong? (security, compliance, data handling, UX invariants) What would destroy trust immediately if broken?"

**Draft the shaped brief:**
> "Based on what we've discussed, help me write a 1-page mission brief for this idea. Include: the problem, the target user, what 'solved' looks like, the Appetite (how many weeks this is worth), what's out of scope, and the riskiest assumption we're betting on."

---

## 4. Brief for Greg (CEO)

> Fill this in when you're ready to activate the team. Copy it into a conversation with Greg to start the full process.

```
Hey Greg — here's a new project brief.

Idea: Vault — A Self-Custodial Stablecoin Yield Wallet

The problem:
DeFi stablecoin yields are real and accessible — but only to people who understand DeFi. The gap between "I have USDC sitting in my exchange account earning nothing" and "I have USDC earning 5%+ in a battle-tested DeFi protocol" is entirely a UX and education gap.

The user:
Someone who knows what USDC is, holds stablecoins, and has a vague sense that "DeFi yields exist." They are not a DeFi user. They want their stablecoins to work for them the way a savings account does — safely, automatically, without effort. They trust self-custody over exchanges after watching exchange collapses in the news.

What we're building:
A consumer mobile + web app where users deposit stablecoins (USDC, USDT, PYUSD, DAI) and earn the best available yield across whitelisted DeFi protocols automatically. Self-custodial by default — Vault never holds keys. The user never needs to know which protocol their funds are in.

What winning looks like at 18 months:
Vault is the answer when someone asks "where should I put my USDC to earn yield without leaving it on an exchange?" 50,000+ wallets created, $20M+ TVL, reputation for being the simplest safe stablecoin yield app. Revenue from a small protocol fee on yield earned (take rate on APY, invisible to the user).

What I'm NOT doing:
- A DeFi dashboard (Zapper, DeBank are in that market)
- A crypto exchange or on-ramp (Coinbase, Kraken are in that market)
- A multi-asset investment app (not stocks, ETFs, or volatile crypto)
- A lending platform (we route to protocols, we don't run one)
- Automatic rebalancing in v1 (different regulatory surface)

Biggest risk:
Whether routing to DeFi protocols is a regulated financial service in target markets. Legal must sign off before protocol routing work begins.

Constraints:
- Budget: security audit $20-40K (Trail of Bits), ~$300/month infrastructure
- Timeline pressure: ~12 weeks, medium team (5 FTE + EM)
- Legal/compliance: stablecoin yield routing regulatory surface unknown — CLO + CISO gate required
- Tech constraints: Ethereum mainnet only for v1; only battle-tested audited protocols
```

---

## 5. Requirements Skeleton

> This is a lightweight version of the full requirements structure. Fill in what you know. The team will flesh this out during Discovery.

### Product
- Core user story: As a stablecoin holder, I want to deposit my USDC and earn the best available yield automatically so that my savings work for me without requiring DeFi knowledge.
- Success metric: Non-DeFi user completes wallet creation, deposit, and first yield accrual in under 10 minutes without assistance.
- Out of scope: Automatic rebalancing, multi-chain support, fiat on-ramp, WalletConnect, hardware wallet — all deferred to v2.

### Technical
- Stack assumptions: React Native (iOS + Android), Next.js (web), viem for contract interactions, BIP39/BIP44 key derivation, Expo Notifications.
- Integration requirements: Aave v3, Compound v3, Morpho, Spark Protocol (Ethereum mainnet) — direct smart contract calls, no intermediary aggregators.
- Data: User wallet addresses (public), transaction history. No PII. Seed phrase never transmitted — generated and stored device-local only.

### Legal / Compliance
- User data involved: Wallet addresses and transaction history only. No personal identity data collected.
- Regulated industry: Potentially yes — routing to DeFi protocols may constitute a financial service. CLO review required before vault-yield work begins.
- Contract requirements: External security audit firm engagement (Trail of Bits preferred).

### Financial
- Revenue model: Small take rate on yield earned by users (% of APY, disclosed clearly in app).
- Cost assumptions: Security audit $20-40K, infrastructure ~$300/month, app store fees $99/year (Apple) + $25 one-time (Google).
- Budget: 5 FTE × 12 weeks engineering + audit + infrastructure.

---

*idea.md — raw before activation. When the brief in Section 4 is complete, activate Greg to begin the full Discovery phase.*
