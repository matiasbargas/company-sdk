# Alternative: Porter's Five Forces × AI labs / research orgs

**Framework:** Porter's Five Forces
**Segment:** AI labs / research orgs
**Generated:** 2026-06-14

## The market direction in one sentence

AI lab research groups adopt team-sdk as the provenance-bearing orchestration substrate for multi-agent research programs, where peer-reviewable context corpora are the moat against commoditized model wrappers.

## What the framework reveals about this segment

Porter's structural view of the AI-labs segment is unusual: **supplier power is extreme** (a handful of frontier model providers, and the labs themselves often ARE the suppliers), **buyer power is concentrated but discerning** (small number of labs, but each evaluates with research rigor), **threat of substitutes is acute and continuous** (every new agentic framework from DeepMind, Anthropic internal tools, LangGraph, AutoGen, OpenAI Swarm threatens to obsolete the substrate monthly), **threat of new entrants is high** (low capital cost — any 3-person research team can fork an orchestration layer in a weekend), and **intra-industry rivalry is reputational rather than commercial** (citations, benchmarks, and open-source mindshare are the battlefield). The favorable position in this structure is NOT to compete on orchestration features — that war is lost to whoever ships the next paper. The favorable position is to be the **provenance + peer-review substrate underneath orchestration**, where switching cost is the accumulated corpus of decisions, dissent records, and Halloway Ratchet entries that no competing framework can replicate.

## The team-sdk value proposition for this segment, via this framework

team-sdk's §24 Halloway Ratchet (irreversible decision provenance), §32 Critique-Revise and Red-Team loops (mechanized peer review), and Layer B evidence-shaped context (every claim traceable to its source) map almost too cleanly onto how research orgs already operate. The configuration that lands: **research-program-as-project**, where the substrate captures every model card decision, every safety review dissent, every ablation rationale, and every reviewer counterfactual in a queryable corpus that survives team rotation, paper revisions, and replication attempts. The Bus protocol formalizes what labs call "internal review threads." Section 18 context requests formalize "did anyone check with the safety team." The four-cadence metabolism maps to the lab's experiment loop → weekly all-hands → paper sprint → quarterly research direction review. The moat is not features; it is the **citable, forkable, provenance-bearing corpus** — something model wrappers structurally cannot offer.

## GTM motion implied

**Community-led, with open-substrate licensing and academic co-authorship as the wedge.** Porter's analysis says: in a segment where rivalry is reputational and entrants are weekend-cheap, the only durable competitive position is mindshare-as-moat. team-sdk should be released as an open substrate with a paper ("Provenance-Bearing Multi-Agent Substrates for Reproducible AI Research") co-authored with 2-3 mid-tier labs, presented at NeurIPS workshops or the AI Safety community, and seeded into the dependencies of widely-cited agent benchmarks. The buyer is not the lab's procurement; it is the lead researcher who cites it and the PhD student who forks it. Conversion to paid support tiers happens only after the substrate is upstream of three published works.

## Monetization shape

Open-core + paid provenance-attestation and managed corpus hosting for labs that need audit-grade reproducibility (hybrid: free substrate, paid trust layer).

## Honest weaknesses of this alternative

The combination is awkward in two ways. First, Porter's framework assumes a coherent industry with capturable economic rent — AI labs are partially non-commercial, partially absorbed into hyperscalers, and the "industry" is reshaped by foundation-model releases every 90 days, so structural analysis decays fast. Second, labs are the segment MOST likely to NIH-syndrome the substrate: their willingness to pay is moderate but their willingness to fork-and-rebrand is high, which means community-led GTM may produce influence without revenue. The framework correctly identifies the favorable position (provenance moat) but understates how aggressively this segment substitutes its own internal tooling for any external substrate, no matter how well-designed.

## Self-score (rough, will be re-scored by triage agent)

- Viability (0-10): 5. The provenance-moat thesis is structurally sound but monetization is weak — labs adopt, cite, and fork, but rarely pay at scale.
- Market growth potential (0-10): 6. Lab count grows but TAM is small; the prestige spillover into adjacent regulated segments (pharma research, defense AI) is where the real growth optionality sits.
