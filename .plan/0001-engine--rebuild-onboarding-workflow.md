---
id: 0001
boundary: engine
paths:
  - kernel/devpulse-clyffy/src/providers/
  - systems/devpulse-engine/src/platform/providers/
  - systems/devpulse-engine/src/platform/onboarding/
  - systems/devpulse-engine/src/platform/forms/
  - systems/devpulse-engine/src/platform/github/
  - systems/devpulse-engine/src/platform/copy/
  - interfaces/desktop/src-tauri/src/commands/providers/
  - interfaces/desktop/src-tauri/src/commands/onboarding/
  - interfaces/desktop/src-tauri/src/commands/github/
  - interfaces/desktop/src/lib/design/blocks/schema-form/
  - interfaces/desktop/src/lib/domains/app/providers/
  - interfaces/desktop/src/lib/domains/app/onboarding/
touches: [kernel-clyffy, kernel-model-loader, desktop-tauri, desktop-onboarding, desktop-models, desktop-chat, desktop-coldlight, desktop-profile]
status: draft
owner: Jesse Hades Hall
created: 2026-10-10
updated: 2026-10-18
supersedes: [0002]   # reserved for "user-managed AI endpoints", never written; folded in here
specs:
  # Research for this revision, read in full before writing (2026-10-12):
  - ~/.claude/plans/onboarding-endpoints/01-owner-requirements.md   # your 120 requirements, quoted with source + date; R-IDs below
  - ~/.claude/plans/onboarding-endpoints/02-branch-review.md        # the origin/main GB10/July work: what to port, what to drop
  - ~/.claude/plans/onboarding-endpoints/03-structure.md            # your structure rules S-1..S-40
  - ~/.claude/plans/onboarding-endpoints/04-current-code.md         # every current onboarding file, verdict, delete order
  # Owner specs and decisions:
  - interfaces/desktop/src/lib/design/ONBOARDING-CASCADE.md
  - .claude/agents/coldlight-curator.md                              # the 9 locks
  - .claude/plans/coldlight-recovery/07-wizard-recode-spec.md
  - scripts/docs/specs/MODEL-LOADER-UX-REQUIREMENTS.md
  - docs/platform/Desktop.md                                         # Nx library types, LOCKED 2026-04-14
  - docs/chat-modes/_raw/all-prompts.txt                             # raw owner prompts, April 2026
  - origin/main f3748059                                             # "migrate the libsql crate to turso" (owner decision 2026-07-01)
  - .plan/0004-engine--wire-contextual-guidance.md
  - .plan/0007-kernel-model-loader--replace-inprocess-inference-with-runtimes.md
---

# Rebuild onboarding: first run over providers, on Turso

## Goal

DevPulse is a dedicated dev platform for vibe coders (R-0.1). First run sets up
the person, their projects and their AI. Clyffy guides it, and it lowers the
barrier instead of asking questions machine code can answer (R-A7).

How the system behaves:

- The Svelte UI drives Rust: every click is an intent, and Rust validates,
  decides and writes to DevPulse's own **Turso** database (your decision of
  2026-07-01).
- Every line on screen is something that actually happened (R-A1).
- Nothing is hardcoded: providers, ports, hosts, models, presets, steps,
  hotkeys and copy are configurable default suggestions (R-G6).

## First run — the full experience

Each stage below lists what you see, what Clyffy does, what is written to
Turso, which signal drives the screen, and the shipped product it follows.
Strings come from the copy catalog, technical words carry tooltips, and every
screen keeps a way out and a way back.

### Stage 0 — Boot (R-A9, R-D13, R-D8)

- **You see:**
  - the real services starting, each with its true status (the existing `boot` state signal);
  - Clyffy's sprite spinner with layman narration of the real stage;
  - a rotating Did You Know / Knowledge Drop from the knowledge tables in the DB.
- **Never:** a fake progress bar, or a locked app if a service is slow (R-A10).
- **Then:** the overlay fades to first run when Rust's `onboarding` state says
  setup is not complete, or to the dashboard when it is.

### Stage 1 — Welcome: "Let's go" (R-A14, R-D7, R-F4–F7)

- **You see:**
  - Clyffy's mascot and greeting;
  - the animated main-content background (the rotating background variants
    plus the MP4 loop, one configurable component);
  - the XY fluid clamp at every window size;
  - colour, a large blue/purple **Let's go** CTA, and a secondary **Set up later**.
- **Clyffy:** passive knowledge-drop nudges when you hover technical words.
- **Detection starts here.** DevPulse begins looking for your subscriptions,
  AI servers, git identity and project folders. As each one is really found,
  a chip appears: "I can already see Claude Code and Cursor."
- **Grounding:** NN/g — "Users want to start using the product right away", and
  getting rid of an overlay must always be possible.

### Stage 2 — You (R-A11, R-A12 phase 1, R-E4; your 2026-10-12 list)

