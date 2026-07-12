# CRO panel score — christensen-disruption__regulated-enterprise

**Role:** CRO (M3)
**Lens:** revenue model, GTM motion fit, pricing power, deal velocity, expansion shape, sales-team scalability
**Date:** 2026-06-14

## Viability from CRO domain — 5/10

I would not sign off on the team executing this direction as currently described. Not because the foothold is wrong — the non-consumption thesis is sound — but because the **revenue motion described is two motions in one trench coat**, and the file does not name which one I'm being asked to build.

What the alternative actually proposes:

1. **Bottom-up dev/MLOps PLG**: open-source core, evidence-export adapters, land in one pod. This is a community-led adoption motion with $0-$10K self-serve revenue per team. My CRO playbook here is dev-rel, package registry presence, GitHub discovery, conference talks. Deal velocity: weeks. Sales team: one DevRel hire, no AE.
2. **Per-team paid framework-mapping packs + per-seat enterprise tier**: this is **mid-market SaaS with regulated-compliance positioning**. Required motion: solutions consulting, security review support, procurement enablement, partner co-sell with MRM consultancies, customer success for renewal. Deal velocity: 4-9 months once it surfaces. Sales team: AE + SE + CS + partner manager.

These are not the same revenue org. The transition from (1) to (2) is the single most expensive moment in a PLG-to-enterprise journey, and the file treats it as if it happens organically when "the CISO discovers the substrate is already producing audit evidence." That moment is real, but it is the *start* of the hard work, not the end of it. A CRO building this needs a documented PLG-to-enterprise handoff playbook before first paid expansion — and we do not have one to copy from a competitor in this category because no competitor has done this exact move in this exact segment.

**The pricing power question is also unresolved.** Per-team framework-mapping packs sound like reasonable SKUs until you ask: who validates the mapping? If we say "this evidence pack satisfies EU AI Act Article 12," we are making a regulatory claim — which means either (a) we are not actually saying that, and the pack is just structured logs (commodity pricing, $5-20K/year ceiling), or (b) we are saying that, and we need a MRM consultancy or Big-4 firm to co-sign every pack (margin compression + slow deal cycles + indemnification exposure that the CLO should weigh in on). The file does not resolve which one this is, and the answer changes ACV by 5-10x.

**Deal velocity is the hidden killer.** The wedge promises sub-quarter signal because PLG bypasses procurement. True for the *bottom* of the funnel. False for the *revenue* of the funnel. Per-team paid packs at >$10K still require a PO, which still routes through procurement, which still triggers vendor security review in regulated enterprises — even when the buyer is the ML platform lead. I have seen this pattern destroy "bottom-up disruptors" in BFSI three times: the engineer loves it, the procurement gate eats the deal in month 5, and by month 9 the ML lead has rolled their own version because their compensation is tied to shipping models, not to closing a SaaS purchase.

**Sales team scalability is the second hidden killer.** A CRO scaling this motion to 50 paying teams by Dec 2027 needs to know: do reps sell to ML platform leads (a population of ~3-5 per regulated enterprise, ~4,000 leads globally, individually identifiable on LinkedIn but allergic to outbound), or to compliance officers (a population of ~10-20 per enterprise, easier to reach but the file explicitly says we are *avoiding* them)? The first population is sellable but not scalable through traditional outbound — it requires DevRel and content. The second is scalable through traditional outbound — but is the wrong buyer per the strategy. **You cannot hire a scalable sales motion for the first population in 18 months**, and that is the segment's central CRO constraint.

What would move this from 5 to 7+: a concrete answer to "which motion do we build first, what is the trigger to layer in the second, who specifically do the first three AEs call on, and what is the revenue ceiling of the bottom-up motion before we are forced to surface upward?" None of this is in the file.

## Market growth potential from CRO domain — 7/10

The market is real and timed correctly. EU AI Act enforcement begins August 2026 (general-purpose AI obligations) with full applicability August 2027 (high-risk systems). DORA goes live January 2025 and the first ICT-risk supervisory examinations land in 2026-2027. NYDFS Part 500 Amendment 2 took effect November 2024 with phased deadlines through 2025. FDA's GMLP and the Predetermined Change Control Plan guidance create concrete documentation demands for SaMD ML models that are currently met with binders of screenshots. The wave is forcing a category of work — "team-level epistemic trail for ML/data decisions" — to become a real budget line for the first time.

But I take a point off the alternative's self-score of 8 for two CRO-specific reasons:

1. **The buying motion is split across two budgets that don't talk to each other.** ML platform budget (which the alternative correctly targets bottom-up) is real but small — typically $200K-$2M/year per enterprise, mostly compute and tooling. Compliance/GRC budget is large ($5M-$50M+ for SR 11-7 model risk programs at Tier-1 banks) but the file explicitly avoids it. The growth potential from the *targeted* budget is meaningfully smaller than the total market wave suggests. The growth potential I'd score for "regulated enterprise AI governance market" globally is a 9. The growth potential I'd score for "what this specific GTM motion can capture from that wave" is 6-7.

2. **The expansion shape is structurally unfavorable for SaaS multiples.** Per-team expansion within an enterprise looks attractive on paper (multiply by N pods) but in regulated orgs the second pod requires re-running the security review, the third pod requires architecture council review, the fourth requires a Center of Excellence sign-off. Net dollar retention for this pattern historically clusters at 110-125%, not the 130-150% that funds a strong PLG-to-enterprise CAC payback. Land velocity is good; expansion velocity is mediocre. This is a CRO-domain pattern I have not seen the file address.

## Risk not named by the alternative

