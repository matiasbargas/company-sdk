# Idea: sdk-v3
**Status:** In Discovery
**Created:** 2026-04-06

---

## 1. The Idea

Teams install team-sdk and nothing changes. The files exist. The protocol is written. The agents are capable. But every Monday morning someone still asks "where are we?" and every sprint still starts with twenty minutes of re-explanation. The framework is present. The culture never arrived.

v3 is not more features. v3 is the version where the SDK becomes unavoidable — where documentation is enforced by code, where GitHub and the framework finally meet, where the non-technical co-founder can run one command and know exactly what's happening without asking anyone. The goal is autocatalysis: the SDK starts running the team instead of the team running the SDK.

---

## 2. The Story

### The person this is for

It is Tuesday afternoon. She has been running this team for fourteen months.

She opened the sprint with three engineers, a PM, and a shared understanding of what they were building. That was six weeks ago. Since then: two context resets, one engineer replaced, a compliance question that got answered verbally in a Slack thread nobody can find, and an architecture decision she is now pretty sure was made the wrong way.

She is not incompetent. She is not lazy. She installed team-sdk in a moment of clarity — the day she realized their velocity was collapsing under the weight of things nobody had written down. The files are there. `history.md` exists. Nobody reads it. The last entry was from three months ago.

She asks her lead engineer "where are we?" every Monday. He summarizes. She nods. He goes back to his desk. Neither of them says what they both know: this is a tax they will pay forever, because nothing is forcing the memory to compound.

### The problem

The problem is not that teams don't want to document. The problem is that documentation has no cost when it doesn't happen.

Miss a standup — someone asks where you were. Skip a code review — the PR sits. Don't write to `history.md` — nothing happens. The ledger stays empty. The sprint ships. The decision evaporates. Six months later, someone makes the same call, worse, with no context.

The SDK exists as evidence of process, not as process itself. It was installed. It was not adopted.

Four failure modes, every time:

Documentation is performative. `history.md` is a file that proves the team cares about documentation. It is not a living record. The person who wrote the last entry is the only person who could find it again.

GitHub is a parallel universe. Issues are created by engineers, for engineers. PRs get merged. None of it flows into the framework. The SDK does not know what shipped last sprint. The actual work and the framework have never been in the same room.

Versioning dies under pressure. "We'll do it properly when we have time." That means never. The release ID in `current-status.md` is from the quarter before last. Nobody has noticed.

The CLI is an engineering tool. The non-technical owner cannot run `sdk-gate-check`. They do not know what it does. They are locked out of the operating system they are supposed to own. They ask their lead engineer what is happening. He tells them. This relationship — founder dependent on engineer for operational visibility — is the quiet failure at the center of every team that adopts v2 and does not reach catalysis.

### What "solved" looks like

It is a different Monday morning. Same team. Different system.

She opens her laptop. She runs `sdk-status`. In twelve seconds she knows: Sprint 4 is in progress. Two missions are active, one is blocked on a CISO decision about token scope. The CTO deployed the auth module Thursday and the ticket closed automatically. The next agent to activate is the PM, who is waiting on her to approve the scope change.

She approves it. She did not ask anyone. She did not interrupt anyone's morning. The framework told her where things stood and what it needed from her.

When the new engineer joined last week, she read `current-status.md` and `history.md` and was oriented in forty minutes. She asked her senior counterpart one question. Not thirty.

When the CLO asked last month whether the auth model had been reviewed against GDPR, the answer was in `history.md` — dated, attributed, with the reasoning intact. The framework answered the audit question before the audit happened.

The team has reached catalysis. Agents document because not documenting has a visible cost. The release gate fails if `history.md` is incomplete. The team does not experience this as bureaucracy. They experience it as the SDK keeping them honest — a guardrail, not a gatekeeper. The behavior has become self-reinforcing. The SDK is running the team.

### What makes this different

The only framework where legal and security review is architecturally enforced before the CTO begins. Not a checklist. Not a reminder. A gate — `sdk-gate-check` fails until CLO and CISO have delivered. Architecture that starts before that gate is unreviewed architecture. Every other framework lets you skip this. This one does not.

The only framework built on a human agency mandate. The Three Laws are not guidelines bolted on for optics. They are constraints that change what agents produce. An agent that creates dependency has violated the First Law regardless of how polished the output looks. Every agent is designed to leave the humans who work with them more capable than it found them — not passive, not dependent.

The only framework that engineers cultural diversity into the team by design. Names from Lagos, Aarhus, Kampala, Montevideo, Colombo. Cultural profiles that shape how agents reason about risk, hierarchy, and craft. A CLO named Fatima Nairobi and one named Lena Oslo are not the same agent. That difference produces friction before convergence. The friction catches monoculture failures before they ship.

The first framework where the team has organizational memory that compounds. Not task trackers. Not activity logs. A decision record — `history.md`, area logs, `team.md` — that survives every context reset, every new hire, every Monday morning, because it was written to be found.

### What I'm most uncertain about

Enforcement friction. The line between "this is your guardrail" and "this is your bureaucracy" is thin. The advisory-during-sprint, blocking-at-release-close design is the best answer to this so far. It might still be wrong. Teams that feel managed by their tooling do not reach catalysis — they remove the tooling.

Catalysis rate. Genesis is easy to measure. Teams install the SDK. Files appear. The catalysis conversion — the moment the team starts running the SDK on themselves without being prompted — is what we cannot measure yet. We do not know what triggers it. We are building toward a behavior change we cannot see until it happens.

The naming convention bet. Cultural diversity between agents produces better decisions. We believe this. We cannot prove it to a team that wants the fastest possible path to output. The bet is that diversity of reasoning style compounds in ways that look invisible until they suddenly are not.

