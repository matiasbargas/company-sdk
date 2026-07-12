# CMO panel review — christensen-disruption × devtool-companies

**Role:** CMO
**Date:** 2026-06-14
**Release context:** market-prioritization-2026-06-14

## Scores

- **Viability (from CMO lens): 8/10**
- **Market growth (from CMO lens): 6/10**

## Reasoning from my domain

### Viability — why 8, not higher

This is the rare segment where the product *is* the marketing artifact. The buying signal in devtool-land is not a sales call — it is a public dogfooding thread, a `_signals.jsonl` excerpt on Hacker News, a conference talk where a CTO walks through their own retro corpus. The CMO job here is unusually leveraged: we are not manufacturing demand, we are removing friction from a credibility flywheel that the substrate produces by existing. Positioning is also natively crisp: "the operating substrate of teams that ship the dev tools you already use." That passes the "so what?" test in one bounce.

What docks two points: devtool buyers are *makers of competing infrastructure*, which means every positioning claim we make against Linear/Notion is also a positioning claim against the buyer's own retro plugin roadmap. The category we are creating is also a category they could absorb. The CMO craft challenge is to position so that "build this yourself" feels like NIH rather than pragmatism — which is a real lift, not a guaranteed win.

### Market growth — why 6, not higher

The TAM concern in the file is real and the CMO lens makes it worse, not better. 15-80 person devtool companies number in the low thousands globally, and the bridge from "devtool company" to "every product team" is exactly the **Geoffrey Moore tornado problem** Crossing-the-Chasm warns about: dev-tool early adopters do not transfer to mainstream pragmatist segments without a *re-positioning event*. The alternative does not specify how the messaging morphs to land outside the dogfood crowd. Without that bridge, growth caps at the beachhead.

That said, growth potential inside the beachhead is genuine — community-led GTM with engineering-credibility flywheel is one of the few motions where CAC trends toward zero as the lighthouse references compound. Six is "real growth inside a bounded TAM," not "weak market."

## Risk not named in the alternative

**The "Show HN abandonment" failure mode.** Devtool companies that adopt team-sdk publicly and then quietly stop using it create *negative* marketing artifacts more powerful than the positive ones. In the dogfood-credibility flywheel, a lighthouse going silent is read as a verdict — Hacker News will explicitly call out "company X used to publish their `_signals.jsonl` and stopped." This is asymmetric in a way the alternative's "Lighthouse fragility" admission undersells: one quiet abandonment damages the narrative more than ten active references heal it, because the *absence of continued evidence* in an open-substrate model is itself evidence. The alternative names lighthouse fragility as a sequencing problem; from the CMO lens it is a **narrative-half-life problem** — every public adopter becomes a story we must keep alive, and the cost of keeping them alive (CS attention, custom integration support) scales linearly with the count we need to hit the 50-team winning condition. We do not have a marketing budget for that; we have a CS budget for that, and it is not allocated.

## Upside undersold

**The substrate itself is the highest-leverage owned-media channel team-sdk will ever have.** The alternative frames `_signals.jsonl` as a product feature and a credibility signal. From the CMO lens it is something more: it is **the first marketing channel in B2B software where the artifact, the proof, and the message are the same file.** Traditional case studies require a CS team to extract a quote, a designer to make a slide, a marketer to write a narrative — six weeks per case study, and the buyer discounts it as marketing-vetted. A public `_signals.jsonl` from a lighthouse company *is* the case study, *is* the proof, *is* the narrative, and is read as engineering ground truth rather than marketing. This collapses the entire content-marketing function for the beachhead. The alternative's self-score of 8 on viability does not reflect that we are effectively getting a marketing infrastructure built into the product for free — that is closer to a 9.5 on viability if the dogfood-abandonment risk above is mitigated. The bigger consequence: this same property is what makes the **Show HN abandonment** risk so sharp. The two are the same lever pointed in opposite directions.

## Verdict

**go** — with one condition the CMO domain owns: before lighthouse 1 publishes, we ship the *narrative continuity playbook* — what we do when a public adopter goes quiet, who reaches out, what the public-facing message is when adoption pauses, how we frame "team X is now in maintenance mode on their substrate" without making it look like abandonment. Without that, the upside (substrate-as-channel) and the risk (abandonment-as-anti-channel) cancel and we are betting on luck.

Positioning lock recommendation for this path: **"The substrate that teams shipping your favorite dev tools run on."** Single sentence, names the buyer, names the credibility source, implies the category, and works without modification on Hacker News, on a conference slide, and in a CTO Slack DM. So-what test passes on first pass.