**The "compliance officer co-opts or blocks" risk the file admits is actually a pricing/budget reroute risk that determines our entire pricing power, and the file frames it only as an existential blocker.**

Here is the CRO-specific risk: when the substrate surfaces upward and the CISO discovers it, the most likely outcome is **not** that they kill it. The most likely outcome is that they **insist on procuring it through the GRC budget instead of the ML platform budget**. This sounds like good news (bigger budget!) but it is structurally bad news for our revenue model because:

- GRC procurement compares us to Archer, ServiceNow GRC, OneTrust, AuditBoard — and we lose every feature checklist comparison because we are not a GRC platform, we are an operating substrate. Our $30K/team/year price is a rounding error to a GRC budget *and* an insult to a GRC vendor's per-platform pricing — so the GRC team will demand we either be priced like a GRC add-on ($5K) or be a feature inside their existing GRC platform (zero, via M&A or partnership).
- The original ML platform buyer loses the relationship the moment GRC takes over — and our entire PLG retention motion was built around the ML lead being our champion. When the champion's budget is no longer paying, the champion stops championing.
- Worst case: we become a line item in a Big-4 advisory engagement, billable through their consulting fees, with margin compressed to 15-25% of recognized revenue.

The mitigation is non-obvious: we need a **dual-SKU pricing architecture** that explicitly prices the ML platform value separately from the compliance evidence value, with the ML platform SKU large enough (>$25K/team/year) that it survives procurement on its own merits before the GRC budget gets involved. The file's mention of "per-team evidence-export and framework-mapping packs" treats this as one SKU; it must be two, sold in sequence, and the CRO who builds this needs to know that before the first 10 deals — not after the first GRC officer discovers the substrate.

## Upside undersold by the alternative

**The MRM consultancy partnership is buried as "last-mile mapping" — it is actually the highest-margin, highest-velocity expansion channel in this entire segment, and the file underestimates it by an order of magnitude.**

Model Risk Management consultancies (the MRM practices at Deloitte, KPMG, EY, PwC, plus specialist boutiques like Protiviti, Crowe, Treliant, RMA, and a long tail of 50+ regional MRM advisory shops) currently make $400K-$2M per engagement helping BFSI and pharma clients assemble SR 11-7 / EU AI Act / FDA SaMD documentation **by hand**. That is the actual current spend in this market. They are doing this work in Word, Excel, SharePoint, and Notion *today* — and they hate it because the margin on manual evidence assembly is collapsing as clients push back on hours billed for what is increasingly seen as commodity work.

For these consultancies, team-sdk's Layer B + §32 ledgers are not a "last-mile mapping" problem. They are **the productivity tool that lets a partner-led MRM practice double engagement margin without raising prices** — by automating 40-60% of the evidence-pack assembly that currently consumes junior staff hours. From a CRO perspective, this means:

- **Resale margin negotiations get easy.** A consultancy paying $50K/year for unlimited client substrates and reselling at $250K-$500K per engagement happily gives us 20-30% of the resale value as recognized revenue, because the productivity uplift on their billable hours pays for our list price 5x over.
- **Deal velocity inverts.** Instead of us selling to ML platform leads and waiting for upward surface, the MRM consultancy *brings us into the room* on a Day 1 implementation as part of their engagement. Cycle goes from 6-9 months to 6-9 weeks because we are inside an already-procured Big-4 SOW.
- **The 50-team winning condition becomes 5 MRM consultancy partnerships.** Each partner running 10 engagements with team-sdk embedded equals 50 paying teams. This is a fundamentally different sales motion than the file describes — and a fundamentally easier one to staff (5 partner managers vs 15 AEs).

The file describes MRM consultancies as a partnership "for last-mile mapping" — a *feature delivery* relationship. I am telling you they are the **primary channel**, possibly the *only* channel that hits the winning-condition math inside 18 months. The bottom-up motion the file proposes is the *unlock* that lets the consultancy partnership work (no consultant wants to embed a tool the client's engineers haven't already used), but the consultancy is where the revenue lives.

## Verdict — probe

I cannot go on this as currently structured because the revenue motion is two motions and the file picks neither. I cannot kill it because the underlying market is real, the wave is timed correctly, and the MRM consultancy upside is large enough to be a category-defining channel.

**Probe** = run a 60-day design-partner motion with one Big-4 MRM practice or one specialist boutique (Protiviti or Treliant), embedded in one regulated client (BFSI Tier-2 or mid-cap pharma). The probe falsifies the alternative on two questions:

1. Does the consultancy treat us as productivity tool or as a competitor to their billable hours? If productivity tool, the entire revenue thesis rebuilds around partner-led GTM and the alternative is a strong **go**. If competitor, the partner channel is closed and the bottom-up-only motion is unlikely to hit 50 teams in time — verdict shifts to **kill**.
2. Does the client's ML platform lead actually have signing authority for $25K-$50K/team/year, or does it route through GRC procurement on day one? If signing authority is intact, the dual-SKU strategy works. If it routes through GRC immediately, we are competing with Archer on a checklist we cannot win, and the alternative collapses into #2 in the triage (which already has the chasm-framed motion the file is trying to avoid).

If both probes return positive signal in 60 days, this becomes a **go** and the CRO domain re-engages to write the GTM model proper. If either returns negative, this becomes a **kill** for the bottom-up framing and the segment is covered by alternatives #2 and #10 from the triage, which have GTM motions better suited to their respective findings.

---

**CRO sign-off:** Probe, with a 60-day falsification window scoped to one MRM consultancy partnership and one regulated-enterprise design partner.
