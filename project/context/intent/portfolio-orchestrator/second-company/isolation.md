# Second company — isolation design (D3.1)

**Status:** DESIGN, nothing built. **Author:** engineer for D3 (v0.2 pipeline), for review by Mario (C12, C14) and the CISO.
**Date:** 2026-11-15 · **Baseline:** v0 single company graduated (commit 95007bd), D7 sandbox user (`history.md` → "Mario gate — Portfolio Orchestrator irreversible decisions").
**Binding sources:** `variables.yaml` → `isolation_v0`, `mario_conditions` C7, C12, C13, C14; `claims.yaml` → `cap-po-isolation-001`, `cap-po-sandbox-001`, `cap-po-runner-002`, `cap-po-registry-002`; `packages/holding/src/runner/{sandbox,spawn,settings,state}.js`, `src/cli/sandbox-script.js`, `src/sandbox-access.js`, `src/portfolio.js`.

## 1. The problem in one paragraph

v0 runs every company session as **one** sandbox user (`_sdkco`). That user cannot reach `holding/` (0700, Owner), so the ledger, keys and commons are safe from sessions. But two companies under the same user are separated only by clone paths and permission rules, and a Bash call in company A can still read or write company B's clone, B's transcripts in the shared sandbox home, B's run settings in the shared session folder, and B's API key in the environment of B's running process (same uid). `variables.yaml` calls this the `honest_limit`. It is acceptable while one human owns every company. It is not acceptable once a company belongs to someone else, which is why `cap-po-registry-002` refuses a second Owner until `os_isolation` holds.

## 2. Decision proposed: one OS user per company (containers deferred)

| Option | Separation | Cost to build | Fits D7 code | Verdict |
|---|---|---|---|---|
| **A. One macOS user + group per company** | Kernel uid/gid checks on every file and process | Small: generalise the D7 setup script, ledger event and pre-flight from one user to N | Yes, D7 already launches through `sudo -n -u <user>` | **Proposed** |
| B. One container (Linux VM) per company | Separate kernel namespace inside a VM | Large: new runner adapter, image pinning, mounts, key injection into the VM, hook runtime inside it | No, a new runner implementation (`Runner.implementations` in `variables.yaml`) | Deferred. Revisit when the CloudRunner is built, because a cloud runner needs the same packaging |
| C. Per-company users + `sandbox-exec` profile | Users plus a Seatbelt profile | Medium | Partly | Not relied on. `sandbox-exec` is marked deprecated in its man page, so it can be a tripwire layer at most, never the barrier |

Option A is the D7 decision extended, not a new trust model. It keeps Mario's D7 reasoning intact (the OS is the barrier, deny rules are a tripwire) and adds the one thing D7 lacked: a different uid for each company.

## 3. Mechanisms (macOS)

Every mechanism below is a standard macOS facility already used by the D7 script, unless marked **new**.

| Need | Mechanism | Already in D7 |
|---|---|---|
| A distinct identity per company | `dscl . -create /Users/_sdkco_<company>` with `UserShell /usr/bin/false`, `IsHidden 1`, a private group `dscl . -create /Groups/_sdkco_<company>` as its `PrimaryGroupID` | Yes, for one user |
| A private home per company (Claude Code config, transcripts under `~/.claude/`) | `NFSHomeDirectory` per user, home `chown <user>:<group>`, `chmod 700` | Yes, for one user |
| The company clone reachable only by its company | clone `chown -R _sdkco_<co>:_sdkco_<co>`, `chmod -R u+rwX,g+rX,o-rwx` | Yes |
| The Owner reads every clone (proofs at a SHA, reports) | Owner added to each company group: `dseditgroup -o edit -a <owner> -t user _sdkco_<co>` | Yes |
| The Owner writes into a clone (commons pull, D2.3) | **New:** an inheritable ACL on the clone: `chmod -R +a "user:<owner> allow list,add_file,search,add_subdirectory,delete_child,readattr,writeattr,readextattr,writeextattr,readsecurity,read,write,append,file_inherit,directory_inherit" <clone>`. Without it the Owner has group read only (`g+rX`) and `commons pull` cannot write the adopted file. See §7, open question Q1 | No |
| Launch as the right user, nothing else | One sudoers drop-in per company: `/etc/sudoers.d/sdk-holding-_sdkco_<co>` with `<owner> ALL=(_sdkco_<co>) NOPASSWD: <claude>`, validated with `visudo -cf` | Yes, for one user |
| Environment reaches the session only as listed | `Defaults!<claude> env_keep += "ANTHROPIC_API_KEY HOLDING_RUN_ID"` plus sudo's default `env_reset` | Yes |
| Files a session creates are private to its company | **New:** `Defaults!<claude> umask=0077` in the same drop-in. sudo combines it with the Owner's umask (the union is at least as strict), so the session starts with umask 077. The setting applies only when claude is the command, so the setup script cannot prove it without starting a session; the first run proves it instead (doctor checks that files the session created in its `TMPDIR` are not group- or other-readable) | No |
| Temp files never land in a shared world-readable place | **New:** a private `TMPDIR` per company (`<home>/tmp`, 0700) passed by the runner and added to `env_keep`. `sudo` resets the environment, so without this a session falls back to the shared `/tmp` | No |
| Runner-written run files (settings, landing state, FROZEN) readable only by that company | **New:** per-company session root `<sessions>/<co>/`, Owner-owned, group `_sdkco_<co>`, mode `0750`; run files `0640`. Today the root is one Owner-owned `0755` folder with `0644` files, readable by every local user | No (today 0755/0644) |
| Hook runtime (node + `landing-hook.js`) | Shared and unchanged: Owner-owned `0755` folder, `0644` hook, no secrets in it, sha256-pinned per run (D1.2) | Yes |
| The control plane | `holding/` stays Owner-owned `0700`; no company user is in the Owner's groups | Yes |

