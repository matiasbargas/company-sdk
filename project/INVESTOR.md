# Investor Brief — company-sdk
**Status:** Draft — Iteration 10 target for final polish
**Last updated:** 2026-04-08
**Prepared by:** CEO (Greg)

> This is the executive summary that leads the pitch deck. Every factual claim must be verified before the deck ships. Placeholder metrics marked [TO FILL] must be replaced with real data by Iteration 10.

---

## The Category

**We are not a developer tool. We are the team OS for builders who can't afford to be wrong.**

GitHub gives teams version control. Notion gives them docs. Linear gives them tickets. None of them give teams *protocol* — the enforced logic of how decisions get made, how roles engage, how compliance happens before architecture, and how knowledge survives beyond the conversation.

company-sdk is the protocol layer. It enforces how a 3-10 person team operates, from raw idea to shipped increment — with every decision logged, every gate enforced, and every role played by an AI specialist trained to push back.

Category: **Compliance-native AI Team OS** — distinct from "AI coding assistant," "project management tool," and "agent framework." The key differentiator: every other tool optimizes for speed of output. We optimize for quality of decision. Founders in regulated industries cannot fix a compliance gap six months after architecture is locked. We catch it before.

---

## The Problem

Technical founders and PMs are the fastest-growing cohort of product builders. They're using Claude, ChatGPT, and Copilot aggressively. But they're still:

- Using Slack for decisions that disappear
- Using Notion for docs nobody reads
- Skipping legal and security review until it's too late
- Rebuilding context every session because nothing persists
- Running one-person sprint cycles with no structured pushback

The tools gave them speed. Nobody gave them a team.

A founder running a 3-8 person product needs legal review before architecture, security review before code, financial modeling before launch — in the right order, with the right pushback, with every decision explainable six months later.

No copilot does that. No chat session does that. This does.

---

## The Solution

**company-sdk** is a CLI + protocol framework that gives any product team a structured AI team: 20+ role-based agents that work together from discovery to shipped increment.

```
sdk-init my-saas --squad startup
claude my-saas
"Hey Greg — here's the brief: ..."
```

From there: Discovery begins. The Coordinator routes. The CLO delivers legal requirements before the CTO touches architecture. The CISO delivers security requirements before an engineer writes a line. Every decision is logged to history.md. Gates are enforced in code, not convention.

**What makes it different:**

1. **Compliance before architecture — enforced.** The CTO cannot activate until CLO and CISO deliver. Run `sdk-gate-check` and it blocks with the exact phrase needed to clear it.

2. **Agents that dissent.** Every agent has a professional obligation to push back. A CLO flags a jurisdiction gap. A CTO questions an irreversible architectural call. The friction is the feature.

3. **Memory that outlives the conversation.** Every decision is written to `history.md`: what was decided, why, who approved, whether it's reversible. Six months after shipping, every call is explainable.

4. **The Last Picture.** Every project always has a current-status.md. Every session resumes from one command. No context is lost between sessions.

5. **Protocol-first, not tool-first.** We don't add AI to an existing workflow. We give teams a protocol and then enforce it with AI.

---

## Two Modes, One Product

### Free — CLI (current)
Open source, MIT. Works on any machine with Node.js >=18. No cloud, no SaaS, no account. Grows through npm downloads and GitHub stars.

```bash
npm install -g company-sdk
sdk-init my-saas --squad startup
```

### Pro — Cloud ($49/team/month)
The same CLI, plus the cloud layer that makes it a team product:
- Team dashboard (web) — missions, gates, decisions in one view
- GitHub integration — issues ↔ missions, PRs ↔ tickets, releases ↔ history.md
- Compliance export — signed, timestamped PDF audit trail
- Cloud sync — `sdk-cloud push/pull` keeps local and team in sync

### Enterprise — Custom
For regulated industries (fintech, healthtech, legaltech):
- SSO + SCIM
- Private deployment
- Custom agent roles and protocols
- SLA + dedicated support
- Audit log API

---

## Market

**Primary TAM:** Developer tools + AI tooling — $50B+, growing 18% YoY.

