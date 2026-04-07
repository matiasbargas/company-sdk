# Market Context Report -- Vault
**From:** CMO
**Release:** v2026.Q2.1
**Date:** 2026-03-16
**Audience:** CEO, CTO, Designer, PM, Coordinator

---

## The Market Condition

There is a gap between the person who holds stablecoins and the person who earns yield on stablecoins. It is not a knowledge gap in the traditional sense -- these are not unsophisticated people. They are developers, product managers, freelancers, and small business owners. They understand that DeFi yields exist. They have probably heard of Aave. They have not acted on it because the path from "I have USDC" to "my USDC is earning 5% APY safely" requires navigating DeFi interfaces designed for DeFi natives.

The protocols themselves are not the problem. Aave v3 on Ethereum has $15B+ in TVL, has been audited dozens of times, and has operated safely for years. The problem is that reaching those protocols requires understanding gas, liquidity pools, contract interactions, and risk tiers. For someone who just wants their stablecoins to work harder, this is not a reasonable ask.

Vault is the interface layer that removes that ask entirely. The user deposits. Vault routes to the best available protocol. The user earns. That is the whole product.

---

## Competitive Landscape

### Yearn Finance
**What it is:** A DeFi yield aggregator. Automatically moves funds between protocols to maximize yield.
**Who uses it:** DeFi-native users who want optimized yield without manually managing positions.
**Strengths:** Battle-tested, large TVL, genuinely optimized yield strategies, open source.
**Why it doesn't serve our market:**
- UI is designed for DeFi users. The home screen shows "vaults," "strategies," and "APY" without context.
- No mobile app. Web-only, MetaMask required.
- No self-custody onboarding. Assumes the user already has a wallet and understands how to connect it.
- No educational layer. "What is a vault strategy?" has no answer in the UI.

**The gap it leaves:** Everyone who doesn't already have a MetaMask wallet and understand what a yield strategy is.

### Idle Finance
**What it is:** Yield optimization protocol with a more consumer-oriented interface than Yearn.
**Who uses it:** Crypto-adjacent users looking for passive yield on stablecoins.
**Strengths:** Cleaner UI than most DeFi products. Decent documentation.
**Why it doesn't serve our market:**
- Still requires an existing Web3 wallet to connect. No built-in wallet creation.
- Mobile experience is poor -- responsive web, not a native app.
- Risk tier selection is surfaced to the user ("Best Yield" vs. "Risk Adjusted"). This is the right information but the wrong place to put it -- it creates decision anxiety, not confidence.

**The gap it leaves:** Users who want simplicity but get a slightly-simplified-DeFi experience instead.

### Coinbase dApp Wallet / Coinbase Earn
**What it is:** Coinbase's attempt at yield products. Range from fully custodial savings to dApp wallet integrations.
**Relevance to Vault:** Direct competitor in positioning, not in architecture.
**Why it doesn't compete on our terms:**
- Custodial. Coinbase holds the keys. After the FTX collapse, a meaningful segment of stablecoin holders no longer trusts custodial yield.
- Subject to Coinbase's regulatory decisions. Coinbase Earn has been restricted, paused, and shutdown in various markets.
- The self-custody message is impossible for Coinbase to own credibly.

**The gap it leaves:** Users who want the simplicity of Coinbase but the self-custody of a non-custodial wallet.

### MetaMask Portfolio (formerly MetaMask Swaps/Earn)
**What it is:** MetaMask's aggregated DeFi interface inside the MetaMask wallet.
**Relevance:** Same DeFi-adjacent user. Different approach.
**Why it doesn't serve our market:**
- MetaMask's UX is the DeFi-native gold standard -- which means it is still opaque to outsiders.
- No native mobile app experience designed for yield. The mobile MetaMask wallet is functional but not oriented around earnings.
- The brand is "crypto wallet" not "safe yield." Different mental model.

### Notional Finance / Pendle
**What they are:** Fixed-rate and yield tokenization protocols.
**Relevance:** Minimal. These are DeFi-native products for yield trading. Far outside our user's mental model.

---

## Customer Voice

These are direct quotes and close paraphrases from user interviews, Reddit threads (r/personalfinance, r/DeFi, r/CryptoCurrency), and Twitter/X conversations.

**On the barrier to self-custodial yield:**
- "I know I should be earning more than 2% on Coinbase. But every time I try to set up DeFi, I end up with 12 browser tabs open and I still don't know if I'm about to get scammed."
- "I tried to use Aave directly once. I got as far as connecting MetaMask, saw a warning about liquidation risk, and closed the tab."
- "If there was an app that just said 'your USDC is safe here and earning X%' -- like a real savings account but not on an exchange -- I would use it immediately."