## 4. How the runner selects the user per company

Today the ledger holds one `sandbox` event `{user, home, sessionDir, nodePath, hookPath, runtimeDir}` and the fold keeps one `state.sandbox`. The design:

1. **Ledger event.** The `sandbox` event gains a required `company` field (a schema bump on the event, per C1 `schema_version`). The fold keeps `state.sandboxes[companyId]`. A v1 event without `company` stays valid for a holding with exactly one company and is read as that company's sandbox. The registry refuses a second company while any v1 sandbox event is the one in force.
2. **Pre-flight, per run.** `resolveSandbox` looks up `state.sandboxes[companyId]`. No entry → `SANDBOX_REQUIRED` naming the company. The pre-flight then refuses with **`SANDBOX_SHARED`** when this company's `user`, primary group, `home` or session root equals another registered company's. The check is on recorded values, so a typo cannot quietly give two companies one user.
3. **Reach checks, positive and negative.** `src/sandbox-access.js` already computes, from stat data, whether a user can reach a path through every parent. The pre-flight keeps today's positive checks (node `x`, hook `r`, claude `x`, own clone `rwx`, own session root `rx`) and adds **negative** checks: the company user must **not** reach any other company's clone, home or session root (`r`), nor `holding/`. A negative check that passes (the user can reach a sibling) refuses with `SANDBOX_CROSS_REACH` naming both companies and the path. `sandbox-access.js` ignores ACLs and root, so a pass is necessary, not sufficient. The setup script proves it live (step 5).
4. **Launch.** `buildLaunch` already takes the user from the resolved sandbox: `sudo -n -u <user> -H --preserve-env=ANTHROPIC_API_KEY,HOLDING_RUN_ID,TMPDIR <claude> ...`. Only the user and `TMPDIR` change.
5. **Setup script, per company.** `sdk-holding sandbox setup --company <co> --user _sdkco_<co> ...` writes `setup-_sdkco_<co>.sh`. Besides today's live proofs (`sudo -u <user> /bin/test ...`), it adds live negative proofs for every already-configured sibling: `sudo -u _sdkco_<co> /bin/test -r <sibling clone>` must **fail**, and the same for the sibling's home and session root. The script aborts and names the path when any of them succeeds. It also runs the key-visibility probe in §5.
6. **Doctor.** `sandbox doctor` runs per company and reports every check above, plus "no company user shares a group with another company user" from `id -G`. It does not assume which implicit groups macOS adds to a new user; it compares the real lists.

## 5. How keys stay per company (C14)

| Rule | Mechanism | Check |
|---|---|---|
| One key per company, never shared | `holding/keys/<co>.key`, Owner-owned `0600`, inside `holding/` (0700) | **New** pre-flight `KEY_SHARED`: the sha256 of each company's key file must differ from every other company's. Only hashes are compared; no key is printed |
| No sandbox user can read any key file | `holding/` 0700 Owner; no company user in the Owner's groups | Doctor computes it with `sandbox-access.js` for every company user (negative check on `holding/keys`) |
| The key reaches only its own session | Read by the runner (Owner uid) and placed only in the `sudo` child's environment, never on argv (`cap-po-sandbox-001`) | Unchanged |
| A sibling company cannot read the key from a running process | A process's environment belongs to its uid. With one sandbox user, A's Bash can inspect B's session (same uid). With per-company users it should not. **Not asserted here as fact for macOS**: the setup script proves it | **New** live probe in the setup script (run as root, no key involved): start `sudo -u _sdkco_a /usr/bin/env PROBE_<random>=1 /bin/sleep 30 &`, then `sudo -u _sdkco_b /bin/ps -E -ww -p <pid>` must not show `PROBE_<random>`. Abort and name the result otherwise |
| The key is not persisted by Claude Code in a place a sibling or the commons could reach | The company home is 0700 to its user, so even a persisted copy stays inside that company | **Unknown today** whether Claude Code writes any part of an env-provided key to `~/.claude*`. First-run check: after the first sandboxed run, the Owner greps the company home for the key's last 8 characters and records the result (`gate-checklist.md` G19) |
| The company can still read its **own** key (its session holds it in env) | Accepted: a session can exfiltrate its own key and spend outside the runner | That is why the provider cap per company (C13, `provider-caps.md`) is the hard ceiling and per-key reconciliation runs each cycle (`cap-po-reconcile-001`, `cap-po-second-owner-009`) |