One page with three sections, narrated by Clyffy ("the steps reduce to sections
within ONE page", R-A15). Every input is a schema-driven field with
suggestions; Rust validates and writes it; errors show per field.

1. **GitHub.**
   - **Sign in with GitHub** uses GitHub's device flow: you see a code, approve
     it in the browser, and DevPulse shows your avatar and login.
   - The token lives only in the OS keyring.
   - You can skip it.
2. **Name and email.**
   - Prefilled from your GitHub account and `git config`.
   - **Turso:** profile `display_name`, `email`, `github_login`, `avatar_url`.
3. **Projects folder.**
   - **Suggestions:** folders that already hold git repositories (your GitHub
     Desktop folder, `source/repos`, `Projects`, your editor's recent workspaces).
   - Pick one with the folder picker. DevPulse scans it and lists the repos it
     finds with their languages (tokei), with DevPulse itself first (dogfood, R-A12).
   - You tick which to add. They are registered in place, never copied.
   - Indexing is offered later through a notice (R-E4).
   - **Turso:** profile `projects_root`, and project records.

**Grounding:** GitHub Desktop's first run is sign in → configure Git with name
and email taken from the GitHub account → add the repositories on disk.

### Stage 3 — Your AI (R-B1–B5, R-B16, R-C1–C3, R-A19–A20; your 2026-10-12 list)

One page with four sections.

1. **Your subscriptions.**
   - **Cards:** Grok, Claude Code, Codex, Gemini, Cursor and Claude Desktop, plus
     any provider whose definition you add.
   - Each card shows installed or not, the version against the latest, signed
     in or not, and **Update**.
   - **Sign in** opens that vendor's own login. **Test** sends a real hello and
     shows the real reply.
   - The Claude Desktop card offers "Give Claude Desktop your DevPulse context" (MCP).
2. **Your AI servers.**
   - A live scan of this machine, your network and your private mesh. Each
     source shows its real result, and each attempt appears as it happens.
   - Found servers (a GB10, Ollama, LM Studio, vLLM, llama-server) appear as
     cards listing the models they report.
   - **Add by address** and **Add an API key** (the key goes to the OS keyring).
3. **Run AI on this machine** (optional).
   - DevPulse detects your hardware and suggests the presets that match it:
     the bundled ones, plus your own saved ones.
   - Choosing one fills suggestions; nothing downloads until you click each
     item (R-A27).
   - This section appears only once plan 0007's prebuilt runtimes are
     available. Until then it is not shown at all (no mock).
4. **Who powers Clyffy** (the Clyffy adapter).
   - A custom endpoint you provide wins; otherwise you pick one subscription to
     dedicate to Clyffy. The suggestion is the first signed-in one.
   - Clyffy says hello through it for real.
   - **Turso:** the Clyffy power record.

**Grounding:**

- Zed hosts Claude and Gemini as ACP agents that handle their own
  authentication and billing.
- LM Studio detects hardware on first launch and suggests models that fit.
- xAI's docs list Grok Build as usable "through the Agent Client Protocol (ACP)
  in other apps".

### Stage 3b — Your dev environment: containers (owner 2026-10-20; K8)

> "clear UI that effortlessly sets up Docker or podman per real world best
> practices by collecting the context from the user and using clear decision
> data points to provide strong grounded real world best practices"
> (2026-10-20); "I want docker available for the app made easy for users and so
> it becomes portable but I wanted it properly managed, portable all within
> devpulse" / "have it just coded so we add the requirement for them to
> install" (K8, owner requirements).

CLAUDE.md's "No Docker" governs how DevPulse itself is built and run; this
stage sets up a container engine **for the user's projects**.

One page, three sections:

1. **What's on this machine** (detected, never asked): each engine in
   `config/containers/engines.toml` — installed or not, client and engine
   versions, whether the engine is running, compose, Podman machines — and the
   host facts that decide what can run: OS, RAM, CPU cores, an NVIDIA GPU, and
   on Windows WSL and virtualization. Every value comes from the tool that owns
   it; a tool that is missing says so.
2. **A few questions** only the person can answer (the decision data points):
   personal or work use, and at work whether the organization is over the
   licence threshold; whether containers need the GPU; desktop app or command
   line. Answers are stored in Turso.
3. **My recommendation**: Docker or Podman, desktop app or CLI, each reason
   shown with its source; then the steps (install, initialize, start, test),
   each run only when you click it, with its real output. An engine already
   installed and working is kept, not replaced. **Skip** is always there.

Engine: `platform::containers` (detect, advice, actions); data in
`config/containers/` (engines, package ids, thresholds, sources). The stage is
listed in the flow only once all three sections work end to end.

### Stage 4 — Teach Clyffy how you talk (R-A13; optional, one time)

- **You see:** a few short interactive cards that Clyffy fills through the
  provider powering it:
  - "Describe the app you are building";
  - "How would you ask me to fix a bug?";
  - a style choice.
- **What it does:** your own typing becomes the seed of your developer lexicon
  and prompt style (plan 0004 C uses it).
- **Turso:** the calibration samples.
- **Skip:** you can skip it and run it later from the checklist.
- **Grounding:** your own requirement — "a onetime where they do more
  interactive premade components populated by clyffy we get enough typing to
  ensure accurate costar".

### Stage 5 — Done: "Here's what I learned" (R-A4, R-E1, R-A28)

- **Your snapshot:**
  - languages and frameworks across the projects you added (tokei and manifest detection);
  - your GitHub summary;
  - which AI is connected and what powers Clyffy.
- **Turso:** the profile snapshot. Plan 0004 C builds the weights and lexicon on it.
- **Your hotkeys:**
  - **Ctrl+Shift+Space** opens chat and **Ctrl+Shift+Q** opens the dashboard.
  - Both are shown with "change", configurable right there, and stored in Turso.
  - Grounding: Raycast sets its global hotkey during onboarding.
- **CTA:** **Open DevPulse**. First run closes; chat opens only when you open it.

### After first run — the Getting Started checklist (pull, not push)

- **Where:** a dismissible checklist on the dashboard.
- **Items:**
  - "Index DevPulse" (plan 0005);
  - "Ask Clyffy your first question";
  - "Try your subscriptions side by side" (Part B);
  - "Teach Clyffy how you talk" (if skipped);
  - "Add vision, voice or memory" (R-A5: offered later, not during setup).
- **Honesty:** each item ticks only when the real signal arrives (R-A20).
- **Re-entry:** the TopBar chip reopens first run at any stage (R-A24).
- **Grounding:**
  - VS Code walkthroughs: "a multi-step checklist featuring rich content", with
    an action per step.
  - NN/g: prefer contextual "pull" help over upfront tutorials. Clyffy's later
    nudges are plan 0004 B.

### Data written, all in Turso

| Data | Where | Owner |
| --- | --- | --- |
| Name, email, GitHub login/avatar, projects folder, first-run progress, selected preset, hotkeys | the existing profile record (columns rewritten, none dropped) | engine |
| Registered projects + language snapshot | the existing project records | engine |
| GitHub token | the OS keyring only | engine |
| Your providers, their status, Clyffy's power | kernel-owned tables in DevPulse's database | kernel |
| Calibration samples | engine table; plan 0004 C reads it | engine |

You can see and edit all of it in the database devtool (A1, T7).

## Order — vertical slices, each one live on screen (re-ordered 2026-10-12)

A0 (delete) and A1 (Turso) are the foundation and are done. The first order
then built every backend step (A2–A6) before any screen (A7). That meant weeks
in which nothing you could see changed. You called it going in circles, and it
was.

From A2 on, the work is cut into **slices**. Each slice takes one stage of first
run (or one product surface) through Rust, Turso and the screen, and ends with a
live check you can see. The A-rows below remain the inventory of what gets
built; each slice names the rows it delivers.

| Slice | What you see at the end | Delivers |
| --- | --- | --- |
| 1 Boot → Welcome → You | Boot hands over to first run, not the dashboard, while setup is not done. Welcome greets you with chips for what was really found (git identity, folders with repos). "You" asks your name and email, prefilled from `git config`, and your projects folder, with suggestions; a scan lists its repos with languages; you tick, and they are registered in place. Everything is saved to Turso and validated per field. Finishing goes to the dashboard. | S1, S2, Y1, Y3, Y4 (git + folders), O1 (onboarding copy), O4, O5, O6, U3, U5, U6 |
| 2 Dashboard to DASHBOARD-REFERENCE-01 | Mission Control: a VRAM / context ring and live time-series charts from real telemetry, real model and provider status, the Pulse Feed, real developer stats from the projects slice 1 registered; no overflow, no mislabels | new rows, written at slice start |
| 3 GitHub in "You" | Sign in with GitHub (device flow): login, avatar and email shown; token in the keyring | Y2 (needs a GitHub OAuth app client id — asked at slice start) |
| 4 Your AI: subscriptions | The six cards with installed, version, signed in, Update, Sign in, Test; Welcome chips for found agents | R1–R4, R9, R10, R11, U1, U2, U7 (subscriptions) |
| 5 Your AI: servers + who powers Clyffy | Scan ladder with real attempts, custom endpoints (GB10), the Clyffy adapter answering for real | R5–R8, K1, U7 (servers) |
| 6 Run on this machine | Presets as data, matched to your hardware (needs plan 0007 runtimes) | H1–H3 |
| 7 Teach Clyffy + Done | Calibration cards, "here's what I learned", hotkeys | L1, Y5, Y6, U8, U9 |
| 8 After first run | Getting Started checklist, re-entry chip, boot narration with the Clyffy spinner, end-to-end test | U4, U10, U11, O2, O3 |
| A8 Your checkpoint | You run first run on a clean DevPulse folder | — |

Each slice keeps the phase rules below (≤5 files per phase, verified per
phase) and ends with screenshots in the log.

### Slice 1 — phases

Facts it builds on (code map, 2026-10-12):

- `profiles.onboarding_complete` exists, and nothing writes it.
- The boot overlay fades on `isReady && modelsStatusReceived` and never
  chooses first run.
- The old "setup complete" flag is the model loader's, in system `kv_store`
  (`model_loader.setup_complete`). It goes in O6 (slice 8) and is not reused.
- `create_project` registers a folder in place.
- `pick_directory` exists.
- Nothing reads the git identity, scans for repos or runs tokei.
- `schemars` is 0.8 in the engine but unused there: MCP uses `rmcp::schemars`,
  which is 1.2.1.

| # | Outcome | Files | Check |
| --- | --- | --- | --- |
| 1.1 | First-run progress in Turso: migration `user/0002` (profile `onboarding_stage`, `onboarding_later_at`, `projects_root`); the flow (stages, order) from bundled `config/onboarding/first-run.flow.toml`, your override wins | engine `platform/onboarding/{mod,flow,store}.rs`, the TOML, the migration | tests: flow parse, override, unknown stage refused; store round-trip on a temp DB |
| 1.2 | `Onboarding` state signal and the workflow: next / back / set up later / reopen / finish, with the gate (a name is needed to leave "You") | engine `onboarding/workflow.rs`, `signals/{payloads,variants,spec}.rs`, contract test + snapshot | a test per transition; contract snapshot |
| 1.3 | Intents, and the state published at boot | Tauri `commands/onboarding/mod.rs`, `commands/mod.rs`, `lib.rs`; engine `platform/mod.rs` | bindings; live: `get_signal_state` holds `onboarding` |
| 1.4 | The engine copy catalog with the onboarding sections. The old wizard copy (its dead greeting/profile sections included) moves and is trimmed in O2/O3, where the kernel struct that also feeds preset display is rewritten; the new onboarding text duplicates nothing live | engine `platform/copy/mod.rs`, `config/copy.default.toml`, Tauri `commands/copy/mod.rs` | tests: your override wins per key |
| 1.5 | UI data for onboarding | `sys/bindings/onboarding/index.ts`, `domains/app/onboarding/{index.ts,util/onboarding.types.ts,data-access/onboarding.{state.svelte,service}.ts}` | `pnpm check` |
| 1.6 | **Welcome on screen**: boot hands over to it while setup is not done; Set up later goes to the dashboard | `routes/(app)/onboarding/+page.svelte`, `onboarding/ui/onboarding-shell/*`, `feature/first-run/{FirstRunFlow,views/WelcomeView}.svelte`, `layouts/app/BootOverlay.svelte` | live screenshots |
| 1.7 | Schema-driven input: `schemars` 1.x (the same version as rmcp), `jsonschema`; engine `platform/forms`; the "You" form type | engine `Cargo.toml`, `platform/forms/mod.rs`, `onboarding/you.rs`, Tauri commands | tests: invalid → per-field errors and nothing written |
| 1.8 | `SchemaForm` block | `design/blocks/schema-form/*` | component test |
| 1.9 | **"You" on screen**: name and email prefilled from `git config`, the projects folder with suggestions and the picker; saved to Turso | `views/YouView.svelte`, engine `onboarding/detect.rs` | live: the row in Turso |
| 1.10 | Repo scan with languages (tokei), DevPulse first; ticked repos registered in place | engine `platform/projects/scan.rs`, `Cargo.toml` (`tokei`), Tauri projects commands, the "You" view | live: projects in Turso, nothing written inside the repos |
| 1.11 | Welcome chips from real detection | detection publishes into the `Onboarding` state; the Welcome view | live |

### Slice 4 — phases (owner 2026-10-20: "plan and execute")

Facts it builds on (2026-10-20):

- The kernel has no `providers` module; the engine's `ai_providers` holds a
  hardcoded vendor enum (R10 rewrites it, 4c).
- On this machine `claude` (native installer, `~/.local/bin`) and `codex`
  (`AppData/Local/Programs/OpenAI/Codex`) are on `PATH`; Gemini CLI, Cursor
  CLI, Grok and Claude Desktop are not installed — the live check must say so.
- The tool runner the kernel needs lived in the engine; it moved to the peer
  infra crate `systems/infra/devpulse-process` so the kernel and the engine
  share one runner (no copies).

| # | Outcome | Files | Check |
| --- | --- | --- | --- |
| 4a.1 | `devpulse-process` infra crate (moved from the engine with history) | `systems/infra/devpulse-process/*`, root and engine `Cargo.toml`, engine callers | its tests; engine builds |
| 4a.2 | R1: `ProviderDefinition` + bundled catalog for the six subscriptions; your files in `.userdata/config/providers/` add or replace by id; a broken file is refused with its reason | kernel `providers/{mod,definition,catalog}.rs`, `config/providers/*.toml` | tests: every bundled file validates; a broken one names the field; your file wins |
| 4a.3 | R3 + R9: detection — installed (PATH or the definition's known paths), installed version, latest version (npm registry / GitHub releases, network optional), signed in (the vendor's status command, or the presence of its login file — never its contents) | kernel `providers/discovery/{mod,installed,latest,signed_in}.rs` | tests on version parsing and status rules; live: this machine's real answer for each of the six |
| 4a.4 | Actions on click: **Update** runs the vendor's own updater; **Sign in** opens the vendor's own login in a terminal window (DevPulse never sees a token) | kernel `providers/actions.rs` | live: the Update output shown is the vendor's |
| 4a.5 | R11: engine facade — `Providers` service, `providers` state signal (contract sample + snapshots), Tauri intents | engine `platform/providers/mod.rs`, `signals/*`, `tests/signal_contract.rs`, Tauri `commands/providers_status/*` | contract snapshots; bindings |
| 4a.6 | U1/U7: providers domain (store from the signal) + the **Your AI** first-run stage with one card per subscription; copy catalog; flow `welcome → you → your_ai → containers` | `domains/app/providers/*`, `onboarding/feature/first-run/views/YourAiView.svelte`, engine flow + copy | live (CDP): the cards show this machine's truth |
| 4b | R4: **Try it** — one real question through each installed agent, the way DevPulse talks to it: ACP with the official `agent-client-protocol` crate (Gemini `--acp`, Cursor `agent acp`, Grok `agent stdio`, Codex through its connector), Claude Code through its own headless mode; **Install connector** puts a connector into the DevPulse folder on click; any permission an agent asks for during the question is refused | definition `[connect]` + `headless` adapter; kernel `providers/connect/{mod,acp,connector}.rs`, `actions.rs`, discovery; engine facade (question from copy); `devpulse-process::run_in`; UI card | tests: connect validation, launch filling, connector location/version, permission refusal; live: Claude Code answers headless; Codex connector installed and Codex answers over ACP |
| 4c | R10: engine `ai_providers` rewritten into definitions (included first, then removed with your OK) | engine `ai_providers/*`, Tauri `commands/{credentials,cloud,providers}` | the credentials UI lists the same providers |

Owner rulings for 4b (2026-10-20, "lets do it please and get this properly
implemented"):

- **Claude goes through Claude Code's own headless mode** (`claude -p`) until
  Anthropic confirms an ACP route for subscription use. The Claude ACP
  adapter is built on the Agent SDK, and Anthropic does not allow
  third-party products built on it to offer claude.ai logins without its
  approval — so it is not used.
- **Connectors install on click into the portable folder**
  (`{data_dir}/tools/connectors/{provider}/`, `npm install --prefix`), never
  globally and never at startup. Codex's connector runs your own Codex
  (`CODEX_PATH`), so your Codex login and updates apply.
- Questions are asked in an empty folder (`{data_dir}/tools/ask/`) so the
  agent has no project to read; the question itself is copy
  (`onboarding.your_ai.test_prompt`).

## One model: every AI you bring is a provider

```text
ProviderDefinition   (one TOML file per provider, checked against a schema generated from Rust)
  id, name (copy key)
  kind      subscription_agent | mcp_client | api | endpoint
  adapter   acp_agent | mcp_client | openai_compatible | anthropic   (one adapter file each)
  detect    how to find it installed: executables, install paths, app bundles, config files
  signed_in how to tell it is signed in (its own login; DevPulse never holds the token)
  version   how to read the installed version and the latest release
  update    the vendor's own update command
  defaults  suggested addresses / ports / models   (suggestions, editable)

Provider             (a provider you have, stored in Turso)
  definition, address (URL or command), scope (project | global | profile),
  auth_ref (OS keyring entry name), status (from a live check only)
```

- **Built-in definitions**: Grok Build, Claude Desktop, Claude Code, Gemini CLI,
  Cursor, Codex, plus the API providers DevPulse knows (OpenAI, Anthropic, xAI,
  Google, …) and **custom endpoint** (any OpenAI-compatible server: a local LLM,
  a GB10, Ollama, LM Studio, vLLM, llama-server).
- **Any other provider** must adhere to the same schema. Adding one = adding a
  definition file that validates. A new adapter file is needed only when it
  speaks a new protocol.
- **Five of the six subscriptions share one adapter.** Claude Code, Codex,
  Gemini CLI, Cursor and Grok Build all speak the Agent Client Protocol: xAI's
  docs say Grok Build runs "through the Agent Client Protocol (ACP) in other
  apps". They differ only in their definition files.
- **Claude Desktop is different.** It is an app with no programmatic chat API.
  DevPulse detects it and offers, with your click, to give it DevPulse's
  context through MCP (`claude_desktop_config.json` or a `.mcpb` extension). It
  cannot power Clyffy.
- **Deps stay easy to update.** Each definition declares how to read the
  installed and latest versions and how to update. DevPulse shows both versions
  and runs the vendor's own updater when you click.

Grounded in:

- the Agent Client Protocol (Zed and JetBrains host agents this way; each agent owns its login);
- MCP for Claude Desktop;
- JSON Schema for definition files and forms (the pattern behind JSON Forms and react-jsonschema-form);
- Kubernetes-style status from live checks only.

## Your requirements this plan delivers

Full quotes, sources and dates are in the first spec file. In scope:

| Topic | Requirements |
| --- | --- |
| Onboarding | A1 real, no mock · A2 connects what you have, not a model wizard · A3 engine boundary that configures the kernel · A4 feeds projects · A5 no Vision/Voice/Memory steps · A6 rewritten · A7 detect instead of ask · A8 UI-driven, resumable · A9 services start visibly, then first run · A10 opens when nothing is set up, never locks · A11 name + projects location (with suggestions) · A14 Clyffy first page · A15 three screens, the rest overlays · A16 one decision per screen, errors are actions, detect first · A19 a real scan · A20 a signal per attempt · A21 tooltips everywhere · A22 no English in views · A24 re-entry always available · A25 chat never blocks first run · A27 nothing starts without your click |
| Endpoints | B1 everything is an endpoint · B2 add and remove · B3 HTTPS, then private network · B4 "local" is a server on your network · B5 GB10 is just an endpoint · B14 configurable defaults · B15 capabilities come from the provider · B16 discovery ladder |
| Subscriptions | C1 your subscriptions are the headline · C2 Grok, Claude, Gemini, Cursor, Codex · C3 each vendor's own login · C4 the Clyffy toggle (now the Clyffy adapter) |
| Clyffy | D7 first-page nudges · D8 Did You Know / Knowledge Drops from the DB · D13 one Clyffy spinner with real narration |
| Visual | F1–F8, F10, F11 |
| Structure | G1 kernel = AI, engine = the rest · G4 Svelte drives Rust · G5 signal fabric · G6 no hardcoding · G7 no machine paths · G8 delete, don't deprecate · G9 colocated Nx folders · G11 latest stable deps · G12 real-world practice · G13 portable folder · G16 errors surface and are logged |
| Process | H1–H9 |

Not in this plan, and who owns it:

- Local runtimes, the models folder, WSL: plan 0007.
- Developer profile stats, lexicon and skill inference from your GitHub and projects: plan 0004 C, which builds on the GitHub connection and projects made here.
- The one-chat UI: Part B, on the ACP client built in A4.
- Turso as a persistence variant for RRFLOW: later.

## Settled by your own rules

Say so if any is wrong.

1. **Providers and adapters live in the kernel.** That covers detection, live
   checks, ACP sessions and Clyffy's power, because they drive AI connections
   (R-B9, R-G1). The first-run workflow, your profile, GitHub and projects live
   in the engine (R-A3).
2. **Turso replaces libSQL everywhere**, using `turso` 0.8.1, the current stable
   release. Your decision of 2026-07-01 lives on `origin/main` (`f3748059`),
   and this branch was restored to before it. Turso's README says "existing
   SQLite database files work as-is", so your data carries over. No new
   database files: AI configuration is kernel-owned tables inside DevPulse's
   database.
3. **The GB10 work is not restored.** A GB10 is a custom endpoint provider. The
   generic discovery parts of that work are ported (A4); the GB10 client crate,
   the Local/GB10 modes and the GB10 copy are dropped (R-B5).
4. **Your projects folder is referenced, not copied.** First run scans the
   folder you choose and registers the repos it finds in place, using the
   existing `add_project_reference`. What DevPulse keeps about a project moves
   into the DevPulse folder. Today `project.db` is written inside your repo
   (`{project_root}/.userdata/project.db`); that stops (R-G13).
5. **Name is asked, prefilled.** Your name is a first-run input with
   suggestions from git config and GitHub. Email comes from GitHub; it is not a
   separate question.
6. **Skill level is never asked** (R-E2). Plan 0004 C infers it from your
   projects and GitHub.
7. **One schema pattern for inputs and definitions.**
   - A Rust type carries its rules.
   - JSON Schema is generated from it.
   - The UI renders the form from that schema and shows suggestions.
   - Rust validates the submission against the same schema, then writes.
   - Errors come back per field.
8. **Existing code is rewritten, not paralleled.**
   - Engine `ai_providers` (a hardcoded vendor enum and 15 base URLs) becomes the provider definitions.
   - `routing_config`'s Claude-only `LocalFirst` / `LocalClaudeSubscription` lanes become the Clyffy adapter.
   - The wizard copy becomes one engine copy catalog.
   - The existing `Form`, `FormField`, `TextField` and `Combobox` components and the `pick_directory` folder picker are reused.
9. **The onboarding cascade is adopted with two changes.**
   - Layers kept: flow TOML → views with no strings → copy from Rust → your state.
   - Gates are evaluated in Rust.
   - Your state lives in Turso, not `preferences.toml`.
10. **UI layout is Nx library types** (locked 2026-04-14). The chat window
    becomes a normal window that never opens over first run. The kernel
    `interactions` templates go. Clyffy's mascot and nudge blocks are reused.

## Rulings needed (3)

If you approve without comment, the recommended default is built.

1. **Skip.** **Recommended:** allowed and remembered, with a TopBar chip to
   reopen first run.
2. **"Deps easily updateable" — my reading:**
   - (a) every provider and runtime shows its installed and latest version and
     updates with one click through the vendor's own updater;
   - (b) a `cargo xtask deps` report lists outdated Rust and npm packages so
     upgrades stay routine (R-G11).

   Correct me if you meant something else.
3. **Database files.** Today there are three: system, user, and one per
   project. **Recommended:** keep the three scopes as Turso files, matching your
   project / global / profile settings scopes (R-E3). Drop `libsql` from the
   paths and put project databases inside the DevPulse folder. The alternative
   is one single `devpulse.db`.

## Structure

```text
kernel/devpulse-clyffy/
├── config/providers/                 one definition file per provider, checked against the generated schema
│   ├── claude-code.toml  claude-desktop.toml  codex.toml  gemini-cli.toml  cursor.toml  grok-build.toml
│   └── openai.toml  anthropic.toml  xai.toml  custom-endpoint.toml  …
└── src/providers/                    every AI you bring
    ├── mod.rs                        facade: scan / list / add / update / remove / check / assign / undo
    ├── definition.rs                 ProviderDefinition: the schema every provider adheres to
    ├── catalog.rs                    bundled + your definitions; invalid ones rejected with the reason
    ├── store.rs                      your providers in DevPulse's Turso database; update in place, history
    ├── supervisor.rs                 live status per provider; the only writer of status
    ├── clyffy.rs                     the Clyffy adapter: what powers Clyffy
    ├── adapters/                     one file per protocol
    │   ├── mod.rs  acp_agent.rs  mcp_client.rs  openai_compatible.rs  anthropic.rs
    ├── acp/                          ACP client on the official `agent-client-protocol` crate
    │   ├── mod.rs  client.rs  sessions.rs
    └── discovery/                    where providers are found: one file per source
        ├── mod.rs  installed.rs  saved.rs  configured.rs  this_machine.rs  home_network.rs  private_network.rs
        └── mesh/tailscale.rs

systems/devpulse-engine/
├── config/copy.default.toml          one UI copy catalog (from wizard_copy.default.toml, trimmed)
├── config/onboarding/first-run.flow.toml
└── src/platform/
    ├── providers/mod.rs              facade over the kernel; publishes Providers + ProviderScan state
    ├── onboarding/{mod,flow,workflow,store,state}.rs   the first-run workflow
    ├── forms/mod.rs                  schema-driven inputs: schema export, suggestions, validation
    ├── github/{mod.rs,device_flow.rs}  GitHub sign-in (device flow); token in the OS keyring
    └── copy/mod.rs                   typed copy catalog

interfaces/desktop/src-tauri/src/commands/
├── providers/mod.rs  onboarding/mod.rs  github/mod.rs  copy/mod.rs   intents only, no logic

interfaces/desktop/src/lib/
├── design/blocks/schema-form/        renders a form from a schema with the existing form components
│   ├── SchemaForm.svelte  schema-form.types.ts  index.ts  SchemaForm.test.ts
├── domains/app/providers/            provider card + editor, shared by first run, the Model Loader and chat
│   ├── index.ts  util/  data-access/  ui/provider-card/  feature/provider-editor/
└── domains/app/onboarding/
    ├── index.ts  util/  data-access/
    ├── ui/{onboarding-shell,scan-source,scan-attempt}/    typed variants of base design blocks
    └── feature/first-run/
        ├── FirstRunFlow.svelte  first-run.tokens.json
        └── views/{WelcomeView,YouView,YourAiView}.svelte
```

## Part A — Phases

Rules for every phase:

- At most 5 files (mechanical renames excepted), and your approval between phases.
- Verification:
  - `cargo check -p` and `cargo xtask clippy -p` for each touched crate
  - `cargo xtask test -p` where tests exist
  - `pnpm check`
  - a grep for raw `invoke("…")` strings, which `pnpm check` cannot see
  - a live check in `cargo xtask run-dev`
- Every phase that writes data proves the row exists in the Turso database file
  with a query.

### A0 — Delete the old onboarding (your order: delete first)

One approval covers D1–D12 and D15–D18; each group is verified before the next
starts. (D13–D14 were wrong — they deleted your tiers, presets and Jesse config.
Those are made configurable in H1–H3 instead.)
Until A7, first run has no guided setup. The app still runs.

| # | What goes | Files | Check |
| --- | --- | --- | --- |
| D1 | Dead code | delete `models/data-access/baseline.state.svelte.ts`, `setup-wizard/download-bootstrap.ts`, `setup-wizard/feature/views/SlotSaveView.svelte`, `setup-wizard/ui/SaveSlotCard.svelte` | `pnpm check` |
| D2 | e2e specs whose selectors no longer exist | delete `e2e/wizard-{happy-path,completion,customize,search-browse}.spec.ts` | — |
| D3 | Unmount the wizard | edit `layouts/app/Frame.svelte`, `layouts/app/BootOverlay.svelte` (auto-open block), `domains/app/models/index.ts` | `pnpm check`; live: boot shows no wizard |
| D4 | Wizard core | delete `SetupWizardOverlay.svelte`, `index.ts`, `wizard.state.svelte.ts`, `views/ClyffyCollabView.svelte`, `views/CortexView.svelte` | `pnpm check` |
| D5 | Wizard views | delete `views/{Complete,Hardware,Installing,Preset,Welcome}View.svelte` | `pnpm check` |
| D6 | Wizard shell, tiles, types (folder gone) | delete `feature/OverlayShell.svelte`, `ui/AnatomyConstellation.svelte`, `ui/AnatomyTile.svelte`, `util/wizard.types.ts` | `pnpm check` |
| D7 | The wizard copy inside the Slots devtool | edit `SlotsDevtool.svelte`, `slots/index.ts` | `pnpm check`; live: Slots devtool still lists and assigns |
| D8 | Its files | delete `slots-bootstrap.state.svelte.ts`, `slot-anatomy.ts`, `anatomy.types.ts`, `slots/ui/AnatomyConstellation.svelte`, `slots/ui/AnatomyTile.svelte` | `pnpm check` |
| D9 | Its files | delete `slots/ui/SaveSlotCard.svelte`, `slots/ui/BootstrapBackdrop.svelte` | `pnpm check` |
| D10 | Dead bindings and ids (the preset bindings stay for H3) | edit `sys/bindings/models/index.ts`, `sys/action-ids.ts` (26 `wizard.*` ids, never dispatched), `sys/activity-hud/knowledge-drops.ts`, `sys/runes/platformState.svelte.ts` (2 dead getters) | `pnpm check` |
| D11 | Wizard-only commands (`is_first_run`, `mark_setup_complete`, `is_setup_complete`, `complete_model_setup`, `create_dev_profile`) + the interaction command. **The preset commands stay** (`auto_configure`, `list_presets`, `config_for_tier`, `get_tier_display`); H3 rewrites them | edit `src-tauri/src/commands/models/mod.rs`, `lib.rs`, `commands/mod.rs`; delete `commands/interactions/mod.rs` | `cargo check -p devpulse_desktop_backend`; bindings regenerated; `pnpm check` |
| D12 | Kernel interaction templates | delete kernel `interactions/mod.rs`, `config/interactions/{setup,welcome-back}.default.toml`; edit kernel `lib.rs`, engine `platform/mod.rs` | `cargo check -p devpulse-clyffy -p devpulse-engine` |
| D15 | Profile: the columns stay and get their real owners. Remove only the hardcoded values (`'32g_engineer'` default, the dev seed's `'claude-sonnet-4-6'`), the skill picker, and the never-read `hardware_profile` table | edit engine `relational.rs`, Tauri `commands/devpulse/profile.rs`, `lib.rs` (dev seed), `profile-settings.state.svelte.ts` (typed bindings), `(app)/devpulse/settings/+page.svelte` | a fresh `.userdata` boots; settings page loads |
| D16 | Chat window, UI side: real minimize, typed commands, no auto-open after boot | edit `layouts/chat/components/shell/Frame.svelte`, `routes/+layout.svelte`, `layouts/app/TopBar.svelte`, `sys/runes/global.svelte.ts`, `sys/bindings/window/index.ts` | `pnpm check`; raw-invoke grep empty |
| D17 | Chat window, Rust side: normal top-level window; legacy `open_chat_window` / `close_window` deleted; the hotkey uses `open_window(Chat)` | edit `commands/window/mod.rs`, `commands/window/types.rs`, `lib.rs` | live: chat minimizes to the taskbar, main stays usable, closing chat leaves the app running |
| D18 | Stale instructions that would steer agents wrong | edit `CLAUDE.md` (devtool registry path; compiled-in inference line; libSQL → Turso), `ONBOARDING-CASCADE.md` (banner: settled item 9), mark `09-connection-slices/slice-C4-connection-mode-real.md` and the `08` / `09` INDEX rows superseded | your review |

### A1 — Move to Turso (DevPulse's dedicated database)

Only the kernel depends on the `libsql` crate. One adapter module
(`cortex/persistence/libsql/mod.rs`) does the work, about 12 files call it, and
the rest are names, config keys and paths. The port follows `f3748059`.

| # | Outcome | Files | Check |
| --- | --- | --- | --- |
| T1 | `turso` 0.8.1 replaces `libsql`; the kernel persistence adapter rewritten on Turso | workspace `Cargo.toml`, kernel `Cargo.toml`, kernel `cortex/persistence/turso/mod.rs` (from `libsql/mod.rs`), `cortex/persistence/mod.rs`, `cortex/adapters/persistence/turso.rs` (from `libsql.rs`) | kernel persistence tests pass on Turso; an existing `.db` file opens as-is |
| T2 | Engine call sites | engine `services/{project_db,relational,project_init,model_loader}.rs`, `integrations/config.rs` | `cargo check -p devpulse-engine`; live: the boot log shows the system and user DBs opened through Turso |
| T3 | Remaining call sites | Tauri `commands/devpulse/profile.rs`, `commands/projects/mod.rs`, `commands/sys/relational.rs`; kernel `llguidance/system_libsql.rs`; engine `vision/sinks.rs` | live: profile and projects read and write |
| T4… | Rename `LibSql*` identifiers, `libsql` config keys and `.userdata/*/libsql/` paths | mechanical groups of ≤10 files, listed at T4 start from separate searches: identifiers, strings, config, tests, docs | grep: `libsql` gone from code and config |
| T5 | Project data moves into the DevPulse folder (`.userdata/projects/<id>/project.db`) | engine `services/{project_db,project_init}.rs` | registering a project writes nothing inside the project |
| T6 | Versioned migrations | engine `platform/db/migrations/` (numbered SQL), `platform/db/migrate.rs`, `services/relational.rs` | tests: a fresh DB and an existing DB reach the same schema; history listed |
| T7 | The database devtool on Turso: see every table and its schema, browse and edit rows in plain language (R-D10), see migration history | Tauri `commands/sys/relational.rs`, the existing database devtool under `lib/devtools/` (rewritten, not a new one), `devtools/registry.ts` | live: you open the devtool, edit your profile row, and first run shows the change |

T6 follows the Rails / Django / sqlx / refinery pattern: numbered SQL files
applied in order and recorded in a `schema_migrations` table. The schema
changes in this plan (profile columns, providers, calibration) arrive as
migrations, never as ad-hoc `CREATE TABLE`.

### A2 — Schema-driven inputs (one pattern, built once)

| # | Outcome | Files | Check |
| --- | --- | --- | --- |
| S1 | `schemars` to latest stable; JSON Schema validation; engine `forms` module: a form = schema + copy keys + suggestions; `validate` returns per-field errors | engine `Cargo.toml`, `platform/forms/mod.rs`, `platform/mod.rs` | tests: an invalid payload → per-field errors; a valid one → typed value |
| S2 | `SchemaForm` design block: renders `Form` / `FormField` / `TextField` / `Combobox` / folder field from the schema, offers suggestions, shows Rust's field errors | `design/blocks/schema-form/{SchemaForm.svelte,schema-form.types.ts,index.ts,SchemaForm.test.ts}` | component test with a fixture schema; no validation logic of its own |

### A3 — You: name, GitHub, projects folder (engine)

| # | Outcome | Files | Check |
| --- | --- | --- | --- |
| Y1 | Profile input: name with suggestions (git config, then GitHub); written to your profile row in place | engine profile service (`services/relational.rs`), `platform/forms` profile schema, Tauri `commands/devpulse/profile.rs` | live: submit → the row in Turso shows the value; an invalid name → field error, nothing written |
| Y2 | GitHub sign-in through GitHub's device flow (the documented method for desktop apps); the token lives only in the OS keyring | engine `platform/github/{mod.rs,device_flow.rs}`, Tauri `commands/github/mod.rs`, `Cargo.toml` (`octocrab` latest stable) | live: sign in with your account → login and avatar shown; the token is in the keyring and nowhere in Turso or files |
| Y3 | Projects folder | engine projects service, `platform/forms` projects schema, Tauri `commands/projects/mod.rs` (reuses `pick_directory`, `add_project_reference`) | live: pick a folder → your repos listed → registered in Turso, nothing written inside them |

| Y4 | Detection starts at Welcome: git identity, project folders and installed providers are looked for in the background, each publishing as it is really found | engine `onboarding/detect.rs`, `signals/{payloads,variants}.rs` | live: chips appear in the order things are actually found |
| Y5 | Profile snapshot: languages and frameworks across the added projects (tokei + manifest detection) plus the GitHub summary, written as the profile snapshot | engine `platform/projects/snapshot.rs`, `Cargo.toml` (`tokei` latest stable), profile migration | live: the Done screen numbers match `tokei` run by hand on the same folders |
| Y6 | Configurable hotkeys: chat and dashboard shortcuts stored in Turso, registered from there, changeable from the Done screen and settings | Tauri `lib.rs` (global shortcut registration), engine profile settings, migration | live: change Ctrl+Shift+Space → the new shortcut opens chat after restart |

Y3 suggests folders that hold repos, scans the chosen folder for git
repositories, lists DevPulse itself first, and registers the ones you tick, in
place.

### A4 — Providers and adapters (kernel; one schema for everything you bring)

| # | Outcome | Files | Check |
| --- | --- | --- | --- |
| R1 | `ProviderDefinition` schema + catalog; built-in definition files; an invalid definition is rejected with its reason | kernel `providers/{mod.rs,definition.rs,catalog.rs}`, `config/providers/*.toml` (mechanical data files), kernel `lib.rs` | tests: every bundled definition validates; a broken one names the field |
| R2 | Your providers in Turso: kernel-owned tables, update in place, history for undo | kernel `providers/store.rs` | tests on a temp Turso DB |
| R3 | Detection: installed? version? signed in? | kernel `providers/discovery/{mod.rs,installed.rs}` | live: this machine's real answer for each of the six |
| R4 | ACP client on the official `agent-client-protocol` crate + the `acp_agent` adapter | kernel `providers/acp/{mod.rs,client.rs,sessions.rs}`, `providers/adapters/{mod.rs,acp_agent.rs}` | tests against a scripted agent; live: one real prompt through an agent you have signed in |
| R5 | Custom endpoints: the `openai_compatible` and `anthropic` adapters with honest handshakes | kernel `providers/adapters/{openai_compatible.rs,anthropic.rs}`; delete engine `onboarding/probes/` | tests against a local mock server; live: a real server (local or GB10) → verified with its model list |
| R6 | Discovery ladder for endpoints | kernel `providers/discovery/{saved,configured,this_machine,home_network,private_network}.rs` + `mesh/tailscale.rs`, kernel `Cargo.toml` (`mdns-sd`, `url`, latest stable) | live: each source shows its true result |
| R7 | Live status | kernel `providers/supervisor.rs` | tests: a re-point mid-check never publishes the old address; live: stop a server → `unreachable{refused}` within one interval |
| R8 | Claude Desktop through MCP: offer, with your click, to give it DevPulse's context | kernel `providers/adapters/mcp_client.rs` | live: Claude Desktop lists DevPulse's MCP server after you accept |
| R9 | Updates: installed vs latest version per provider; Update runs the vendor's own updater | kernel `providers/definition.rs`, `providers/mod.rs` | live: the versions shown match `--version` output |
| R10 | `ai_providers` rewritten into definitions; its enum and hardcoded URLs deleted | delete engine `ai_providers/{mod,registry,types}.rs`; edit Tauri `commands/{credentials,cloud,providers}/mod.rs` | the credentials UI lists the same providers |
| R11 | Engine facade + signals: `Providers` and `ProviderScan` state (revisioned, replayed to late windows) | engine `platform/providers/mod.rs`, `signals/{payloads,variants,spec}.rs`, `tests/signal_contract.rs` | contract snapshots; live: a scan streams revisions in the session log |

Detail for the larger rows:

- **R3** checks Grok Build, Claude Desktop, Claude Code, Gemini CLI, Cursor and
  Codex, each through its definition file.
- **R5 handshakes** report:
  - every protocol that matches, not just the first;
  - `unreachable` with a reason: refused, timeout, dns or tls;
  - latency;
  - the status code, checked before the body is decoded.
- **R6 discovery:**
  - sources run in order: saved, configured, this machine, LAN (mDNS), private mesh;
  - only addresses a source found are probed, each as it arrives;
  - there is a hard cap on candidates;
  - every source reports done, skipped or failed, with a reason.
- **R7 status:** one task per provider, a generation counter, backoff with a
  configurable ceiling, and a saved choice beats config.

### A4b — Hardware presets as configuration (your seed configs; nothing hardcoded)

The presets already live in TOML (`kernel/model-loader/config/presets.default.toml`,
overridable by `.userdata/config/presets.toml`). What is hardcoded is the
`HardwareTier` Rust enum: its names, including `JessePrimary`, the VRAM
thresholds in `detect_tier`, and the display names. Nothing here is deleted.
The rules move into the presets, and your configs become seed presets you
select (R-A26, R-B14, R-G6).

| # | Outcome | Files | Check |
| --- | --- | --- | --- |
| H1 | Each preset declares its own id, name (copy key), hardware match rule (VRAM / RAM / GPU vendor ranges) and suggested models. The `HardwareTier` enum and the `detect_tier` thresholds leave the code; matching reads the presets | kernel `hardware/{auto_config.rs,presets.rs}`, `config/presets.default.toml`, `models/recommender.rs` | tests: every bundled preset matches the hardware it says it does; grep: no tier names or VRAM thresholds in `.rs` |
| H2 | Your presets: `.userdata/config/presets.toml` adds to and overrides the bundled ones by id (merge, not full replace) | kernel `hardware/presets.rs`, `config/presets.default.toml` | tests: your preset wins by id; live: your Jesse config is listed and selectable |
| H3 | Commands rewritten on the data: `list_presets`, `suggest_for_hardware` (from `auto_configure` + `config_for_tier`), `get_tier_display` → preset display from copy | Tauri `commands/models/mod.rs`, `lib.rs`, engine `services/model_loader.rs`, kernel `wizard/tier_display.rs` → preset display | bindings regenerated; live: the Model Loader and the Your AI screen list your presets |

H2 details:

- `JessePrimary` is deleted from the code. No personal names ship.
- Bundled presets are named for what they are (for example, the 16 GB GPU
  preset), with copy keys.
- Your own configurations are your presets in `.userdata/config/presets.toml`,
  saved from the UI.
- Selecting a preset fills suggestions only. Nothing downloads or loads until
  you apply each item (R-A27), and you can always go back (undo).

### A5 — The Clyffy adapter

| # | Outcome | Files | Check |
| --- | --- | --- | --- |
| K1 | Clyffy's power, stored in Turso and published as a signal; `routing_config`'s Claude-only lanes deleted | kernel `providers/clyffy.rs`, engine `services/routing_config.rs`, `signals/{payloads,variants}.rs` | tests: endpoint beats subscription; no provider → honest "not powered"; live: Clyffy answers through the chosen provider |

The resolution order is:

1. A custom endpoint you provided (a local LLM, a GB10).
2. Otherwise the one subscription you dedicate to Clyffy. The suggestion is the
   first signed-in agent found.

### A5b — Teach Clyffy how you talk (calibration)

| # | Outcome | Files | Check |
| --- | --- | --- | --- |
| L1 | Calibration: Clyffy fills a few interactive cards through the provider powering him; your answers are stored as calibration samples for plan 0004 C | engine `onboarding/calibration.rs`, migration, copy keys | live: the cards are generated by the real provider; your text is in Turso |

### A6 — Copy, flow and intents (engine, Tauri)

| # | Outcome | Files | Check |
| --- | --- | --- | --- |
| O1 | One UI copy catalog: the live sections (sign-in, downloader, runtime picker) plus first run and providers; no model names | engine `platform/copy/mod.rs`, `config/copy.default.toml`, Tauri `commands/copy/mod.rs`, `lib.rs` | every section loads; your override file wins |
| O2 | Readers switch to it | `ModelDownloaderOverlay.svelte`, `LoginShell.svelte`, `EmbedderPicker.svelte`, `sys/bindings/copy/index.ts`, `sys/bindings/models/index.ts` | `pnpm check`; live: same text |
| O3 | The old copy path goes: `get_wizard_copy` and kernel `model-loader/src/wizard/` (analytics moves out) | Tauri `commands/models/mod.rs` + `lib.rs`, kernel `wizard/{mod,copy}.rs` → `analytics.rs`, engine `services/model_loader.rs` | grep: the kernel no longer `include_str!`s an engine file |
| O4 | Flow and progress in Turso: the bundled flow TOML (screens, order, gates); decided, completed, current screen | engine `onboarding/{flow.rs,store.rs,state.rs}`, `config/onboarding/first-run.flow.toml` | tests: gates, resume after a kill, your flow override wins |
| O5 | The workflow publishes `Onboarding` state for stages 0–5 and the checklist: start, choose, skip, back, continue, reopen; checklist items complete only on their real signal | engine `onboarding/{workflow.rs,mod.rs}`, `signals/{variants,spec,payloads}.rs` | tests for every transition; contract snapshot |
| O6 | Tauri intents: no logic, no emits | `commands/{onboarding,providers}/mod.rs`, `commands/mod.rs`, `lib.rs`, kernel `service.rs` (the old setup flag goes) | bindings regenerated; `pnpm check` |

### A7 — First run UI (Svelte drives Rust; ColdLight)

Rules for every screen:

- No string literals in `.svelte` files.
- No hand-written CSS; visuals come from ColdLight presets and `data-*` attributes.
- Tailwind for layout only.
- Every component is a typed variant of a base design block.

| # | Outcome | Files | Check |
| --- | --- | --- | --- |
| U1 | Providers domain data: types, state from signals, intents | `domains/app/providers/{index.ts,util/providers.types.ts,data-access/providers.state.svelte.ts,data-access/providers.service.ts}`, `sys/bindings/providers/index.ts` | state test: applies only newer revisions |
| U2 | Provider card and editor (add a custom endpoint, or an API key into the keyring) | `providers/ui/provider-card/{ProviderCard.svelte,provider-card.types.ts,index.ts}`, `providers/feature/provider-editor/ProviderEditor.svelte` | live: a bad address shows its real reason |
| U3 | Onboarding domain data | `domains/app/onboarding/{index.ts,util/onboarding.types.ts,data-access/onboarding.state.svelte.ts,data-access/onboarding.service.ts}`, `sys/bindings/onboarding/index.ts` | state test |
| U4 | Boot: Clyffy spinner, real stage narration, rotating knowledge drops from the DB | `layouts/app/BootOverlay.svelte` (rewritten), the existing loading-content card | live: each narration line matches a `boot` signal |
| U5 | Welcome: Clyffy's first page with the detection chips | `onboarding/ui/onboarding-shell/{OnboardingShell.svelte,onboarding-shell.types.ts,index.ts}`, `views/WelcomeView.svelte`, `first-run.tokens.json` | Playwright screenshots at three window sizes |
| U6 | You: GitHub, name and email, projects folder, through `SchemaForm` with suggestions | `views/YouView.svelte`, `feature/first-run/FirstRunFlow.svelte` | live: each value lands in Turso; invalid input is refused per field |
| U7 | Your AI: subscriptions, servers (scan rows + attempts), run-on-this-machine presets, who powers Clyffy | `onboarding/ui/scan-source/*`, `onboarding/ui/scan-attempt/*`, `views/YourAiView.svelte` | live: every line on screen matches a logged attempt |
| U8 | Teach Clyffy how you talk | `views/CalibrationView.svelte`, `onboarding/ui/calibration-card/*` | live: cards come from the real provider |
| U9 | Done: snapshot and hotkeys | `views/DoneView.svelte`, `onboarding/ui/snapshot-stat/*` | live: snapshot matches Turso; a changed hotkey works |
| U10 | Getting Started checklist, re-entry chip, StatusBar power badge | `onboarding/feature/checklist/GettingStarted.svelte`, `layouts/app/{Frame,TopBar,StatusBar}.svelte`, `routes/(app)/onboarding/+page.svelte` | live: an item ticks only after its real signal; skip → chip → back in |
| U11 | End to end | `e2e/onboarding-first-run.spec.ts` | Playwright passes on a clean `.userdata` |

What each screen shows:

The screens follow "First run — the full experience" above, stage by stage.
Visual identity: blue shell, purple body, teal wells; crisp edges, no halos
(R-F4, R-F7).

### A8 — Your checkpoint

You run first run on a clean DevPulse folder. Nothing else starts until you
sign it off (R-H7, R-H8).

## Part L — Everything on its latest stable release (owner 2026-10-18)

> "why not update everything to the latest and let errors surface and properly
> read the plans and notes … only you fix your … hardcoded … instead of just
> clean endpoints and ability to just sign in"

Order you set: dependencies first, errors surfaced and fixed, then the
endpoint and sign-in work (the Account step, slices 4–5 of Part A, and plan
0007 decision 5). R-G11, ruling 2(b).

**Survey, 2026-10-18** (worktree `../platform_devpulse-latest`, everything
bumped at once, the main branch untouched):

- npm: 81 packages behind, 30 by a major. Rust: 37 of 101 direct crates
  behind by a major; toolchain pinned at 1.92.0 (pin comment: Burn), latest
  stable 1.99.1.
- Not taken: `typescript` 7 (SvelteKit 3 peers on `^6`; svelte-check needs 6
  installed beside 7 plus `--tsgo`; typedoc stops at 6) → **6.0.3**, the
  newest the toolchain supports. `prisma` "latest" is `8.0.0-rc.23` → **7.10.1**.
  `specta` / `tauri-specta` stay on `2.0.0-rc` (the "stable" 1.x is older and
  pre-Tauri 2).
- Not upgraded, deleted instead (plan 0007 decision 5): candle, burn,
  tokenizers, safetensors, piper-rs, the `ort` / `tar-rs` / `qwen3-tts-rs`
  forks, `deps/llama-cpp-rs`, `deps/moshi`.
- Errors surfaced (each layer hides the next):
  - SvelteKit 3: `svelte.config.js` is no longer read (config moves into
    `sveltekit({...})`); `tsconfig` must extend `$app/tsconfig` with
    `$app/types`; **`$lib` is removed → `#lib` subpath imports** (1,844 imports
    in 778 files, mechanical); hook types move to `@sveltejs/kit/hooks`.
  - Vitest 5: `test.browser.api` → `test.api`; dependency optimizer error
    (re-checked after the config moves).
  - Rust: `hf-hub` 1 dropped `tokio` (only under the `candle` feature);
    `reqwest` 0.13 renamed `rustls-tls` → `rustls`; OpenTelemetry 0.33 changed
    `shutdown_with_timeout` (`devpulse-telemetry`); `ureq` 3 removed
    `AgentBuilder`, `cargo_metadata` 0.23 `PackageName` (`xtask`). Crates
    downstream of telemetry are reached once it builds.

| # | Outcome | Main files | Check |
| --- | --- | --- | --- |
| L1 | Rust 1.99.1 + every compatible lockfile update; new lints fixed, none allowed | `rust-toolchain.toml`, `Cargo.lock`, the fixes | `cargo xtask clippy --workspace -- -D warnings`; tests |
| L2 | Rust majors for the crates that stay (reqwest, rmcp, rand, keyring, sysinfo, toml, opentelemetry, tree-sitter, wgpu, rodio, rfd, ureq, …) with their code fixed | the 7 manifests + call sites | same; live boot |
| L3 | (after plan 0006 C0–C2, ColdLight's package boundary) SvelteKit 3, Vite 8, vite-plugin-svelte 7, adapter-static 4, TypeScript 6: config into `sveltekit({...})`, `$app/tsconfig`, `$lib` → `#lib` (mechanical), hook types | `vite.config.ts`, `tsconfig.json`, `package.json`, `svelte.config.js` deleted, the import rewrite | svelte-check 0 errors; arch + unit tests; `vite build`; all 44 pages load live |
| L4 | Vitest 5 family, jsdom, testing-library | `vitest*.ts`, `package.json` | tests pass |
| L5 | The remaining npm majors: lucide-svelte 1, TanStack Table 9, msw 3, three, pragmatic-drag-and-drop 4, commitlint 21, the docs scripts (chalk, glob, ts-morph) | call sites per package | checks + live |
| L6 | `cargo xtask deps`: one report of outdated Rust and npm packages, so this stays routine (ruling 2(b)) | `xtask/src/deps.rs` | the report matches this survey |

Each phase is committed on `feat/deps-latest` with every hook passing and the
runner verifying it, then fast-forwarded onto `restore/pre-gb10`.

## Part B — Subscriptions in one chat (ACP)

### How shipping products do it (verified 2026-10-12)

**Zed** and **JetBrains** host coding agents through the **Agent Client
Protocol**. Each agent runs as its own process speaking JSON-RPC over stdio,
and "owns its own authentication and billing" (Zed docs). The client renders
what the agent streams and never sees a subscription token. It is also the only
pattern inside every vendor's current terms:

| Subscription | Agent (ACP) | Sign-in | Never do |
| --- | --- | --- | --- |
| Claude | unmodified Claude Code, via Zed's `claude-agent-acp` adapter | Claude Code's own flow | our own Claude.ai login; routing requests through subscription credentials (incl. the Agent SDK); storing tokens; Claude/Anthropic names or logos as our branding |
| Codex / ChatGPT | Codex CLI via `codex-acp` (or Codex `app-server`) | Codex's own ChatGPT login | a DevPulse-owned ChatGPT sign-in without OpenAI's "Sign in with ChatGPT" partner access |
| Gemini | Gemini CLI (native ACP) | Gemini CLI's own Google login, or API key / Vertex | using Gemini CLI's OAuth from any other tool (suspension) |
| Cursor | `agent acp` (official) | Cursor login or API key | — |
| Grok | Grok Build (ACP, per xAI's docs) | Grok Build's own browser login, or `XAI_API_KEY` | — |

Sources:

- Claude Code legal & compliance
- OpenAI "Sign in with ChatGPT" docs
- Gemini CLI ToS
- Cursor CLI ACP docs
- docs.x.ai/build/overview
- agentclientprotocol.com
- Zed external agents docs

Enforcement precedent: OpenCode's Claude OAuth was cut off Jan–Feb 2026, and
Google suspended accounts for Gemini CLI OAuth proxies.

### Design

- **One chat.**
  - One thread list; each thread picks an agent.
  - Every agent streams the same ACP `session/update` kinds, so one renderer serves all.
  - Updates go over a typed `Channel<T>` per thread.
  - `session/load` restores history.
- **Maximized subscriptions = shared context.** `session/new` takes
  `mcpServers`, so every session gets DevPulse's own MCP server (profile,
  project knowledge, Knowledge Drops).
- **Permission prompts teach.** `session/request_permission` becomes a UI
  intent, explained in plain language.
- **Auth stays with the agent.** No token ever enters DevPulse storage.

### Phases (after Part A is signed off; the ACP client is built in A4)

| # | Outcome | Live check |
| --- | --- | --- |
| B1 | Agents run through plan 0007's runtime adapter; install from the ACP Registry with a digest check | install → run → stop an agent from the UI; nothing left running after app exit |
| B2 | Engine facade + Tauri intents (start thread, prompt, cancel, answer permission); updates over typed `Channel<T>`; threads in Turso | prompt → streamed reply; restart → `session/load` restores the thread |
| B3 | One chat UI: thread list, agent picker, renderer for chunks / tool calls / plans / permission prompts | the same question to Claude, Codex, Gemini, Cursor and Grok in one window |
| B4 | DevPulse MCP server attached to every session | each agent answers with context only the MCP server has |
| B5 | Your checkpoint | your sign-off |

### Part B rewritten 2026-10-21 — built from the code you already have

Owner, 2026-10-21: "codex, claude, antigravity, grok … properly bundled so as
they update them the user gets notified … channels, roles/slots to assign …
maximize their subscription, have agenthub properly … 80% of my code is not
even loading … you keep just making new shit". And: local AI must be
"properly configurable so they could have endpoints like any other tool".

**What three read-only surveys found (2026-10-21):**

- **Chat in DevPulse cannot answer today**, endpoints aside:
  - the "brain ready" gate never opens (nothing sets a slot `ready`);
  - the UI listens for `inference-token` while Rust emits
    `inference-token-streamed` / `llama-token-streamed`;
  - only the last message is sent;
  - the llama-server sidecar has not spawned since `38309aaa`.
- **What is loaded:** about 71% of the app's code is compiled and reachable,
  but 9 recent launches invoked only **20 of 287** Tauri commands.
  - 58 commands have no caller, including the existing `credentials`,
    `providers`, `cloud` and `routing` surfaces.
  - ColdLight is 60% unreachable: 53 of 94 component folders, among them
    sidebar, popover, combobox, tree and toaster, which a channels UI needs.
  - The MCP SSE server is configured (port 9315) but nothing starts it.
- **Endpoint pieces already here, unconnected:**
  - an OpenAI-compatible streaming client (`commands/llama::llama_chat`,
    fixed to 127.0.0.1);
  - an endpoint probe that accepts any URL and lists models
    (`onboarding/probes::identify`, no callers);
  - the OS keyring (`commands/credentials`);
  - fixed seeds for Ollama :11434, LM Studio :1234 and vLLM :8000
    (`ai_providers`);
  - the llama-server settings card.
- **Six overlapping "provider" concepts**, the 2026-10-20 kernel `providers`
  module among them. This plan's R10 already says kernel definitions win
  (old code included first).
- **Your chat work in devpulselabs** (`D:\projects\devpulselabs`, an egui
  content studio, chat pillar parked) is **UI-free Rust**, about 14k lines:
  - `dpl-chat-core`: rooms/roles schemas plus a library of 11 roles and 5
    rooms (RM1, verified);
  - the Codex `app-server` runtime with signed adoption + update (CW1,
    verified);
  - the Grok ACP runtime;
  - Claude/Codex session readers (`dpl-chat-store`);
  - the `ProviderRuntime` interface;
  - the tool depot.

  Its plans already rule Claude Code = `claude -p` stream-json (CW2) and
  Antigravity = `agy` headless stream-json (R280/R281). Neither is built
  there yet. The old AgentHub (`/agent` "Council of C" console) was the
  Tauri + React app now at `D:\localdev\review-archive\devpulse labs`.

**Rulings needed:**

- **D1 — where the chat engine comes from.**
  - Recommended: DevPulse's kernel depends on the devpulselabs chat crates
    at a pinned git rev. One source; no copies.
  - Alternatives: copy them in, or keep building here, which duplicates them.
- **D2 — confirm R10.** Kernel definitions plus a user store
  (`kind = endpoint`, `adapter = openai_compatible`) are the one provider
  model. The older pieces above are moved in and wired, not rewritten.

**Phases** (each live-checked, committed, pushed):

| # | Outcome | Existing code it wires in | Live check |
| --- | --- | --- | --- |
| B0 | Chat answers | readiness from the capability channel; the token event names Rust already emits; history through `llama_chat`'s message list; the sidecar's external-program listing restored | a streamed reply in the chat window |
| B1 | Local AI = configurable endpoints (plan 0007 stage 2) | `llama_chat` generalized (base URL, model, key) and moved to the kernel; `identify` moved to the kernel (R5); `ai_providers` seeds become preset definitions; keyring via `credentials` (billing gate and Turso mirror fixed, `get_api_key` no longer exposed); slot → endpoint in Turso; the Ollama devtool editable | chat.brain answers through Ollama / LM Studio / your GB10 by URL |
| B2 | Your AI notices updates, Antigravity listed | kernel provider checks at boot and on a timer → the notification centre; an Antigravity definition | a newer version shows as a notification |
| B3 | Each subscription in chat (D1) | Codex `app-server` + adoption/update, Grok ACP, Claude Code stream-json, Antigravity `agy` headless; threads in Turso | the same question to Claude, Codex, Grok and Antigravity in one window |
| B4 | Rooms (channels) and roles | `dpl-chat-core` rooms/roles library + your files; seats take a subscription or an endpoint; ColdLight's unused sidebar / popover / combobox / tree / toaster | a Council room with two agents in seats |
| B5 | AgentHub | `dpl-chat-store` + the Claude / Codex decoders: every session on disk, plus live threads; the old React console's design in Svelte | your real Claude Code and Codex sessions listed |
| B6 | Your context in every session | the configured MCP SSE server started; `session/new` `mcpServers` | an agent answers with DevPulse-only context |
| B7 | Your checkpoint | — | your sign-off |

**Owner rulings 2026-10-21:**

- **D1:** "Build it here". The chat engine is built in platform_devpulse,
  not taken from devpulselabs.
- **D2:** "Engine `ai_providers`". The engine's `ProviderId` registry is the
  one provider model. The 2026-10-20 kernel `providers` module's detection,
  version, update, sign-in and Try-it fold into it. This replaces R10's
  "kernel definitions win".
- **Order:** "B3 subscriptions first".
- **Location:** "Move `ai_providers` to the kernel". It moves into the
  kernel's `providers/` with its git history. The kernel's detection, update
  and Try-it code folds into it there. The engine keeps a thin
  `ai_providers` re-export, and the AI-in-kernel rule holds.

### Owner vision, 2026-10-21 (verbatim) and where each part stands

> "devpulse is suppose to be my portable devspace for vibecoders that want
> to truly learn terminology, and receive a2ui experiences and see what the
> really really smart people are doing. That means we need to make it
> effortless for them and my schemas and how I envision is the best
> solution for this. we ask clear questions; we make it effortless to add
> connectors, we ask if they already have github if not we offer to get
> them started on that. When a new project is being created we use the
> answers to configure RRFLOW the reasoning engine i.e if project X must
> never share context with project Z to ensure it we spin down the instance
> in the reasoning engine, if they do share they all stay up; if they want
> it to be deployable we recommend docker or podman, and if they need a
> true kernel access we recommend docker, if its just a service we offer
> podman; codex, claude, muse, grok, custom providers, and the other big
> frontierAI can easily be added and then agenthub board makes it easy to
> share state and have AI work with other. Chat is suppose to make it easy
> to assign roles and personas and mix subscriptions in unique shared state
> chat environments"

| Part | Today (checked 2026-10-21) | Gap |
| --- | --- | --- |
| Clear questions | First run asks You, Your AI, Your dev environment | — |
| GitHub: have it? else get started | Only detects `~/Documents/GitHub` | No GitHub question, no `gh` sign-in check, no "get started" offer |
| New project → RRFlow: isolated projects spin their instance down, sharing ones stay up | Projects exist; no new-project questions; **no RRFlow code in this repo at all** | New-project questions; RRFlow supervised, one instance per project, up or down by your sharing answers |
| Deployable → Docker or Podman; true kernel access → Docker; just a service → Podman | Containers stage advises per machine (usage, GPU, desktop app) | Your rule, asked per project: deployable? needs kernel access? |
| Codex, Claude, Muse, Grok, custom, other frontier AI easily added | Registry has Claude Code, Codex, Grok Build, Antigravity (CLI + IDE), Gemini CLI, Cursor CLI, Claude Desktop | Muse not identified yet; adding a custom provider from the UI; endpoints (B1) |
| AgentHub board: shared state, AI working with each other | — | B5 |
| Chat: roles, personas, mixed subscriptions in shared-state rooms | Threads with one agent each work (B3) | Rooms with seats (role + persona + agent), shared state between them (B4) |
| Learn terminology; A2UI experiences | Layman/advanced term list (owner 2026-10-19); `a2ui` signal family | Not yet in chat or project flows |

### B3 — each subscription in chat (first; phases)

Facts it rests on (2026-10-21):

- `ai_providers` has `AnthropicSubscription` (dev-only, MCP) but no Codex,
  Grok Build, Gemini CLI, Cursor or Antigravity entry.
- The kernel ACP client (`providers/connect/acp.rs`, official SDK 3.4.0) is
  one-shot: one process per question.
- Chat sessions/turns are in Turso, but a session has no agent.
- On this machine:
  - Claude Code 2.1.296 and Codex 0.163.0 (+ codex-acp 2.2.2 in the
    DevPulse folder) are installed and signed in.
  - Grok Build is not installed.
  - Antigravity's IDE is installed (1.104.0); its headless agent CLI `agy`
    is not.

| # | Outcome | Live check |
| --- | --- | --- |
| B3.1 | `ProviderId` gains Claude Code, Codex, Grok Build, Gemini CLI, Cursor, Antigravity (CLI and IDE) and Claude Desktop. Each row carries how DevPulse reaches it (ACP over stdio, the vendor's headless stream-json, or a connector) and how it is found, versioned, updated and signed in, folded in from the kernel definitions. | `list_provider_status` shows this machine's truth for every row |
| B3.2 | Agent sessions: one live process per thread (ACP `session/new` → many `session/prompt`, streamed `session/update`; Claude Code and `agy` through their stream-json mode), permission requests surfaced, cancel and close. | a two-turn conversation with Codex keeps its context |
| B3.3 | Threads: a chat session names its agent; turns record it; prompt / cancel / close intents; streamed chunks as events. | restart DevPulse → the thread and its agent come back |
| B3.4 | Chat window: agent picker per thread; streamed replies; the local-brain gate applies only to local threads (the token-event fix from B0 lands here). | the same question to Claude Code, Codex and Antigravity in one window (Grok once installed) |
| B3.5 | Your checkpoint | your sign-off |

### B4 — rooms, roles and personas (phases)

Owner rulings 2026-10-21: "Rooms, roles, personas" next, then the AgentHub
board. **Persona = full character**: a persona carries its own backstory
and expertise, added to the role's prompt. Your research found this adds
nothing to accuracy; the choice is recorded as yours.

Facts it rests on (2026-10-21):

- **Your design, in devpulselabs** (read-only; built here per D1):
  - `schemas/role.v1.schema.json` (`dpl.role/1`) and
    `schemas/room.v1.schema.json` (`dpl.room/1`).
  - 11 roles and 5 rooms in `crates/chat/core/library/`, commit 4ee638b.
  - The rules a schema cannot say are in `crates/chat/core/src/rooms.rs`:
    - a seat names a real role, and fills that role's parameters;
    - a selection seat is a selecting role, and a selecting role forbids
      merging (select, never blend);
    - a user file replaces a bundled one only with a higher version.
  - The evidence every entry cites: `docs/research/chat-rooms-and-roles.md`.
  - None of this text hits the vocabulary lint.
- **Persona code in this repo:**
  - `cortex/minions/types.rs` holds `Persona { name, role, voice_tone,
    instructions }` and `VoiceTone`. The file is in no module tree.
  - `cortex/persona/mod.rs` points at a `persona.rs` that no longer exists.
  - The `devpulse-persona-mcp` crate removed in c6ce222c held memory blocks
    (what Clyffy keeps about you and a project), not seat characters. It
    belongs to B6, your context in every session.
  - No persona character files exist in either repo, so none ship. You
    write yours.
- **The room's shared state is its chat session.** `turns` already carries
  `model_used` and a JSON `metadata`. Each seat's answer is a turn saved
  with:
  - its seat, role, persona, phase and round;
  - its structured output.

  Each seat keeps its own B3 agent thread, so a subscription keeps its own
  context.

**B4.1 — the library in the kernel (`rooms/`).**

- Your role and room types and rules. Your 11 roles and 5 rooms are bundled
  as JSON under `config/`, with your research in `docs/research/`.
- `Persona` and `VoiceTone` move into `rooms/persona.rs`, extended with id,
  version, name, summary, tone, backstory and expertise.
- Your files in `{data_dir}/config/{roles,rooms,personas}/` are validated,
  and problems are reported.
- Live check (kernel tests):
  - every bundled file passes its schema and its rules;
  - every cited source is in the research;
  - a broken or same-version file of yours is named and skipped.

**B4.2 — room runs.**

- A room is a chat session with seats. Each seat is a role (parameters
  filled), an optional persona and an agent.
- Phases run parallel or sequential, each with its own visibility.
- Each seat answers to its role's output contract.
- The selector seat picks one answer, or none. The run records winner,
  runner-up, rationale and dissent.
- The room's vendor rules are enforced when you seat agents:
  - a critic never shares the author's vendor;
  - the selector excludes the authors' vendors.
- A talk-only seat refuses tool permission requests.
- Seat turns stream as one event kind.
- Live check: a Council with Claude Code and Codex seated. Both answer
  blind, a selector picks, and all turns are saved.
- Split:
  - **B4.2a** is the kernel: seating rules, each seat's brief, output
    parsing, and the run.
  - **B4.2b** is the engine and Tauri: one live agent session per seat,
    turns saved, events streamed, and the live check.

**B4.2 run rules.** The library does not spell these out; they are my
reading of your design and research, open to your correction.

- **Places.** A seat with `count` 3 is three places, each seated with its
  own agent and its own session. The same agent may take several places;
  that gives independent samples.
- **Vendor rules** are checked when you seat a room:
  - `avoid_same_vendor_as`: a seat's vendor differs from those of the
    listed roles' places.
  - `exclude_author_vendors`: the selector's vendor wrote no candidate.
  - Example: with only Claude Code and Codex installed, a Council is three
    Claude Code answerers and a Codex selector.
- **Authors and candidates.** Places whose role generates or argues
  (stance `generate` or `adversarial`) are authors. Every author turn is a
  candidate the selector can pick.
- **Rounds** repeat the phases before the selection phase, up to
  `max_rounds`.
  - From round 2 on, phases with visibility `none` are skipped: first
    answers are collected independently, once.
  - Inside a phase, each place takes `max_turns` turns. A sequential phase
    interleaves them (pro, con, pro, con).
  - The selection phase runs once, at the end.
- **Early stops:**
  - `stability`: a round where no author changed its answer. The
    advocate's `changed` field says so; otherwise the text is compared.
  - `pass_threshold`: a round where every critique seat reports no
    defects.
- **What each place sees.** It sees the question, then what is new since
  it last spoke, filtered by the phase's visibility:
  - `none`: nothing of the others;
  - `anonymized`: candidates by letter;
  - `full`: seat, role and agent.

  `structured-outputs` passes each answer's JSON; `full-transcript` passes
  the whole text. Others' words arrive datamarked
  (`<msg-{room nonce} …>`), and only your words are instructions.
- **Briefs** go in the first prompt for every agent. ACP has no
  system-prompt field, and Grok takes the role in the first prompt. Claude
  Code's `--append-system-prompt` can come later. A brief holds:
  - the room;
  - the role, with its parameters filled, method, limits, rubric and
    output contract;
  - the persona, which never overrides the role's limits or contract.
- **Output.** Each answer ends with a fenced JSON block that the contract
  checks. An answer that breaks its contract is kept as text and marked.
  If the selector breaks its contract, nothing is picked, and that is said
  plainly.
- **Selection.**
  - Blind means candidates appear by letter only.
  - With `swap_order`, the selector judges in both orders; a different
    pick is recorded as a tie.
  - The record keeps winner, runner-up, rationale, dissent and flips.
- **Talk-only.** The agent works in a scratch folder
  (`{data_dir}/rooms/{room}/{place}`), and every permission request is
  refused. The agent's own off switch is used when its definition has one
  (Claude Code `--tools ""`).
- **Router** does not run yet. Its router seat is the Planner, whose output
  (`agenda`) names no expert. It runs once you rule how a router chooses: a
  router role with a `route` field, or matching the experts' summaries.

**B4.3 — the chat window.**

- Start a room from the library.
- Seat your agents and personas, and fill parameters.
- Each answer appears under "seat · role · agent (persona)", and the winner
  is marked.
- A library view shows each role's method and evidence in plain words, with
  advanced terms one step away.
- A new-persona form.
- Live check: you run a Council from the chat window.

**B4.4 — your checkpoint.** Your sign-off.

## Part C — The Model Loader maintains every capability (after Part A)

Brain, Vision, Voice and Memory are maintained in the Model Loader as providers
(R-A5, R-A17): change one and the same card updates. The advanced view sits
behind a flag. Planned in detail after A8, with plan 0007.

## Decisions still open (vendor terms)

1. **Anthropic Commercial Terms.** Running Claude Code inside a product
   requires accepting them. This is your action, needed before a Claude
   subscription can be dedicated to Clyffy in a shipped build.
2. **Claude adapter route.**
   - Zed's `claude-agent-acp` is built on the Agent SDK, whose terms bar
     subscription login without Anthropic's approval.
   - Hosting the unmodified Claude Code binary is allowed.
   - Confirm with Anthropic, or drive Claude Code's own headless mode.
3. **OpenAI "Sign in with ChatGPT".** Only needed if DevPulse ever owns the
   ChatGPT sign-in.
4. **Gemini free tier.** Those users moved to Antigravity CLI on 2026-06-18,
   and its ACP support is unverified. Verify in R3.

## Verification

Recorded per phase in the log: command output, live log lines, and Turso
queries proving what was written.

## Log

- 2026-10-10 — Rewritten on the owner's UX requirements and the 07 spec.
  Onboarding is the engine boundary; everything is an endpoint.
- 2026-10-12 — Extended: Part B, subscriptions in one chat over ACP.
- 2026-10-12 — Rebuilt from four research passes: 120 owner requirements, the
  origin/main GB10 review, the structure rules, and the delete inventory. A0
  delete groups added. 0002 folded in.
- 2026-10-12 — Revised (owner):

  > "First Run - name, github, local projects folder, intuitive UI, suggestions,
  > schema driven inputs … svelte UI drives the rust and is actually writing to
  > turso not libsql … deps easily updateable … bring your own subscriptions so
  > it scans and identifies you have grok, claude desktop, claude code, gemini,
  > cursor, codex … others … adhere to our schema … a clyffy adapter that has
  > one subscription dedicated to power clyffy if no custom endpoint for local
  > llm is provided"

  The previous revision built new tables on libSQL beside a new `ai.db`, and
  split endpoints and agents into two systems. Both were parallel to your
  design.

  What this revision does instead:
  - **Turso first (A1):** `turso` 0.8.1 is the current stable release.
  - **One schema pattern (A2)**, used by both inputs and provider definitions.
  - **One provider schema** with adapters by protocol (A4). Grok Build's ACP
    support is confirmed in xAI's docs. Claude Desktop is handled as an MCP
    client.
  - **The Clyffy adapter (A5)** rewrites `routing_config`'s Claude-only lanes.
  - **First run is Welcome → You → Your AI.**
- 2026-10-12 — Owner corrections:
  - Hardcoded tiers and presets are made configurable (H1–H3), not deleted.
    `JessePrimary` leaves the code; no personal names ship.
  - Profile columns keep their real owners.
  - No compatibility, aliases or legacy.
  - The full first-run experience (stages 0–5 + checklist) is written above,
    grounded in GitHub Desktop, Zed, LM Studio, Raycast, VS Code walkthroughs
    and NN/g.
- 2026-10-12 — **A0 done** (D1–D12, D15–D18). Deleted:
  - the 17-file wizard;
  - its 7-file copy in the Slots devtool (the header badge now reads the real install state);
  - the baseline auto-install rune;
  - 4 stale e2e specs;
  - 26 never-dispatched action ids;
  - 5 wizard-only commands + `get_interaction_template` + the kernel interaction templates;
  - the legacy `open_chat_window` / `close_window`;
  - the debug-only `seed_dev_data` (20 days of invented DuckDB stats, a duplicate
    profile creator, a hardcoded model row nothing read).

  Profile:
  - `hardware_profile` / `expertise_level` are nullable; no `'32g_engineer'`, no `'Developer'` name;
  - one creator (`ensure_profile`), and credentials use the real profile id;
  - the skill picker is gone.

  Chat is a normal top-level window: not owned by main, not forced on top, native
  minimize, user-opened only. Every raw `invoke("…")` of a removed command was
  replaced with typed bindings. Stale instructions were corrected (CLAUDE.md
  stack + registry path; C4 / 08 / 09 marked superseded; cascade banner).

  Verified after every group:
  - `cargo xtask clippy -p devpulse_desktop_backend` clean;
  - bindings regenerated;
  - `pnpm check` 0 errors (warnings 10 → 4).

  Not yet run: a live boot.

  Note: a dev DuckDB seeded before this change still holds the invented
  `daily_stats` rows; they are removable from the database devtool (T7).
- 2026-10-12 — **A1 T1–T4 done: DevPulse runs on Turso.**
  - `turso` 0.8.3, the current stable release, replaces `libsql`. It is set
    `default-features = false`: the default `mimalloc` feature installs a
    `#[global_allocator]` from inside the library and compiles C. `fts` stays on.
  - The adapter is rewritten as `TursoAdapter` (no alias).
  - **Live finding:** Turso runs one operation per connection ("concurrent use
    forbidden" hit `list_projects` on the first boot). The adapter now holds the
    pooled `Database` and opens a connection per operation; query paths hold
    the connection until their rows are read. Each connection gets
    `busy_timeout_ms` from the service config (default suggestion 5000).
  - Regression test: 32 overlapping tasks through one adapter.
  - The adapter reads every column of a row (`column_count()`); the old reader
    probed up to 32 columns and silently truncated wider rows.
  - **Build finding:** adding Turso bumped `cc` 1.2 → 1.8, and since 1.5
    `sccache` mis-parses MSVC's separate `-Tp` argument (mozilla/sccache#2062,
    still open). `cc` is held at `~1.4.7` in `xtask/Cargo.toml`, the floor Turso
    needs, with the issue link to lift it.
  - Every libSQL name is renamed across Rust, TS, config, the devtool and the
    infra domain:
    - types, commands, the `query_database` MCP tool, config `kind = "turso"`;
    - DB paths `.userdata/{system,user}/turso/`, with the files moved intact,
      WAL included;
    - knowledge content, IP terms.
  - The devtool's health now reports the path the service actually opened
    (it was hardcoded).

  Verified:
  - clippy `-D warnings` clean; adapter tests 3/3; `pnpm check` 0 errors;
  - live boot: both stores open at the new paths, the model loader reads its
    persisted assignment through Turso (models=12 assigned=1, unchanged),
    READY with only the known boot-race errors (`get_status` /
    `get_assistant_config` called before READY — fixed in A6).
- 2026-10-12 — **A1 T5–T6 done: project data in the DevPulse folder; versioned migrations.**
  - T5: per-project stores open at `.userdata/projects/<id>/` (`ProjectDbManager` /
    `ProjectAnalyticsManager` take the projects dir). Registering a project
    writes nothing inside it. No project was registered, so no data moved.
  - T6: numbered SQL files under `systems/devpulse-engine/migrations/{system,user,project}/`.
    - `build.rs` embeds them (the sqlx `migrate!` / refinery pattern) and
      fails the build on a malformed name or a duplicate version.
    - `platform/db::migrate` applies pending ones in order. Each runs in one
      transaction with its `schema_migrations` row. A failure rolls back and
      names the migration; a database migrated by an unknown build is refused.
    - Every store migrates when it opens (`StoreSchema { schema, migrations }`).
  - First migration: `user/0001_clear_seeded_profile_values` clears the
    invented `32g_engineer` / expertise / `Developer` values.
  - Verified:
    - tests 4/4 (order + once, rollback, unknown build, embedded order);
    - live boot logged `migration applied version=1`;
    - through `--mcp-stdio`, `profiles` row `user-1` has
      `hardware_profile = NULL, expertise_level = NULL`;
    - `schema_migrations` holds `1 clear_seeded_profile_values`;
    - the next boot applied nothing.
- 2026-10-12 — **Structural fix found during T7: SQL parameters are typed.**
  `SqlAdapter::query/execute` bound every parameter as text (`&[&str]`, 45
  call sites in 11 files). Nothing could be set to NULL, and numbers went in
  as text and relied on column affinity. Callers worked around it: `""` for
  absent values, `NULLIF(?, '')`, `n.to_string()`. A row editor cannot be
  correct on top of that.
  - Now `&[SqlValue]`, with `From` conversions (`id.into()`, `count.into()`,
    `None::<String>.into()` → NULL). The separate `execute_bound` is folded
    into `execute`, so there is one API.
  - Callers bind real types. Optional fields that were stored as `""` are now
    NULL where the column is nullable and the reader already treats NULL as
    absent (community feed, knowledge `tool`, project description/tool/stack,
    turn token counts).
  - New adapter test: NULL / integer / real / text / blob round-trip with
    `typeof()` checked.
  - Pre-existing, not from this change: knowledge content tests
    `manifest_parses_clean` (expects manifest 0.1.0, data is 0.2.0) and
    `non_glossary_entries_have_title_and_body` (quiz entries have no title)
    fail on committed data. The telemetry span writer also logs "Failed to
    flush span traces to DuckDB" every ~5 s, in every session today.
- 2026-10-12 — **A1 T7 done: the database devtool manages your data. A1 is complete.**
  - Follows the Supabase Table Editor / Prisma Studio / DB Browser for SQLite
    pattern: pick a table, page its rows, open a row in a side sheet, change it,
    add a row, or delete one (confirmed).
  - Engine `platform/db/editor.rs`:
    - tables from the catalog; columns from `PRAGMA table_info` with `SQLite`
      type affinity (datatype3 §3.1);
    - rows addressed by `rowid`;
    - every change is checked against the table's own columns first. Unknown
      table or column, empty in a required column, or a value of the wrong
      type is refused with the column named ("profiles.created_at takes a
      whole number").
    - Names come from the catalog and are quoted; values are bound.
    - `schema_migrations` is hidden from editing and shown read-only.
    - `db::status` lists each shipped migration and when it ran.
  - Tauri `commands/sys/relational.rs`: thin wrappers (health, tables, rows,
    update/insert/delete, migrations, console). Changes are logged to
    `devtools.turso`, which the Logs tab reads.
  - UI:
    - the existing `TursoDevtool` is rewritten, with `TursoTableEditor` and
      `TursoRowForm` beside it;
    - the domain reads through the `sys/bindings/sys/relational` facade;
    - the state holds only what Rust returned; a saved row is replaced by the
      row Rust stored;
    - the hardcoded database list and the dead Debug probe are gone;
    - Config describes where config really lives.
  - Verified:
    - engine tests 103/103 (editor 5: affinity, catalog + injection-shaped
      name refused, insert/update/delete round-trip, refusals, console);
    - clippy clean for kernel, engine and desktop; `pnpm check` 0 errors;
    - **live** through the UI: Tables → profiles → Edit → `display_name` set,
      saved, read back from Turso through Rust, then set back to Empty (NULL);
    - Migrations shows `0001 clear_seeded_profile_values` applied;
    - Logs shows the row changes;
    - `created_at` = 2.5 was refused in the sheet with Rust's message, and the
      stored value was unchanged.
  - Fixed during the live check: an `$effect` that read and wrote its own
    state looped (`effect_update_depth_exceeded`). The pulse now reads a
    counter the state bumps when Rust answers.
  - Open:
    - The first refusal run after an app restart logged two refusals and the
      sheet closed. It did not reproduce in two further runs with the same
      steps.
    - "First run shows the change" is checked in A7, when first run exists.
    - Plain-language table names and descriptions (R-D10) belong in the A6
      copy catalog.
    - The console shows rows without column names, because `SqlAdapter`
      returns values only.
  - ColdLight defects found (design-system scope, not patched here):
    - `Sheet`: Escape does not close; no visible backdrop.
    - `Sheet` `open`, `Switch` `checked`, `NumberField` `value` and `Select`
      `value` are read once at mount.
    - `ToggleGroup` renders no items.
    - `Text` has no `color` prop. Existing `color="muted"` callers do nothing;
      this devtool uses `--text-*` tokens.
- 2026-10-12 — **Re-ordered into vertical slices** (your word: "going in circles").
  The order now ships one stage at a time, live on screen.
- 2026-10-12 — **Slice 1, phases 1.1–1.6: Welcome is live.**
  - Profile ownership moved into the engine (`platform/profile/`): the
    profile and preferences rows. The Tauri commands are thin. A missing
    preferences row is created and read back instead of returning
    hardcoded copies of the column defaults.
  - Migration `user/0002_first_run_progress`: `onboarding_stage`,
    `onboarding_later_at`, `projects_root`.
  - First run:
    - The flow comes from TOML with your override; a broken override is
      reported, not ignored.
    - Progress is stored on the profile row.
    - The workflow (next / back / later / reopen) and its name gate live in
      Rust and are published as the new `onboarding` state signal; the
      contract snapshots changed only by that kind.
  - Copy catalog: engine `platform/copy` + `config/copy.default.toml`, typed,
    per-key override, available before boot finishes (`get_copy`).
  - UI:
    - `domains/app/onboarding` (store from the signal, intents), the shell and
      the Welcome view, the `/onboarding` route;
    - the app layout hands over to first run while it is open;
    - TopBar "Finish setting up" while it is set for later.
  - Verified:
    - engine tests 110/110 + contract 4/4; clippy clean; `pnpm check` 0 errors;
    - **live:** boot lands on Welcome;
    - Set up later → the dashboard with the chip, and Turso
      `onboarding_later_at` set;
    - the chip → back in, cleared; no console errors.
  - **Two ColdLight bugs found and fixed at the source** (they made every
    screen look wrong, not just this one):
    1. `renderForge` never read the kind+intent tokens (`--preset-button-primary-*`
       in `app.css` and the generated CSS). Every `primary` button rendered as
       dark glass. The chain now resolves kind+intent first. The renderForge
       tests were stale (they read a `-bg` key that does not exist) and were
       rewritten; 21/21 pass.
    2. `render-base.css` was imported outside any cascade layer, so
       `[data-cl-text] { font-size: var(--font-size) }` beat every Tailwind
       size class. Every `Text` / `Heading` `size` and every `text-*` class in
       the app was ignored. It now imports into `layer(components)`, under
       `utilities`. Side effect, as written by its author: the dashboard's
       `font-display` numbers now render in Orbitron (slashed zeros).
  - Vite served an empty compile of `WelcomeView` once (it read the file
    mid-write); touching the file fixed it. That is not a code issue.
  - Memory: the app process is flat at ~210 MB over 10 minutes. The crash at
    16:03 was `memory allocation failed` with the machine's commit nearly
    exhausted (63 GB private across all processes). Sampling now includes
    WebView2 and system commit to find any grower.
- 2026-10-12 — **Slice 1 complete (1.7–1.11): Boot → Welcome → You, live.**
  - 1.7 Schema-driven input:
    - `schemars` 0.8 → 1.2. The engine's direct 0.8 was unused; MCP already
      used `rmcp::schemars` 1.2. One version now.
    - `jsonschema` 0.58 with no default features (no network schema
      resolution); specta `serde_json`.
    - Engine `platform/forms`: `schema_of`, `validate` (per-field
      `FieldError { field, code, limit }`), `FormView`, `FormOutcome`.
    - The "You" form is a Rust type (`onboarding/you.rs`). Rules the schema
      cannot express (a blank name, a folder that does not exist) are
      checked on the raw submission, so **every refused field is reported at
      once**.
  - 1.8 `design/blocks/schema-form`: renders text / email / folder fields from
    the schema, with suggestions and Rust's errors; no validation of its own.
    `readFields` is tested.
  - 1.9 Detection (`onboarding/detect.rs`):
    - git identity from `git config --global`, with one wrapping pair of
      quotes removed (your config stores the name quoted);
    - folders holding repos from bundled `config/onboarding/folders.toml`
      (your copy wins), plus DevPulse's own parent folder when running from
      source.
  - 1.10 Repo scan (`onboarding/scan.rs`, `tokei` 15):
    - repos in the folder with their top languages, DevPulse first, the
      registered ones marked; a missing folder is an answer (`None`), not an
      error;
    - ticked repos are registered in place through the existing
      `create_project` (its body extracted as `create`); the first becomes
      active when none is.
  - 1.11 Welcome chips: detection runs in the background at boot and is
    published inside the `onboarding` state (`detected`).
  - Fixed along the way:
    - `pick_directory` returned cancel as an error string that callers
      matched on; it now returns `Option` (like `pick_audio_file`), and both
      callers use the typed binding.
    - **The projects store never worked:** it cast command `Result`s straight
      to `Project` and declared camelCase fields Rust never sends. So the
      active project, the list and paths were always empty ("No active
      project"). It now uses the generated types and unwraps.
  - Verified:
    - engine tests 122/122 + contract 4/4; clippy clean; `pnpm check` 0
      errors; Biome clean.
    - **Live, end to end** (Playwright over CDP):
      - Welcome chips;
      - You form suggestions (git name/email, `D:\localdev · 22 repositories`);
      - blank name + bad email + missing folder → all three refused in plain
        words, nothing written;
      - typing a path does not scan; a missing folder gets the plain message;
      - demo folder → 2 repos with languages → add 1 → registered,
        checkbox checked, top bar shows it active;
      - "Open DevPulse" → complete → dashboard Projects = 1.
    - Afterwards the profile, progress and test project were restored, so
      your own first run starts clean (verified: profile NULLs, 0 projects,
      no active marker).
  - Found, not in this slice (each gets its own phase):
    - **Graph writes fail on SurrealDB 3**: 12 `type::thing(...)` uses in
      the kernel's surreal client (SurrealDB 2 syntax). Every project mirror
      logs "graph project mirror failed", and the logged error drops its
      cause chain.
    - Project logic (SQL, mirror, active singleton) lives in the Tauri
      command layer. It belongs in the engine, as the profile now does.
    - Memory: the app is flat at ~210 MB. The machine has ~9.5 GB of commit
      free; the earlier abort was machine-wide pressure.
- 2026-10-13 — **Committing the work, one commit per phase.** A0 through
  slice 1, plus the fixes since, had not been committed (285 paths). Owner
  decisions:
  - One commit per phase, each holding that phase's exact tree and each
    built and tested on the self-hosted Windows runner
    (`devpulse-runner-win-01`).
  - The commits go to `restore/pre-gb10`. That line eventually replaces
    `main`; the force-push is confirmed separately.
  - Method: the session transcript is replayed from `65a76f95` (every
    Edit/Write exactly, every shell edit verbatim, builds stubbed), and
    stops at each phase's log entry. Generated files (bindings,
    `Cargo.lock`, contract snapshots) are regenerated per commit by the real
    generators. Check: the last commit's tree equals the working tree.
  - The existing tree already failed the hooks: rustfmt (2 files) and Biome
    (1 file) get a first commit; the 20 cargo-deny advisories get their own
    commit. No hook is bypassed.
- 2026-10-15 — **Account is required; owner decision (settles K7 / R-A11 for
  email).** "This has been discussed so many times — it's required. On signup
  it will go from login to creating the account and free subscription."
  - Slice 1 got this wrong: email was optional and saved only in Turso, and
    no account was created. The existing Supabase sign-up (`domains/auth/`,
    May 2026) was optional and reached from Settings. Licensing
    (`commands/cloud/license.rs`) is a stub that always returns Pro and never
    contacts the cloud.
  - New first-run step **Account**, right after Welcome:
    - email required;
    - sign up with an email code by default, or a password (both supported);
    - sign in for existing users;
    - first run cannot continue without the account; offline, it says it
      needs a connection and retries.
  - On sign-up: account → free subscription. Every user's email and sign-up
    date live in the DevPulse Supabase project. The license comes from the
    account (Free by default), replacing the hard-coded Pro stub.
  - Order: after the per-phase commits land; its phase rows are written
    before it starts.
- 2026-10-15 — **Committed: one commit per phase, hooks passing.** Rebuilt
  from the session transcript; the final tree matches the working tree for
  every hand-written file. Found and fixed on the way, each in its own
  commit:
  - No pre-commit check had ever run on this machine. lefthook was missing,
    and its globs (`*.rs`, `*.svelte`) matched only root files. Reinstalled,
    and the globs now match nested files.
  - The bindings-drift hook had been broken since 65a76f95 (export-bindings
    moved to a fixed output path). It now compares regenerated vs staged.
  - The ip-boundary hook matched "RRO" inside "ERROR". It now matches at
    word starts.
  - Kernel terms outside kernel/:
    - window role CortexViewer → KnowledgeViewer (the /cortex route it
      opens does not exist; still open);
    - the dev banner's "RRO" → "prepared context".
  - Two raw 1px borders in slice 1 → 0.0625rem (ColdLight rule 29).
  - Cargo.lock: phase 6 resolved jsonschema on 10-15, so some transitive
    dependencies are newer than in the 10-13 working tree. Every commit was
    built with the committed lock.
- 2026-10-18 — **Part L added: everything on latest stable, then endpoints and
  sign-in (owner order).** Read before writing: this plan in full, the 120
  owner requirements (`onboarding-endpoints/01-owner-requirements.md`), plan
  0007 (decision 5: compiled-in engines out, endpoints first, ordered
  2026-10-13 and not yet started), and the memory notes on subscriptions,
  account, endpoints and deps. Confirmed still in the code: engine
  `ai_providers` (11 hardcoded base URLs), hardcoded vendor URLs in
  `claude/mod.rs`, `commands/claude/ping.rs` and `commands/cloud/mod.rs`,
  `routing_config`'s Claude-only lanes, the license stub that always returns
  Pro, the llama sidecar's fixed port 8899, the `HardwareTier` enum with
  `JessePrimary`, and the Supabase project URL as a code constant (the anon
  key is read from the OS keyring). Survey of the full upgrade recorded in
  Part L.
- 2026-10-19 — **Owner: "you also never got the onboarding guided UI
  consistently working projects … stop rushing and work this
  methodically."** Read-only findings, live over CDP and in code:
  - First run reads `status: complete`, stage `you`, with **0 projects
    registered and no active project**: it was finished without projects
    landing. Slice 1's live check (10-12) registered one, then the test
    data was reset; nothing since has re-run it end to end.
  - Nothing in the UI can reopen first run: `onboarding_reopen` exists in
    Rust, the binding and `onboarding.service.ts:36`, and no screen calls it
    (the re-entry chip is slice 8). `/onboarding` redirects to the
    dashboard whenever the state is not `open` (`FirstRunFlow.svelte:34`).
  - Two sources of truth for the active project: chat uses
    `devpulseState.recentProjects[0]` in 4 places, everything else uses
    `projectsState.activeProject` → chat can say "No active project" while
    one is set. Its three messages are hard-coded English, outside the copy
    catalog.
  - The Account step (2026-10-15) is not built. Owner 2026-10-19: login is
    on devpulse.app and part of Shippin.cloud's identity, shared across the
    owner's sites — which provider backs it is still open.
  - Proposed order, for approval: (1) one active-project source, chat
    included; (2) a re-entry point and a repeatable end-to-end first-run
    check on a backed-up DevPulse folder, projects included, run more than
    once; (3) the Account step once the identity provider is decided.
  - 2026-10-20 — **(1) and (2) done** (`9b882375`, contract fix `ad55b66f`):
    projects moved into the engine (`platform::projects`), one `projects`
    state signal for every window, chat reads it (and its commands now use
    the user database, where sessions live); Finish registers the ticked
    repositories; Settings → "Run setup again" reopens first run after it
    finished. Verified live (CDP). The Account step (3) waits on Nomen.
  - 2026-10-20 — **Stage 3b "Your dev environment" built** (owner: "clear
    UI that effortlessly sets up Docker or podman per real world best
    practices … clear decision data points"). Engine `platform::containers`:
    detection (engines from `config/containers/engines.toml`; host RAM,
    cores, NVIDIA GPU, Windows WSL and virtualization), advice as a tested
    decision function over `config/containers/advice.toml` (licence
    thresholds, requirements, products, sources — researched 2026-10-20),
    steps run only on click (WSL via the administrator prompt, winget /
    Homebrew installs, engine start, test container; the Linux install is
    shown, not run), answers in Turso, `containers` state signal. Shared
    runner `platform::process` (git detection moved onto it). UI: the
    containers domain and the first-run stage; the flow is now welcome →
    you → containers. Verified: engine 157 + contract 4 + kernel 65 tests,
    workspace clippy, svelte-check 0 errors, Biome, arch 18; live on this
    machine — Docker 29.8.2 and Podman 5.8.6 detected running, Windows 11
    Pro, 63 GB, 24 cores, RTX 5090, WSL 2.7.13.0, virtualization on; advice
    "Keep Docker Desktop"; a large-organization answer shows the licence
    warning with its source. No install, start or test step was run during
    verification — those change the owner's machine and are the owner's to
    click.
  - 2026-10-20 — **Slice 4a done: "Your AI" on screen** (owner: "plan and
    execute"). 4a.1 runner moved to the infra crate `devpulse-process`
    (kernel and engine share it). 4a.2–4a.4 kernel `providers`: definition
    schema with field-named errors, six bundled definitions (Claude Code,
    Codex, Gemini CLI, Cursor CLI, Grok Build, Claude Desktop — researched
    2026-10-20, unconfirmed facts marked in the files), your files add or
    replace by id; discovery (PATH or known paths, `--version`, latest from
    npm / GitHub / the vendor's plain-text feed, signed in by the vendor's
    status command or login-file presence — unknown when it can't be told);
    Update runs the vendor's updater, Sign in opens the vendor's login in a
    terminal window. 4a.5 engine `Providers` facade + `providers` state
    signal + Tauri intents. 4a.6 providers domain + Your AI stage; flow
    welcome → you → your_ai → containers. Findings that shaped it: Gemini
    CLI no longer serves Google AI Pro/Ultra (2026-06-18, shown on its card);
    Claude Code and Codex reach ACP only through adapters
    (`@agentclientprotocol/claude-agent-acp`, `…/codex-acp`), Gemini
    (`--acp`), Cursor (`agent acp`) and Grok (`grok agent stdio`) natively —
    for 4b. Verified: kernel 78 + engine 154 + contract 4 + process 3 tests,
    workspace clippy, cargo fmt, svelte-check 0, Biome 562, arch 18; live on
    this machine — Claude Code 2.1.296 (2.1.305 available, signed in), Codex
    0.163.0 (up to date, signed in), Claude Desktop installed, Gemini CLI,
    Cursor CLI and Grok Build not installed. No Update or Sign in was clicked
    during verification.
  - 2026-10-20 — **Slice 4b done: Try it — your AI answers inside DevPulse**
    (owner: "lets do it please and get this properly implemented"; rulings
    under Slice 4). Definitions gained `[connect]` and the `headless`
    adapter; kernel `providers/connect`: the ACP one-shot client on the
    official `agent-client-protocol` 3.4.0 SDK (initialize → session in an
    empty folder → one prompt → the agent's text; every permission it asks
    for is refused), Claude Code's own print mode, and connectors installed
    on click into `{data_dir}/tools/connectors/{id}` with npm. Actions Try it
    and Install connector; reports carry the connector's state; the question
    is copy. Fixed on the way: a definition's `program = "npm"` was run
    without PATHEXT, so Gemini's Update would have said npm was missing on
    Windows. The ACP SDK switches on serde_json `preserve_order` workspace-
    wide (not optional); the signal contract snapshot now sorts keys, so it
    pins content, not map order. Facts checked against the published
    packages: Gemini CLI 0.65.0 `--acp` (`--experimental-acp` deprecated);
    codex-acp 2.2.2 runs `CODEX_PATH`. Verified: kernel 85 + engine 154 +
    contract 4 + process 4 tests, workspace clippy, cargo fmt, svelte-check 0
    (app and ColdLight), Biome 562 / 1072, arch 18, cargo-deny advisories and
    bans. Live on this machine (CDP): Claude Code answered headless in 9.6 s;
    Install connector put codex-acp 2.2.2 into the DevPulse folder ("added 25
    packages in 11s"), then Codex answered over ACP in 9 s with your own
    Codex and login, and the connector was still there after a restart.
    Gemini CLI, Cursor CLI and Grok Build are not installed here, so their
    ACP commands remain unconfirmed against a real install (marked in their
    files).
  - 2026-10-21 — **B3.1 done: one provider model, in the kernel** (owner
    rulings D2 + Location). `ai_providers` moved with its history to
    `kernel/devpulse-clyffy/src/providers/{types,registry}.rs`; the engine's
    `ai_providers` is a thin re-export (its `visible()` passes the engine's
    `kernel` feature), so `credentials`, `providers` and `cloud` compile
    unchanged. `AnthropicSubscription` became **Claude Code** (its Claude
    Desktop MCP transport moved to a new **Claude Desktop** row); new rows:
    Codex, Grok Build, Antigravity CLI (`agy`), Gemini CLI, Cursor CLI,
    Antigravity (IDE). New vocabulary: `Transport::AgentCli { protocol }`
    (ACP or headless), `SdkBackend::{AgentClientProtocol, VendorHeadless}`,
    `Classification::DesktopApp`, `McpClient::Antigravity`, `Vendor::Cursor`,
    `ProviderId::key()`. Folded: definition files are keyed by `ProviderId`
    and hold only what this machine keeps (where, versions, sign-in, update,
    connect); name, docs, kind and protocol come from the registry row; a
    file for an id the registry does not have is reported. Antigravity facts
    from google-antigravity/antigravity-cli (installers, Google sign-in);
    `agy`'s version and headless flags are unconfirmed until it is installed.
    Verified: kernel 95 + engine 149 + contract 4 tests, workspace clippy,
    cargo fmt, svelte-check 0, Biome 560, arch 18, bindings regenerated.
    Live (running app): Claude Code 2.1.296 (2.1.306 out, signed in), Codex
    0.163.0 (up to date, signed in), Claude Desktop installed, Antigravity
    1.104.0 installed; Grok Build, Antigravity CLI, Gemini CLI, Cursor CLI
    not installed. Noted for B3.3: the older `list_provider_status` (no UI
    caller) reports agent rows as "not configured" — its "configured" means
    "has an API key", as it did for the old subscription row.
  - 2026-10-21 — **B3.2 done: real conversations with your agents**
    (kernel `providers/session/`). One live session per thread:
    - ACP agents keep one process and one ACP session (`session/new`, many
      `session/prompt`s); updates become chat events (text, thought, tool
      use, permission asked, turn ended, failed); `session/cancel` stops a
      turn. Permission requests wait for your answer off the SDK's dispatch
      loop (its documented deadlock rule) and are refused after 10 minutes.
    - Headless agents run once per turn; the definition's new
      `connect.conversation` (args, `resume`, `output`) says how. Claude Code
      streams `--output-format stream-json --include-partial-messages` and
      resumes the session id it reported (`--resume`), checked against
      `claude --help` and a real turn's event shapes. Antigravity CLI is
      plain text, marked unconfirmed.
    - The live test caught two real bugs, both fixed: a finishing turn
      cleared the next turn's stop signal (read as "cancelled"), and a stall
      from waiting with the lock held. A turn now ends at its ending event,
      and the next turn waits for the previous process to exit before
      resuming.
    Verified: kernel 100 tests (stream-json parsing, resume arguments, ACP
    update mapping, permission answers), clippy, fmt. Live
    (`two_turns_keep_their_context`, ignored by default): Claude Code
    "OK" → "marmalade" and Codex "OK" → "m","arm","alade" — both kept the
    conversation on your own subscriptions.
  - 2026-10-21 — **B3.3 done: threads with your agents, saved** (engine
    `platform/agents.rs`, Tauri `commands/agents`, event `AgentStreamed`).
    - A thread is a chat `sessions` row plus a new `agent_threads` row
      (agent, resume token). A new table, so existing databases need no
      migration.
    - Both sides of every turn go to the chat's existing `turns` table
      (assistant `model_used` = the agent, `finish_reason`, latency), so the
      chat's `load_recent` / `list_sessions` read them unchanged.
    - One live kernel conversation per thread, started on first prompt in
      the project's folder. Intents: `agent_threads`, `agent_thread_start`,
      `agent_prompt` (events stream as `AgentStreamed`), `agent_cancel`,
      `agent_answer`, `agent_close`. `Providers::location()` gives the
      installed program.
    - Verified: engine 150 + contract 4 tests, workspace clippy, cargo fmt,
      svelte-check 0, bindings regenerated.
    - Live (running app, CDP): a Codex thread in the active project;
      "Remember the word quince" → "OK" (9 s), "Which word…?" → "quince"
      (3 s), both saved. Streamed to the window as `text:OK`, `turnEnded`,
      `text:qu`, `text:ince`, `turnEnded`. `agent_threads` lists "codex Codex
      turns=4".
    - Known limit: after a restart, a Claude Code thread resumes through
      its saved session id, but an ACP thread (Codex) opens a new session.
      Its history is saved, its memory is not, until ACP `session/load` is
      used.
  - 2026-10-21 — **B3.4 done: your agents in the chat window.**
    - "New thread with…" (ColdLight Select) lists the agents that can chat
      now: installed, a way to talk to them, connector in place, from the
      providers state.
    - A thread's messages go to its agent (`agentsState` over the agent
      intents and `AgentStreamed`). The reply streams under the agent's
      name, and "Working…" / "Using: {tool}" and Stop show while it runs.
    - A permission request shows the agent's own choices plus "Don't
      allow". The local-brain gate applies only to non-agent threads.
      Saved answers carry the agent's name. Text comes from a new
      `[chat.agents]` copy section.
    - Found and fixed on the way:
      - The engine forwarded "turn ended" before saving the answer, so the
        window reloaded too early and missed it. It now saves first.
      - Every send threw an unhandled rejection when the `chat.suggest`
        embedder was not loaded, covering the chat with the error overlay.
        `record` now logs and skips, as `query` already did.
      - Session rows showed raw session ids; they now show the last
        activity time.
    - Verified: kernel 100 + engine 150 + contract 4, workspace clippy,
      cargo fmt, svelte-check 0, Biome 563, arch 18.
    - Live in the chat window (CDP: pick, type, Enter): one pick made one
      thread (6 → 7); "Remember the word fig" → "OK", "Which word…?" →
      "fig", both under "Codex"; screenshot checked.
    - Not yet exercised live: a permission prompt (Codex asked for none) and
      a Claude Code thread in the app (its kernel two-turn test passes; in
      this repo Claude Code would also run the repo's own hooks).
  - 2026-10-21 — **B4 planned** (rooms, roles, personas). Your
    `dpl.role/1` / `dpl.room/1` design and library are rebuilt in the
    kernel (D1), and "Persona = full character" is recorded. The kernel's
    unwired `Persona` / `VoiceTone` are the persona's starting point. The
    removed persona MCP crate is memory blocks and is noted for B6.
  - 2026-10-21 — **B4.1 done: your library in the kernel.**
    - `rooms/` holds the role, room and persona types and your rules.
    - Your 11 roles, 5 rooms and both schemas are under `config/`, copied
      from devpulselabs 4ee638b's committed tree, with the research in
      `docs/research/`.
    - `dpl.persona/1` is a new schema in the same shape. Its tone is the
      minions' `VoiceTone`: `minions/types.rs` was in no module tree and
      now compiles, with nothing in it removed.
    - Your files in `{data_dir}/config/{roles,rooms,personas}/` load on top.
    - Verified:
      - kernel tests 117 (17 new): every bundled file passes its JSON
        Schema and its rules, every cited source is in the research, and
        your files are checked;
      - kernel lib clippy and the specta build are clean; cargo fmt is
        clean.
    - **One lint exemption:** `Selection` keeps the schema's four switches,
      with `#[expect(clippy::struct_excessive_bools)]` and a stated
      reason. That is the precedent of `Capabilities`; grouping them would
      need serde `flatten`, which cannot refuse unknown fields.
    - Seen, not changed: `--all-targets` clippy fails on existing
      `unwrap`/`expect` in older kernel tests (intelligence/pipeline,
      llguidance/handle, duckdb/diagnostics, reasoning/state,
      knowledge/tests).
  - 2026-10-21 — **B4.2a done: rooms run in the kernel**, by the run rules
    above.
    - `rooms/seating.rs` seats a room from your library and checks:
      - every place has one agent;
      - every persona exists;
      - both vendor rules;
      - what cannot run yet: Router, a selector picking the next speaker,
        selection by vote or by you.
    - `rooms/brief.rs` writes each place's first prompt, datamarks others'
      words with a per-room nonce (a forged closing tag is broken up), and
      reads an answer's final JSON block against its contract.
    - `rooms/run.rs` (`RoomRun` over a `RoomHost` the engine will provide)
      runs:
      - parallel and sequential phases, `max_turns` and rounds;
      - the `stability` and `pass_threshold` stops, and flips;
      - blind selection by letter, `none`, `tie`, and a panel's majority.

      A failed agent is kept but is no candidate. A selector that breaks
      its form picks nothing and says why. A later question does not repeat
      the briefs.
    - Verified: kernel tests 132 (15 new, scripted agents):
      - a blind Council;
      - a Debate interleaving rebuttals and stopping when stable;
      - Author + Critic stopping on a clean critique with both drafts as
        candidates;
      - seating refusals.

      Lib clippy, the specta build and cargo fmt are clean.
  - 2026-10-21 — **B4.2b built: rooms in the engine and the window's
    bindings.**
    - The engine's `rooms` service is the run's host:
      - one live agent conversation per place, opened through the agents
        service (`conversation()`, shared with threads);
      - your question and every turn saved in `turns`, with the place,
        role, phase, round, candidate and output in `metadata`; the outcome
        is saved as a `system` turn;
      - `room_threads` keeps the room, the seating and each place's resume
        token;
      - the run's events (`agent`, `turn`, `finished`) are handed out;
        cancel stops every place.
    - Talk-only:
      - a place works in `{data_dir}/rooms/{session}/{place}`, and every
        permission request is refused;
      - a headless agent's definition gains `connect.conversation.talk_only`.
        For Claude Code it is `--tools "" --strict-mcp-config`, both
        checked against `claude --help` 2.1.296.
    - Tauri adds `room_library`, `room_threads`, `room_start`, `room_ask`,
      `room_cancel`, `room_answer`, `room_close` and the `RoomStreamed`
      event; bindings are regenerated.
    - Verified:
      - clippy (kernel, engine, desktop backend) and cargo fmt are clean;
      - tests: kernel 133 (+1 talk-only), engine 150, contract 4;
      - svelte-check: 0 errors.
    - Live check: not yet run (next).
  - 2026-10-21 — **B4.2 live check passed: a Council in the running app.**
    - Through the app's own IPC (CDP), the Council
    (`sess-0adbd837-07d8-489e-9b56-0a2a65bed38b`) was seated with three
    Claude Code answerers and a Codex selector, then asked "In one short
    sentence: why do databases use indexes?".
    - The three answers came in parallel at 12 s, each blind (candidates A,
      B and C). Every answer followed the domain expert's contract
      (`answer`, `confidence: "high"`, `out_of_domain`).
    - At 42 s the Codex selector picked C (`answerer-3`, the book-index
      analogy) with A as runner-up. It gave four reasons, one per candidate
      including why B lost, and no dissent.
    - Saved:
      - turns: user, three assistant turns (claude-code), one assistant turn
        (codex), and the system outcome;
      - `room_threads` lists "council Council turns=6";
      - 536 streamed agent events.
    - Talk-only, from the app's log and on disk:
      - all four places joined `talk_only=true`;
      - each worked in its own empty folder under
        `.userdata/rooms/{session}/`, and none wrote a file;
      - no permission was asked, so the refusal path is still unexercised
        live.
      - Claude Code receiving `--tools ""` is covered by its unit test and
        the code path, not observed in a process listing.
    - Found:
      - The kernel reads an answer's JSON for its required fields only, not
        the contract's types or enums. Full JSON Schema validation of
        answers is a follow-up.
      - The session log grows about 270 MB in 20 minutes from the ACP
        library's trace output (known).
      - "Failed to flush span traces to DuckDB" repeats; it predates rooms
        (in earlier session logs) and is not part of B4.
      - The outcome log line printed `Some(…)`; it now names the place.
