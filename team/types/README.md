# Type Registry

A project type config tells `sdk-init` what requirements files and log files to copy into a new project, which compliance gates to enforce, and which questions to ask in `idea.md`. Every type in this directory is a standalone JSON file. The filename (minus `.json`) is the identifier passed to `--type`. Files starting with `_` are reserved and never treated as type configs.

---

## Schema

```jsonc
{
  // Canonical identifier. Must match the filename: team/types/{type}.json.
  // Lowercase, no hyphens, max 10 characters.
  "type": "product",

  // Display name shown in the init header.
  "name": "Software Product",

  // One sentence describing what projects of this type are.
  "description": "Software product with users (SaaS, app, platform)",

  // Which requirements files to copy from project-template/.
  // Valid values: "discovery" | "security" | "engineering" | "product"
  //               | "design" | "business" | "general"
  // Omit files that don't apply to this type. Omitting the field copies all 7.
  "requirements_files": ["discovery", "security", "engineering", "product", "design", "business", "general"],

  // Compliance gates. Reflects actual risk posture — do not copy product defaults blindly.
  "gates": {
    // Agents that must sign off before the CTO is activated.
    // Valid values: "clo" | "ciso". Use [] to skip this gate entirely.
    "pre-cto": ["clo", "ciso"],

    // Agents that must sign off before Sprint 1 starts.
    // Valid values: "mario". Use [] to skip this gate entirely.
    "pre-sprint1": ["mario"]
  },

  // Questions shown in idea.md for this type. All five keys are expected.
  // Make them specific to the type — not a copy of the product prompts.
  "idea_prompts": {
    "user": "...",
    "problem": "...",
    "solution": "...",
    "success": "...",
    "risks": "..."
  },

  // Which log files to copy from project-template/.
  // Valid values: "engineering" | "product" | "design"
  //               | "operations" | "people" | "strategy"
  // Omit files that don't apply. Omitting the field copies all 6.
  "logs": ["engineering", "product", "design", "operations", "people", "strategy"]
}
```

---

## How to add a new type

1. Review `team/types/_schema.md` for field reference and fallback behavior.
2. Create `team/types/{type}.json` using the schema above.
3. Set `"type"` to match the filename exactly.
4. Choose only the `requirements_files` and `logs` that apply — do not default to the full product list.
5. Set gates to match the actual compliance risk, not a copy of another type.
6. Validate: `node -e "JSON.parse(require('fs').readFileSync('team/types/{type}.json','utf8'))"`
7. Test: `node scripts/init.js test-project --type {type} --squad mvp`
8. Open a PR. The description must state the gate rationale for `pre-cto` and `pre-sprint1`.

---

## Naming rule

Type identifiers are **lowercase, no hyphens, max 10 characters**. Examples: `product`, `api`, `hardware`, `internal`, `protocol`, `content`, `service`.

---

## Types are not squads

**Type** = what you are building (the compliance posture, the requirements shape, the idea prompts).

**Squad** = how big your team is (`startup`, `mvp`, `feature`, `website`).

They combine independently. A `hardware` project can run with a `startup` squad or an `mvp` squad. A `protocol` project can run with any squad size. Do not encode team size into a type config.
