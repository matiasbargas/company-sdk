---
name: onboard-agent
description: Name and register a newly activated agent using the naming formula (first name + city + cultural profile) and sdk-doc spawn. Use when spawning any Project Mode agent that is not a read-only consultation spawn.
---

# Onboard an agent

Rules: `protocol.md` §14 (naming formula, sub-roles); `team/roles/_shared.md` → Placeholders and Onboarding.

## Steps
1. **Check the roster.** Read `team.md`. No two active agents may share a first name or a city.
2. **Pick a name and profile:**
   - a common first name, and a city from a region not yet represented (aim for worldwide spread);
   - a 1–2 sentence cultural profile: how people there tend to think about work, risk, hierarchy, and craft.
   - Greg (CEO) and Mario (Chief Engineer) keep their aliases.
3. **Register:** `sdk-doc spawn . --name "<Name City>" --role "<Role>" --level <Level> --activated-by "<Role>" --profile "<profile>" --how "<working style>" --fun-fact "<fact>"`.
4. **Spawn the agent** with `{{name}}`, `{{city}}`, `{{cultural_profile}}` and `{{company}}` filled in the prompt, and its role file and `team/roles/_shared.md` as required reading.
5. When the agent's work ends, run `sdk-doc dissolve . --name "..." --dissolved-by "..." --reason "..."`.

Consultation spawns (read-only peers, §16) skip this.

Commands: use the `sdk-*` bins; inside the SDK repo without `npm link`, run `node scripts/<name>.js`; in a generated project, `$SDK` is `sdkPath` from `./.sdkrc`.