## 6. What stays unreachable across companies

| Asset | Owner of the files | Reachable by company A's user? | Enforced by |
|---|---|---|---|
| `holding/fuel/ledger.jsonl`, `holding/runs/`, `holding/portfolio.json` | Owner, inside `holding/` 0700 | No | Kernel (D7, unchanged) |
| `holding/commons/` (quarantine and admitted items) | Owner, inside `holding/` 0700 | No. Items reach a company only by an Owner-run `commons pull --approve` (D2.3), which refuses inside a run (`RUN_CONTEXT`) | Kernel + Owner command |
| `holding/keys/*.key` | Owner 0600 inside 0700 | No | Kernel |
| Company B's clone | `_sdkco_b:_sdkco_b`, `o-rwx` | No: A is not in group B, so the "other" class applies and grants nothing | Kernel; negative check + live proof |
| Company B's home (Claude Code config, transcripts, caches) | `_sdkco_b`, 0700 | No | Kernel |
| Company B's run files (settings, landing state, FROZEN) | Owner, group `_sdkco_b`, 0750/0640 | No | Kernel (**new**, today world-readable) |
| Company B's temp files | `_sdkco_b`, private `TMPDIR`, umask 077 | No | Kernel (**new**) |
| Company B's running session (env, signals) | `_sdkco_b` processes | Must be No; proven by the live probe | Kernel; live probe |
| Hook runtime | Owner 0755/0644 | Read-only, shared, holds no secrets | Kernel + sha256 pin |
| Network | Shared | **Yes.** Per-user firewalling is out of scope. A session can reach anything on the network, including another company's public endpoints | Not enforced. Stated limit |

## 7. Honest limits and open questions

- **The holding operator can read every company.** The Owner's account is in every company group, and root on the machine can read anything. A company owned by someone else is therefore readable by the holding Owner. That is a trust fact, not a bug, and it must be disclosed to the second Owner and acknowledged in writing (`gate-checklist.md` G15). If the second Owner needs confidentiality from the holding Owner, local per-company users are not enough; the company must run on hardware the holding Owner does not administer (a future CloudRunner or the company Owner's own machine).
- **The company Owner's approvals cannot come from this machine's terminal.** The `actor` field is a declaration (`packages/holding/README.md`, "Security model, honestly"). With two humans, a company Owner act (adoption approval, consent record, judgment rating, company CHARTER ratification) must carry a signature checkable against that Owner's registered public key (`cap-po-second-owner-006`).
- **Q1: Owner writes into a clone.** `commons pull` (D2.3) writes into a clone the Owner can only read under D7. The inheritable ACL in §3 fixes that. Alternative: the pull stages files in an Owner-owned, group-readable `incoming/` folder and the company session adopts them. Decision owner: CTO with Mario. `sandbox-access.js` would also need to read ACLs before it could check this; today it ignores them.
- **Q2: shared hook runtime.** Shared is safe if it is Owner-owned, not writable by any company user, and sha256-pinned (D1.2). A per-company copy removes even that coupling at the cost of N copies. Proposed: shared.
- **Q3: implicit macOS groups.** macOS may add implicit memberships to a new local user. The design never assumes the list; doctor compares the real `id -G` sets and fails on any overlap that grants reach.
- **Q4: containers.** Deferred, not rejected. Trigger: the CloudRunner is built, or the second Owner needs confidentiality from the holding operator.

## 8. Mapping to Mario's conditions

| Condition | Text (variables.yaml) | Covered by this design |
|---|---|---|
| **C12** | "D7 decided by the Owner (sandbox OS user); runner-002 / isolation-001 / commons-001 updated — BLOCKS two-company run until built" | §2–§4: D7 generalised to one user per company; `SANDBOX_SHARED` and `SANDBOX_CROSS_REACH` pre-flight; per-company setup script with negative live proofs; per-company session root, `TMPDIR` and umask. `cap-po-isolation-001`'s "sibling-company reach via Bash remains a documented v0 limit" is closed by `cap-po-second-owner-001/002` |
| **C14** | "keys never on disk readable by the sandbox user; injected per session; per-key reconciliation each cycle — BLOCKS two-company run" | §5: key files inside 0700 `holding/`, negative reach check per company user, `KEY_SHARED`, env-visibility live probe, first-run persistence check, per-key reconciliation enforced each cycle (`cap-po-second-owner-003/004/009`) |
| C13 (dependency) | provider cap location | `provider-caps.md`. The isolation above is not sufficient without it, because a company can always spend its own key outside the runner |
| C7 (dependency) | no nesting of holding and company clones | Unchanged; `src/portfolio.js` already enforces it, and per-company users rely on it (a nested clone would inherit the wrong owner) |