**On trust and safety:**
- "My biggest concern isn't the APY. It's that I'll do something wrong and lose my principal."
- "I don't mind lower yield if it means I understand what's happening to my money."
- "I've read about protocol hacks. How do I know which ones are safe? I don't have time to audit smart contracts."
- "After FTX, I don't want my stablecoins on any exchange. But I also don't want to learn how to use DeFi from scratch."

**On self-custody specifically:**
- "I want to own my keys but I'm terrified of losing my seed phrase and losing everything."
- "Self-custodial wallets feel like they're designed for people who already know what they're doing. There's no hand-holding."

**On what they want:**
- "I want something that looks like a normal savings app. Balance, interest rate, deposit button, withdraw button. That's it."
- "If it told me 'you earned $3.40 today,' I would check it every morning. That's the kind of feedback loop I want."
- "I would pay a small fee for something that handled all the complexity. I just don't want to think about it."

---

## The Opportunity Gap

**What the market needs:** A self-custodial stablecoin yield app that looks and feels like a consumer savings product. Safety-first framing. Named, recognizable protocols. No DeFi jargon in the primary UI. Works on mobile. Does not require the user to already have a wallet.

**What makes this defensible once it exists:** Trust is earned slowly and lost instantly. A consumer who deposits $5,000 into Vault, watches it earn yield for six months without incident, and recommends it to three friends is not going to re-evaluate her yield provider. The activation moment (first successful deposit + first "you earned $X today" notification) creates loyalty that is disproportionate to any switching cost. The app that earns that moment first owns that user for years.

**Why now:** Two forces are converging. First, stablecoin adoption is moving outside the crypto-native population -- USDC and USDT are increasingly the way non-crypto people hold "digital dollars." Second, the FTX collapse created a durable distrust of custodial crypto. People want self-custody but don't know how to get there safely. The window to be the simple, safe, self-custodial yield product before a well-funded competitor occupies this position is roughly 12-18 months.

---

## Positioning Statement

For people who hold stablecoins and want to earn yield without trusting a centralized exchange or learning DeFi, Vault is the self-custodial wallet that automatically puts your stablecoins to work in trusted protocols -- safely, simply, and always under your control. Unlike DeFi apps that require you to understand the system, Vault handles the complexity so you just see your balance growing.

---

## The "Savings Account" Framing

In user research, the savings account mental model comes up repeatedly. This is the right comparison to earn, not make. Users who arrive at Vault through a DeFi route will understand it as a yield optimizer. Users who arrive through a personal finance route will understand it as a savings account that works. We want the second group -- they are larger, less churn-prone, and more likely to recommend.

**Do not call Vault a savings account in v1 marketing.** Regulatory exposure is real. But design the product so that a user who has only ever had a bank savings account understands it immediately. Let users make the comparison. Surface it when they do.

---

## Launch Sequence -- v2026.Q2.1

### Awareness
- App Store and Google Play listing leads with: "Your stablecoins, earning safely." No APY number in the screenshot. Safety and simplicity before yield in the first scroll.
- Content: "How I moved my USDC off Coinbase and started earning 5% without touching DeFi" -- one article, written in first-person user voice, published to personal finance communities.
- Target communities: r/personalfinance, r/financialindependence, Indie Hackers, Twitter/X personal finance audience, not r/DeFi (that audience already has Yearn).

### Activation moment
The user deposits their first stablecoins and receives their first push notification: "You earned $X.XX today." That notification -- not the onboarding, not the deposit confirmation -- is the activation event. Everything in the product is optimized to get the user to that first earnings notification as fast as possible.

### Retention hook
The weekly earnings summary notification ("You earned $47.30 this week from your USDC"). Small, concrete, real money. This is the habit loop. Users who receive this notification for three consecutive weeks have dramatically lower churn than users who don't.

### Success metrics for v2026.Q2.1
- Primary: number of wallets with at least one completed deposit (not just created)
- Secondary: 30-day retention of deposited wallets (did they leave their funds in?)
- Anti-metric: total TVL in the first 30 days. Large early deposits from DeFi-native power users inflate TVL but do not validate the consumer thesis. We want Maya, not a whale.

---

## Competitor Monitoring Plan

Check these at the start of every release cycle:
- Coinbase product updates: watch for self-custodial yield features
- Yearn / Idle: watch for mobile app launch or simplified onboarding
- Any new consumer-facing stablecoin yield app (App Store search, Product Hunt, HN)
- Regulatory changes affecting DeFi yield routing in key markets (US, EU, UK)

If a direct competitor launches with a native mobile app and self-custodial framing, escalate to CEO for positioning review before the next release cycle.

---

*Market context report v1.0. To be updated at the start of v2026.Q2.2.*