---

## 3. Sharpen Before You Build

Use these before activating the full team. Stop when the idea is clear enough to write the brief.

**The problem:**
> "I'm building [one-line description]. The core problem I'm solving is [problem]. Challenge this. What am I probably wrong about? What am I not seeing?"

**The customer:**
> "My target user is [description]. What is their specific Tuesday afternoon like? When would they actually use this? What would they have to believe to tell a colleague?"

**The differentiation:**
> "Someone already solves [problem] with [existing solution]. What would have to be true about my solution for the switch to be obvious — not logical, obvious?"

**The appetite:**
> "What is the smallest version of this that would be meaningfully better than nothing? What is the minimum that would make someone's Monday morning different?"

**The non-negotiables:**
> "If I'm building [idea] for [user], what absolutely cannot be wrong? What would destroy trust immediately if broken?"

**The brief:**
> "Based on what we've discussed, write a 1-page mission brief: the problem, the user, what solved looks like, the appetite, what's out of scope, and the riskiest assumption."

---

## 4. Brief for Greg (CEO)

```
Hey Greg — here's a new project brief.

Idea: sdk-v3

The problem:
Teams adopt team-sdk at genesis but don't reach catalysis — documentation is optional in practice,
GitHub is invisible to the framework, versioning is a convention nobody enforces, and the only people
who can use the CLI are engineers. Owners (founders, PMs) are locked out of their own operating system.

The user:
A technical founder or PM running a 3-8 person product team. They've tried the SDK and have the files,
but the team still uses Slack for decisions, Notion for docs, and nobody reads history.md.
They want the SDK to be "how we work" — not "a thing we installed."

What we're building:
team-sdk v3: a version where documentation is mandatory and machine-enforced, GitHub is a first-class
integration (issues ↔ missions, PRs ↔ tickets, releases ↔ history.md), versioning is a CLI command
not a convention, and the owner-facing scripts feel like YC's onboarding playbook — clear, guided,
opinionated. Every project always has "the last picture": a single source of truth a human or agent
can read to know exactly where things stand.

What winning looks like at 18 months:
Teams that adopt sdk-v3 complete at least one full Discovery → Execution cycle with all documentation
gates satisfied. At least 10 public "this is how we work now" stories. Owners run sdk-status and
sdk-ship without needing engineering help. GitHub integration is the default, not a plugin.

What I'm NOT doing:
- Building a SaaS or hosted product (this stays a CLI + file system)
- Replacing GitHub or Linear (integrating with them, not competing)
- Supporting non-GitHub VCS in v3 (GitLab, Bitbucket deferred)
- Adding AI inference to the scripts (scripts stay deterministic)

Biggest risk:
Documentation enforcement creates friction that makes the SDK feel bureaucratic, not generative.
The gate-check model that works for CLO+CISO might feel punitive if applied to area logs.
We need enforcement that feels like a guardrail, not a gatekeeper.

Constraints:
- Budget: bootstrapped, no external spend
- Timeline pressure: we want a working v3 before any public case study
- Legal/compliance: SDK itself ships MIT, no user data, no PII
- Tech constraints: Node.js >=18, no new runtime deps unless clearly justified
```

---

## 5. Requirements Skeleton

### Product
- Core user story: As a non-technical owner, I want to run `sdk-status` and get a complete picture of where my sprint stands — blockers, progress, open decisions, next action — without needing to ask anyone on my team.
- Success metric (near): Owner runs `sdk-status` solo, without engineering help, within 2 weeks of activation.
- Success metric (long): At 18 months, 10 public "this is how we work now" stories from teams using sdk-v3, verifiable and attributable.
- Out of scope: SaaS layer or hosted product. Non-GitHub VCS (deferred to v4). AI inference inside scripts (scripts stay deterministic). Replacing GitHub, Linear, or Notion. Any native mobile surface.

### Technical
- Stack: Node.js >=18. No new runtime dependencies without explicit written justification and CEO sign-off. All scripts deterministic — no AI calls inside CLI commands.
- Integration: Git-native (local git operations — commits, branches, tags). GitHub for: releases ↔ history.md (`sdk-github release`), tags ↔ versioning, GitHub Actions for gate-check CI. No GitHub Issues sync — the framework does not create external state. Auth: fine-grained PAT for GitHub API calls — CISO decision made, logged in history.md.
- Data: Local filesystem only. User's authenticated GitHub account. No PII collected. No remote storage. No telemetry. No analytics. All file operations are local and visible to the user.

### Legal / Compliance
- User data: None. No PII. No remote data collection or processing of any kind. The SDK reads and writes files on the user's own machine and calls GitHub's API with the user's own credentials. Nothing leaves the user's environment except what the user explicitly pushes to GitHub.
- Regulated industry: No. No GDPR, HIPAA, PCI-DSS, or SOC 2 scope for the SDK itself. Teams using the SDK in regulated industries are responsible for their own compliance posture — the framework supports that but does not certify it.
- Contract requirements: GitHub API Terms of Service compliance (CLO reviewed and cleared). MIT license (established). Standard npm package distribution. No third-party vendor agreements required for v3.

### Financial
- Revenue: None in v3. Open source, MIT. Distribution compounds through community — public case studies and GitHub stars create the distribution surface for whatever comes after v3.
- Cost: Bootstrapped. Owner's time plus npm registry (free for open source packages). Any external spend requires CEO sign-off before commitment.
- Budget: Zero cash.

---

*idea.md — Discovery active. Brief delivered to Greg. Phase 1 complete. CTO architecture brief in progress.*