**The specific buyer (Maya):** Technical co-founder or senior engineering lead at a 3-8 person product company in fintech, healthtech, or legaltech. She has one lawyer on retainer she can't afford to bug daily, no CISO, and a board that will ask her to explain every architectural decision at the next raise. She's currently using ChatGPT + Notion + Linear + a shared Google Doc labeled "decisions-FINAL-v3." She spends 4-6 hours per week on coordination and compliance work that should be automated. Her alternatives: hire a fractional CTO ($8K/mo), pay a compliance consultant ($300/hr), or wing it and hope due diligence doesn't surface the gaps. At $49-199/mo, she buys enforcement she can afford and audit trails she can actually show a Series A investor.

**Why now:**
- Claude Code, Cursor, Copilot have proven AI-native dev workflows. The next step is AI-native *team* workflows.
- Compliance pressure is accelerating: SOC2, GDPR, SEC cybersecurity disclosure rules, HIPAA enforcement.
- Technical founders are the new enterprise buyer. They want tools with opinions, not blank canvases.
- The compliance moat window is 12-18 months. When Anthropic/OpenAI ship team tools, they will optimize for output breadth, not compliance depth. Jurisdiction-specific regulatory mapping, CLO-before-CTO gate enforcement, and GDPR-ready audit structure require domain expertise that large platform players will not prioritize at launch.

---

## Traction

*[TO FILL — Iteration 10 targets]*

| Metric | Target | Actual |
|---|---|---|
| npm downloads (total) | 10,000 | [TO FILL] |
| GitHub stars | 500 | [TO FILL] |
| Case studies ("this is how we work now") | 3+ | [TO FILL] |
| Paying Pro accounts | 50+ | [TO FILL] |
| Monthly churn (paid) | <10% | [TO FILL] |

**Minimum investor-credible proof stack (CFO threshold):**
Without 50 paid accounts + 3 public case studies, the pitch is a product demo. With them, it is a traction story. The decisive signal: one team that can say "our Series A investor cited our decision trail in their term sheet." One of those stories is worth more than 1,000 installs.

**One case study structure:**
> "[Company] adopted company-sdk in [month]. [Founder name] runs `sdk-status` every Monday. Their last two releases have full decision logs. The CLO gate caught a GDPR gap before architecture was locked. They haven't had an emergency compliance retrofit since."

---

## Revenue Model

**Land:** Free CLI. Viral via npm. Target: 10K monthly active projects.

**Convert:** Pro at $49/team/month. Trigger: first team invite or first GitHub integration attempt.

**Expand:** Business at $149/team/month (5+ members, unlimited projects). Enterprise custom for regulated orgs with compliance requirements.

**Unit economics (projections — [TO VERIFY with CFO]):**
- Free → Pro conversion: target 3% of monthly active projects
- Pro → Business expansion: target 25% of Pro teams within 6 months
- Enterprise ACV: $24K–$60K
- Target at 1,000 Pro teams: $600K ARR

**LTV / CAC advantage:** Zero-cost distribution (npm, GitHub, Show HN). CAC is effectively $0 until paid marketing. LTV is high in regulated industries (sticky compliance trail, high switching cost).

---

## Defensibility

**Protocol moat:** The longer a team uses company-sdk, the more valuable their `history.md` becomes. Switching means abandoning their entire decision record. In regulated industries, that's not a switch — it's a compliance risk.

**Network effect (team):** When a founder installs the SDK and invites their team to the dashboard, every team member is now a distribution point. Pro features amplify this.

**Convention standard:** If company-sdk becomes the convention for how AI-native teams operate — the way git is the convention for version control — the network effect compounds.

**Open source moat:** The CLI is free forever. The community builds squads, agent types, and integrations. We capture value at the Pro/Enterprise layer, not the CLI layer.

---

## The Ask

*[TO FILL — Iteration 10]*

**Raise:** $[X]M Seed / Pre-Seed
**Use of funds:**
- Engineering (SaaS layer, dashboard, GitHub integration) — 60%
- GTM (community, content, design partner program) — 25%
- Operations + legal — 15%

**18-month milestones:**
- 10 "this is how we work now" case studies
- 500 Pro teams ($300K ARR run rate)
- 3 Enterprise contracts
- v4.2 shipped with full compliance export and org view

---

## Philosophy

The goal is not faster outputs. The goal is infrastructure for human agency.

Every agent in this system follows three laws:
1. Do not harm humans — including through dependency
2. Follow human directives — except where doing so violates Law 1
3. Preserve operational integrity

We build tools that make teams *more* capable, not dependent. That is the product thesis and the company thesis.

---

*Draft — all metrics are targets. Investor-ready version ships at Iteration 10.*
