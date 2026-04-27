# Type Config Schema

Every project type in `team/types/` is a JSON file that follows this schema. The filename (minus `.json`) is the type identifier used with `--type` on the CLI.

Files starting with `_` are reserved (schema, docs) and are never treated as type configs.

---

## Full schema

```json
{
  "type": "product",
  "name": "Software Product",
  "description": "Software product with users (app, CLI, platform)",
  "requirements_files": ["compliance", "engineering", "product", "design", "business", "general"],
  "gates": {
    "pre-cto": ["clo", "ciso"],
    "pre-sprint1": ["mario"]
  },
  "idea_prompts": {
    "user": "Who is the primary user? (role, company size, specific pain point)",
    "problem": "What do they do today without this? What's painful?",
    "solution": "What does this do? 2-3 sentences.",
    "success": "What does winning look like at 18 months?",
    "risks": "What is the riskiest assumption?"
  },
  "logs": ["engineering", "product", "design", "strategy"]
}
```

---

## Field reference

### `type` (string, required)

The canonical identifier for this type. Must match the filename: `team/types/{type}.json`.

Used in `.sdkrc`, CLI output, and gate-check resolution.

### `name` (string, required)

Human-readable name shown in the init header:

```
Type:    product (Software Product)
```

### `description` (string, required)

One-line description of what this project type covers. Shown in error output when the user specifies an invalid type.

### `requirements_files` (array of strings, required)

Controls which requirements files are copied from `project-template/` into the new project.

Valid values and their file mappings:

| Value | File copied |
|---|---|
| `"compliance"` | `compliance-requirements.md` |
| `"engineering"` | `engineering-requirements.md` |
| `"product"` | `product-requirements.md` |
| `"design"` | `design-requirements.md` |
| `"business"` | `business-requirements.md` |
| `"general"` | `general-requirements.md` |

**Fallback if absent:** all 7 files are copied (same as `product` type). This ensures backward compatibility if a type config is missing this field.

### `gates` (object, optional)

Defines which compliance gates are enforced before key phase transitions. Two gate points are supported:

```json
"gates": {
  "pre-cto":     ["clo", "ciso"],
  "pre-sprint1": ["mario"]
}
```

**`pre-cto`** — agents that must sign off before the CTO is activated.

Valid values: `"clo"`, `"ciso"`. Both, one, or neither.

- Both present → CLO + CISO check runs (current default behavior).
- Only `"clo"` → CLO check only; CISO check is skipped.
- Only `"ciso"` → CISO check only; CLO check is skipped.
- Absent or empty array → CLO + CISO gate is skipped entirely.

**`pre-sprint1`** — agents that must sign off before Sprint 1 starts.

Valid values: `"mario"`.

- Present → Mario sign-off check runs.
- Absent or empty array → Mario gate is skipped entirely.

**Fallback if `gates` is absent:** full gate behavior (`pre-cto: [clo, ciso]`, `pre-sprint1: [mario]`). This matches `product` type and ensures backward compatibility.

### `idea_prompts` (object, optional)

Key-value pairs that customise the questions shown in `idea.md` for this project type. Each key is a section name; the value is the prompt text shown to the owner.

Standard keys: `user`, `problem`, `solution`, `success`, `risks`.

**Fallback if absent:** the default `product` prompts are used.

### `logs` (array of strings, optional)

Controls which log files are copied from `project-template/` into the new project.

Valid values and their file mappings:

| Value | File copied |
|---|---|
| `"engineering"` | `engineering-log.md` |
| `"product"` | `product-log.md` |
| `"design"` | `design-log.md` |
| `"strategy"` | `strategy-log.md` |

**Fallback if absent:** all 4 log files are copied.

---

## Always-copied files

These files are copied for every project type, regardless of `requirements_files` or `logs`:

- `idea.md`
- `current-status.md`
- `history.md`
- `project-map.md`
- `CLAUDE.md`
- `DISCLAIMER.md`
- `context-manifest.json`
- `.gitignore`
- `team.md`
- `project.md`

---

## Adding a new type

1. Create `team/types/{type}.json` following this schema.
2. Set `"type"` to match the filename.
3. Specify only the `requirements_files` and `logs` relevant to that type — omit files that don't apply.
4. Configure `gates` to reflect the compliance posture. Low-regulation types may have empty gates.
5. Run `node --check scripts/init.js scripts/gate-check.js` to confirm the scripts still parse.
6. Test: `node scripts/init.js test-proj --type {type} --squad mvp`.
