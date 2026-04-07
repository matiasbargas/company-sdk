# company-sdk

> You've always needed a team. Now you have one.

```bash
npm install -g company-sdk
sdk-init my-product --squad startup --idea "Burn rate tracker for solo founders"
```

---

20+ role-based AI agents — CEO, CLO, CISO, CTO, CFO, CMO, PM, Designer, Engineers — that work together from idea to shipped product. Each has a defined scope of authority, a skill level, and a protocol they all share.

**Two modes:**

**Project Mode** — activate a full team for a specific build. Every decision logged. Every gate checked. Git-native: commits, tags, and releases are events the framework reads and responds to.

**Consultation Mode** — ask any specialist a standalone question. The agent spawns 1–3 peer consultations to pressure-test the answer before responding.

```
/ask CTO should we build this in-house or use a managed service?
/ask CLO what does GDPR actually require for behavioral analytics?
/ask what's the right data model for a multi-tenant SaaS?
```

---

**The thing other frameworks miss:** legal and security review happens before architecture begins. Machine-enforced. The CTO cannot activate until CLO and CISO have delivered. That is when those reviews should happen. This is the only framework where they do.

**Agents that push back.** Every agent has a professional obligation to dissent when something is wrong. Agreement without examination is abdication. The friction is the feature.

**Memory that outlives the conversation.** Six months after shipping, you can explain every decision — what was decided, why, who approved it, whether it's reversible. `history.md` answers the audit question before the audit happens.

---

## Quick start

```bash
npm install -g company-sdk

sdk-init my-saas --squad startup --idea "your raw idea here"
```

Open `my-saas/idea.md`, complete Section 4, and say:
> "Hey Greg — [paste the brief]"

Greg activates the team. The protocol handles the rest.

---

## Squads

| Squad | Agents | Best for |
|---|---|---|
| `startup` | 20+ | New product — legal, security, finance, and market context before you write a line of code |
| `mvp` | 10 | Move lean, add coverage later |
| `feature` | 3 | Scoped feature on an existing product |
| `website` | 6 | Landing page or marketing surface |

---

## Who it's for

Founders, technical leads, and senior engineers building products in 1–10 person teams. Especially useful in regulated industries — fintech, healthtech, legaltech — where compliance is architecture, not a checklist.

---

*company-sdk — 20+ roles · 4 squads · protocol v3.3 · 6 CLI tools*
