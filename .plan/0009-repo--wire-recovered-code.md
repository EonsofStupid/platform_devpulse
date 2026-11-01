---
id: 0009
boundary: repo
paths:
  - recovered/
  - scripts/recovery/
touches: [kernel-clyffy, engine, desktop, desktop-coldlight]
status: in-progress
owner: Jesse Hades Hall
created: 2026-10-24
updated: 2026-11-01
supersedes: []
specs:
  - CLAUDE.md
---

# Your lost code back in the repo, then wired back working

## Goal

Restore the owner's code, documentation, planning and organized directory
structure to their proper owning locations, retaining provenance and original
content. `recovered/` is temporary recovery staging, not the final destination.
Reconcile existing implementations without overwriting or discarding authored
work. AI configuration and connection/execution logic belong under `kernel/`,
with configurable endpoints. Restore functioning consumers directly; do not
introduce compatibility layers or parallel replacement implementations.

## Restoration correction — governing direction, 2026-11-01

The owner explicitly rejected leaving years of work in a recovery folder.
This instruction governs the restoration sequence ahead of additional factory
UI work. Preserve the earlier plans below as decision history; do not erase
their content when updating current implementation requirements.

1. Restore missing documentation and supporting documentation-site files to
   their recorded original paths, byte-for-byte. Refuse existing destinations;
   record restored locations in the provenance manifest. Verify all content
   before removing a staging copy. Extend the recovery checker so reruns do not
   recreate restored staging files. Existing documents require reconciliation,
   not replacement by older copies.
2. Audit remaining recovery paths against active owners and Git history,
   including planning that survives at another path or changed in place.
   Documentation restoration alone does not establish complete recovery.
3. Move AI ownership out of engine into kernel in verified phases, updating
   callers and endpoint configuration directly. Retain engine platform services
   and supervision where appropriate. Inventory preserved capabilities before
   removing any duplicate implementation.
4. Resume the AgentHub ticket factory and chat-owned Council against the
   restored architecture. The factory fixture is not runtime completion.

Initial inventory: 689 documentation/supporting files have absent original
destinations and no case-disambiguated recovery paths. This includes historical
generated documentation; the count is not a count of authored plans or features.

Restoration evidence (2026-11-01): 691 documents and supporting files returned
to their recorded paths, 2,870,573 bytes verified against Git. The follow-up
coverage scan found two more missing source revisions, bringing the manifest
to 6,048 entries: 691 restored and 5,357 still staged. The separately imported
devpulselabs sources are not part of that count. Existing documents were not
overwritten. Git recognizes 690 exact renames and one newly recovered document;
there are no standalone deletions in this change. Desktop `pnpm check` passes
with zero errors/warnings. The manifest records the restored paths and checks
them without recreating staging copies.
The twelve recovery regression tests pass, including text history, original
bytes, destination conflicts, interrupted cleanup and workspace path containment.

Kernel ownership correction: the existing engine `onboarding/probes/` moves
directly to `kernel/devpulse-clyffy/src/providers/adapters/`, the owner specified
by plan 0001 R5. Remove the old module/export; retain the probe and tests.
No production caller was found. This is an ownership correction, not completion
of R5: configurable endpoint persistence, credential resolution and connection
to chat execution still need to be implemented against the existing providers.
`cargo check -p devpulse-clyffy -p devpulse-engine` and the targeted rustfmt check
pass with the corrected ownership.
The four moved adapter unit tests pass; the live endpoint test is explicitly
ignored without `DEVPULSE_LIVE_ENDPOINT`. This does not verify a remote server
or complete the missing production connection flow.

Remaining source reconciliation includes the old connectome-to-cortex changes,
Maestro (the active directory currently contains only its README), persona MCP,
and historical desktop implementations. These require capability-by-capability
comparison with current owners before integration. The restored sprint and
ColdLight plans must inform that comparison; historical instructions do not
override the owner's current colocated UI and endpoint requirements.

### Executable restoration: persona memory (2026-11-01)

Restore the preserved `systems/devpulse-persona-mcp` crate into
`kernel/devpulse-persona-mcp`, preserving its handlers, schema, protocol and
tests. The current owner ruling puts AI services in kernel; this supersedes
the historical systems path in plan 0001 B6.1. Add the restored crate to the
workspace and replace removed connectome/libSQL dependencies with the existing
Turso adapter. Hold a connection for each operation rather than sharing one
connection across callers. Repair failures exposed by the preserved tests;
add behavioral coverage for concurrent writes, filter correctness, limits and
idempotency where the implementation needs correction. Verify the stdio boundary
and explicit database configuration before counting the service as executable.

Original recovery copies remain until the restored implementation compiles,
tests pass, and the provenance record identifies the current owner and reviewed
content. Reconciled source retains its original Git reference and a digest of
the verified restored version; an unrecorded edit must still fail the audit.
Bundling and session attachment are separate acceptance checks, not implied by
the crate compiling. Continue the remaining owner-by-owner restoration after
this first executable boundary is established.

Verified outcome: the kernel workspace member passes `cargo check`, all 26
tests, `cargo fmt --check` and all-target Clippy with warnings denied. Actual
subprocess tests exercise initialization, tool calls and persistence across
restart. Repairs include atomic writes plus idempotency, natural-key uniqueness,
Unicode limits, expired cache handling, honest text-only recall and MCP tool
result framing. `DEVPULSE_PERSONA_DB` must explicitly name an absolute path.
Remote authentication, non-text retrieval, bundling and session attachment are
not complete. The protocol repair follows the official MCP 2025-06-18 tools and
stdio transport specifications; it does not introduce an HTTP listener.

The 12 original persona files now map to reviewed kernel destinations. Another
13 connectome files map to existing cortex implementations after confirming
that their only differences are namespace names/imports. Original Git revisions
remain in the manifest alongside reviewed destination hashes and notes. These
25 staging copies were removed only after verification. Current totals are
716 restored/reconciled, 5,332 still staged, 6,048 provenance records. All
13 recovery regression tests and the full manifest check pass. This supersedes
the earlier documentation-only counts above; it is not full restoration.

ColdLight reconciliation: compare the preserved design tree with the current
package before restoring duplicate components. Ten existing files (WizardDialog
and nine primitives) retain the original contents with only `$lib/design/`
imports changed to `#coldlight/`. Full diffs were reviewed and the ColdLight
package check passes with zero errors/warnings. Record those precise owners and
reviewed hashes in the provenance manifest before removing their staging
copies. This proves source preservation, not that every historical visual
capability has been restored or migrated to generated CSS. The other 176
same-relative-path candidates have additional differences requiring review.

Continue the kernel reconciliation by reviewing full connectome-to-cortex
diffs. The next 24 files preserve their declarations and algorithms while
updating storage terminology/imports, adding existing module exports, returning
test errors directly, or removing compiled Surreal-specific derives in favor
of the current serialized server boundary. Record each difference explicitly;
do not count a preserved barrel or data type as proof that its full feature is
wired. Larger persistence, retrieval and remote-client changes remain separate
reviews. Current active sources are retained; this phase removes only verified
staging copies after recording their current owners and original revisions.

Latest verification: 750 records now identify restored/reconciled destinations;
5,298 remain staged. All 6,048 provenance checks pass, with zero uncovered
deletions within the audit's stated scope. Imported devpulselabs and changes
inside surviving files still require separate review. Plan 0007 records the
additional llama-server/STT/TTS kernel ownership correction, atomic settings
repair and download path fix (175 selected model-loader tests, Clippy, rustfmt,
engine/desktop compilation pass). The persona service remains executable but
not yet bundled/attached to desktop sessions. AgentHub factory F1–F5 and the
historical ColdLight capability reconciliation remain incomplete.

### Shared Tauri baseline and endpoint activation (2026-11-01)

The owner requests commit, merge and push, then continued baseline work.
The owner explicitly confirms that DevPulse remains Tauri-based; references
to servers do not request a separate browser-hosted application.
Commit `88b8a704` captures the verified
restoration; main fast-forwards without rewriting history. The regenerated
Tauri bindings are unchanged and the production Svelte build succeeds.
These results establish a source/build baseline; factory integration remains
incomplete.

Add restoration regression tests and the full provenance audit to CI, using
a full-history checkout because the manifest names historical Git blobs.
Require this job in the existing CI Pass gate. Check committed destinations
and source-revision reachability so the audit does not depend on local-only
files or history. All 168 referenced source revisions were found reachable
from published refs or the branch being pushed.

The application remains the bundled Tauri desktop with its Svelte UI and
supervised AgentHub subprocess. Restore platform services to the engine,
AI configuration/execution to the kernel, and UI to its owning domains and
ColdLight components. Recovery is staging, never the permanent source owner.
Preserve prefixed ticket tables and the chat/Council product boundary.

The owner's activation requirement applies equally to local and remote
services: even a local runtime is reached through an endpoint. Group each
service with its UI around the same configured connection identity and
verified capability state. Configuration selects the endpoint, protocol and
credential reference; the owning adapter confirms the connection and the
capabilities needed by each feature before its operations become available.
Keep configuration and connection errors accessible in the UI. Installed
binaries, saved URLs and a successful process spawn do not establish readiness.
An empty models list does not establish inference readiness, and a models
list does not prove support for every operation. Failed authentication,
disconnects and configuration changes must invalidate affected readiness;
late probe results must not activate a different or superseded connection.

Initial audit evidence: `kernel/devpulse-clyffy/src/providers/adapters/identify`
had no production caller, and the desktop `commands/providers/client.rs` resolved
model-listing URLs from fixed registry transports, including localhost defaults.
The credential/model-discovery integration below moves that client into the
kernel and requires an explicit endpoint; generic `identify` integration and
the remaining R5/B1 activation work are still incomplete. Continue through that
kernel provider owner,
persist configured connections, resolve credentials through their existing
owner, and make service/UI readiness consume the same verified connection.
Provider defaults may seed editable configuration; they must not override it.
Subscription providers retain their vendor sign-in and supported transport.
Verify local and remote connections, required authentication, unavailable or
unsupported capabilities, endpoint changes during probes, and reconnects.

### Control-plane consistency and preserved service patterns (2026-11-01)

The owner authorizes continuing implementation, with restoration/review before
replacement. Canonical consistency is not yet enforced across all runtimes.
Keep the existing engine service manifest as the platform inventory. AI endpoint
configuration and protocol verification remain kernel-owned. UI consumes generated
contracts. Never infer readiness from an allocated object, saved URL or process
spawn. Reading status must not activate a lazy service.

Reviewed historical sources and their retained design intent:

| Preserved source | Pattern worth retaining | Current owner / remaining work |
| --- | --- | --- |
| `alpha/orchestrator/src/infra/core/registry.rs` | Project UUID remains stable when paths change | Engine project identity; do not replace identity with display labels or paths |
| `alpha/orchestrator/src/infra/core/scope.rs` | Explicit project/global ownership and scoped collections | Engine scoping plus kernel persistence; review individual APIs before moving |
| `alpha/orchestrator/src/infra/core/services/mod.rs` | Configured/enabled and actually loaded are separate | Extend engine status with separate lifecycle and readiness evidence |
| `alpha/orchestrator/src/infra/core/services/{traits,descriptors}.rs` | Typed operations separate from model metadata | Kernel providers/model-loader; retain old implementations until reconciled |
| `alpha/engine/src/system_status.rs` | Load failures, timing and resource observations are first-class | Engine service status; retain resource observations for later wiring |
| `alpha/orchestrator/src/types/infra_signal.rs` | Typed execution events and outcomes | Kernel emits facts; engine observes and routes them |
| `scripts/docs/sprints/SPRINT-PLATFORM-SERVICE-MANAGER.md` | Registered services, bounded health/shutdown, scalable inventory | Existing manifest is useful but runtime dispatch still needs consolidation |

The `alpha/` sources above remain byte-preserved under `recovered/repo/` until
their full behavior is restored or individually reconciled. This review is not
a claim that those files have been restored. The service-manager document is
already restored at its original path. Historical compiled-in model choices do
not override the owner's current endpoint-based architecture.

Execution sequence:

1. Extend the existing service status contract with stable service IDs,
   lifecycle, separately verified readiness, observation time and typed failure
   reasons. Bound health probes and keep absence/unknown distinct from ready.
   Include AgentHub in the inventory and expose its actual handshake/worker
   lifecycle without starting it during status reads. Update generated bindings
   and the current service UI, then test failures, timeouts and lazy startup.
2. Connect configured local/remote endpoint identity, protocol, credential
   reference and configuration revision to that contract through kernel adapters.
   Reject stale observations and invalidate readiness on configuration changes.
   Verify capabilities per operation; model listing is not inference readiness.
3. Extend inventory with explicit dependency/capability relationships suitable
   for service grouping and future mindmapping. Preserve original typed signal,
   scoped identity and project graph patterns; never infer edges from names.
4. Consolidate remaining lifecycle consumers around the inventory, including
   health/shutdown and service/UI activation. Account explicitly for AI provider,
   model runtime, audio, container and telemetry coverage before claiming all
   services adhere. Preserve factory/Council boundaries from the governing plan.

Work in bounded groups, verify each integration and record exact restoration
and test results. No alternate compatibility registry, hidden kernel or bulk
deletion of staged code. The first step establishes observable service truth;
it does not finish endpoint activation or the AgentHub factory.

First integration implemented (2026-11-01):

- The existing manifest now includes the AgentHub subprocess. Scope/role IDs,
  typed groups, lifecycle, readiness, evidence, observation time, latency and
  structured issues cross the generated Rust/TypeScript boundary. Status reads
  do not launch AgentHub or read session histories. Its verified protocol hello
  remains distinct from unverified ticket/provider capabilities.
- Service health derives from those same observations. Independent async probes
  have two-second deadlines; object presence alone cannot produce Healthy.
  Optional dormant services are excluded from aggregate health, while missing
  required services remain failures. Model-manager/grammar presence remains
  explicitly unverified until real operation checks are wired.
- Replaced the old forward health enumeration with the manifest-based collector;
  reverse shutdown enumeration remains pending consolidation. Fixed a discovered
  lookup bug: array indices had shifted after User Analytics was inserted, so
  role lookup could return another service's metadata. Lookup now searches the
  actual manifest and regression checks cover role identity and unique IDs.
- DevTools → Config has refreshable observations through a colocated renderer
  and props type, using existing ColdLight Badge/Text primitives. The status bar
  groups health by typed manifest groups, never translated names. Health types
  now re-export the generated IPC types instead of maintaining a second schema.
- No staged historical source was deleted or claimed as newly restored by this
  integration. Full preservation audit: 6,054 verified records, zero uncovered
  deletions within the audit's defined coverage, 403 verbatim active survivors.
  Restoration totals remain 756 restored/reconciled and 5,298 staged records;
  these records include historical variants and assets, not missing-feature counts.
- Engine: 188 tests passed, one existing ignored. AgentHub: 14 unit and five
  real-process integration tests passed. Two service-status browser tests passed.
  Svelte check: zero errors or warnings; Biome: 771 files; structure preflight,
  rustfmt and production Vite build passed. All 19 architecture checks passed
  on rerun; the initial ColdLight scan exceeded its five-second timeout under
  concurrent builds and passed unchanged in isolation and in the full rerun.
  Workspace Clippy with warnings denied passed. Normal commit/push hooks remain
  enabled for this checkpoint.

Still open: endpoint configuration revision/authentication/capability validation,
dependency edges for mindmapping, complete runtime inventory, unified activation
and shutdown, restoration of remaining historical behavior, and the factory
workflow. This integration does not establish an all-services readiness contract
or finish R3b/F1–F5. Packaged Tauri acceptance and live remote endpoint activation
have not been exercised here.

Credential/model-discovery integration (2026-11-01).
The initial audit found `get_api_key` exposed through Tauri despite its
backend-only contract, and key storage/status/model validation excluded local
HTTP servers by billing model. Reauthor these existing paths before expanding
endpoint activation: kernel transport metadata decides whether credentials are
supported; the OS vault remains the secret owner; only masked status crosses IPC.
Invalidate model-list observations during every credential mutation and reject
late or superseded probes. Keep failure classifications and real request tests.
Model discovery remains evidence for model discovery only, never inference.
Remove the frontend secret getter after verifying its consumers and retain the
Rust getter for backend callers. Test credential policy, UTF-8-safe masking,
in-flight invalidation, overlapping mutations and out-of-order completions.
This is a bounded part of step 2; saved endpoint configuration, capability
activation and the full factory remain open. The preserved historical provider
command module (`alpha/desktop/src-tauri/src/commands/providers/mod.rs`) was
reviewed: it contains hardcoded availability stubs, so it stays preserved rather
than replacing the current real credential and provider implementations.
Move the current desktop model-discovery HTTP implementation and its regression
tests to `kernel/devpulse-clyffy/src/providers/adapters/models/`. The engine
re-exports that owner; Tauri resolves vault credentials and maps typed errors.
Preserve vendor parsing and failure classifications through the move. Google
documents header authentication at https://ai.google.dev/api; use that instead
of URL secrets. Disable redirects for these credential-bearing requests, retain
deadlines on every client path, and redact echoed credentials before truncation.
UI key panels must say key saved, not connected or inference-ready.
The moved model-list operation requires an explicit API base endpoint from its
caller; registry URLs remain presets, never a runtime fallback. Validate HTTP(S)
addresses and reject embedded URL credentials/query secrets. Return the checked
endpoint with observations so a provider label cannot conceal which server was
contacted. Saved endpoint instances/editor and operation activation remain next;
this request contract must not be represented as their completion.

Implemented and checked: 16 kernel model-discovery tests and 49 desktop command
tests pass, including authenticated custom endpoints, redirect rejection,
credential redaction, stale results and cancelled credential mutations. The
credential panel browser test passes. Svelte reports zero errors and warnings;
the production Vite build, 773-file Biome check, structure preflight and workspace
rustfmt pass. Tests use dummy credentials and loopback servers, not the operator's
vault or application database. Bindings were regenerated from the Rust commands.
The moved implementation retains the original vendor parsers and all eleven
original client tests; five additional tests cover the corrected contracts.
Credential references and observations are still provider-scoped. Persisted
connection identities, revisions, per-connection credentials and capability
activation are outstanding; do not label the current provider preset as a
configured, verified endpoint instance. Packaged Tauri and real vendor account
acceptance remain untested.
All 20 architecture tests pass. The first run timed out during the unchanged
ColdLight filesystem scan under simultaneous builds; the full rerun passed with
that scan at 173 ms. Workspace Clippy with warnings denied passes. Completion
intentionally consumes each validation ticket so it cannot publish twice.

### Owner correction: included kernel and visible advanced UI (2026-11-01)

The owner reverses the old IP-hiding rule: the kernel is included, nothing
about the product's implementation is hidden to protect IP, and the advanced
UI must expose the available technical detail and controls. Layman-friendly
UI means efficient label translation and progressive disclosure, not a
separate reduced product or a developer-only build. This supersedes older
vocabulary bans and prompt-recipe secrecy requirements. Kernel remains the
AI code owner; engine remains the platform owner. These locations and typed
service boundaries organize code, not conceal it.

Update the root instructions, active boundary rule, terminology dictionary
documentation and architecture SSOT directly. Retain the generated dictionary
and signal contracts as useful presentation infrastructure. Generate labels
at build time and use cheap lookups; preserve raw identities and payloads so
changing UI detail does not require a restart or destroy information.
Advanced detail must be available in the shipped Tauri application. Credentials
and access authorization remain separate from product terminology visibility.

Audit and implementation completed: engine trace detail and dictionaries are
included in every build; facade IP substitutions and provider build-mode hiding
are removed. The desktop generator emits deterministic simple/advanced labels
with retained technical identities. Runtime presentation replaces development
build detection. Architecture tests, hooks and CI now check complete labels and
included kernel dependencies instead of vocabulary bans or secrecy features.

Execution, authorized by the owner's "get it planned out and finished":

1. Remove the engine/kernel secrecy build split; keep full trace records and
   cached label dictionaries in every build. Check the engine with and without
   default features and test retained trace data.
2. Remove facade IP substitutions while retaining explicit privacy controls,
   raw diagnostics and presentation presets. Test raw technical content survives.
3. Replace vocabulary-ban tooling with checks for dictionary completeness and
   included kernel dependencies. Update CI to check the real shipped contract.
4. Generate deterministic labels with explicit simple/advanced mode and raw
   identifiers. Add one persisted reactive presentation preference, consumed by
   the existing status, boot and Clyffy surfaces, with a ColdLight control in
   Settings. Keep the state/types and UI colocated under their existing owners.
5. Test switching, persistence, raw-name fallback and production-mode rendering;
   run architecture checks, Svelte checks, Rust tests/Clippy and production build.
   Record actual results and remaining unrelated restoration/factory work.

Implement and inspect bounded groups of at most five authored files, then
verify each coherent group. Generated outputs follow their generator. This
slice completes the visibility correction, not the separate endpoint-activation
or AgentHub factory implementation.

Completed behavior and validation (2026-11-01):

- Settings > Display detail switches Simple/Advanced immediately and persists
  across reloads and windows. Status, boot, subsystem and Clyffy views consume
  the same preference without changing service identity or readiness.
- Advanced exposes the existing visual builder through Ctrl+Shift+B using a
  lazy production chunk. Clyffy panels without live telemetry explicitly say
  Unavailable; this change does not claim those integrations are complete.
- Removed obsolete compile-time secrecy policy only, with direct replacements:
  DEBUG_FLAG becomes the runtime preference; vocabulary tests/hooks become
  terminology validation; the xtask boundary command becomes verify-architecture.
  The model-loader build-mode policy had no external consumers; model loading
  and inference implementations remain. Original sources remain in Git and
  replacement provenance is recorded in recovered/repo/SOURCES.tsv.
- Engine: 181 tests passed, one existing ignored. Provider registry: 10 passed.
  Model-loader: 170 passed; five obsolete build-mode policy tests were replaced
  by runtime presentation coverage. Architecture: 19 passed. Browser: three
  passed, including the real settings control and subsystem badge, persistence,
  cross-window updates, unknown names and storage failures.
- Workspace Clippy with warnings denied, rustfmt, Svelte checks (zero errors or
  warnings), production Vite build and deterministic generator checks passed.
  Repository Biome checks 768 files successfully after excluding generated
  Storybook bundles, consistent with existing build-output exclusions.
- This verifies the shipped UI bundle and native compilation. A packaged Tauri
  installer and live endpoint activation were not exercised by this slice.

Baseline CI follow-up: run 41334221426 exposed a source-reference problem and
a Linux-only lint failure. Three manifest entries used a local safety commit's
parent expression, even though the resolved source commits are published.
Normalize source references to full source commit IDs, verify their reachability
and content, and retain deletion metadata. Scope child-process mutability to
Windows, where job-assignment failure must kill the spawned child. Run the
process tests, recovery regression tests and full preservation audit before push.
Implemented: all 6,054 source records use full commit IDs; all 169 referenced
revisions are reachable from origin history or this branch. The writer now
records actual source revisions for future recoveries. Fourteen recovery tests
pass, including a clean clone without the local deletion commit. The full audit
reports zero uncovered deletions and 403 verbatim survivors. Process supervision
passes 12 tests (two existing ignored) and targeted Clippy with warnings denied.

## AgentHub factory and human supervision — governing plan, 2026-10-31

**Status:** The owner's resume authorizes F0: a clickable ColdLight factory
fixture for board, ticket, chat-owned Council assignment and human review.
Sample state must be explicit and isolated from production. Review this concrete
flow before expanding the runtime in F1–F5. The factory is not complete.
This slice does not run agents, send notifications or launch training jobs.
**Decider:** Jesse Hades Hall.

Owner correction: AgentHub is the AI factory/ticketing board under Overmind.
Council belongs in the tailored chat experience, with configurable participants
and premade roles assigned through UI. AgentHub has durable, clearly prefixed
tables so different AIs can generate tickets, share state and collaborate.
Email, push and supervised improvement make human involvement configurable.

This section governs R3b/R3c and plan 0001 B5. A session is not a ticket; a
Council is not the board; an idle agent does not imply completed work. Earlier
session-card columns and the history-first delivery sequence below are retained
as historical decisions and evidence, not current implementation instructions.
The 2026-10-29 navigation/readability checks did not validate the factory product.

### Context: what exists and what must change

| Existing owner inspected | Finding and disposition |
| --- | --- |
| `systems/devpulse-agenthub/src/protocol.rs` and engine `platform/agenthub.rs` | Bundled supervised child and retained history are real. The private requests are only `Sessions` and `Page`; live agent/room execution still belongs to the engine. Extend this boundary for ticket orchestration, durable checkpoints and execution; do not create a second runtime. |
| `interfaces/desktop/src/lib/domains/agenthub/feature/AgentHub.svelte` | Current primary surface is a session library. Replace its primary composition with the ticket factory. Preserve the history capability as linked context in chat/ticket detail, with an explicit consumer before moving it. No mass deletion or automatic session-to-ticket import. |
| `kernel/devpulse-clyffy/config/rooms/council.json`, `config/roles/`, engine `platform/rooms.rs` | Council phases and premade roles already exist. The inspected chat UI has no room-command consumers. Build the configuration/role-assignment flow in chat from these owners. Keep the preset's blind answers and anonymized selection semantics; arbitrary shared context must not defeat them. |
| `systems/devpulse-engine/migrations/user/0003_agenthub_thread_ownership.sql` | `agenthub_threads` and `agenthub_room_threads` preserve continuation/seating records. They are not ticket tables. Audit their actual ownership before any rename; a SQL prefix must not move Council's product identity into AgentHub. |
| Engine `platform/services/relational.rs` | Shared `projects`, `sessions`, `turns`, `corrections` and `learnings` already exist. Reference their canonical records. Existing correction tables alone do not provide a reviewed training workflow. |
| ColdLight `COMPOSITION-CONTRACT.md` | The required two-stage component/composition architecture and generated styling already have an explicit contract. Use it; do not introduce another preset system. |
| Notification/training integration search | The inspected active engine/runtime/chat paths do not establish durable ticket notifications or model training jobs. Existing toast/notification behaviors are UI building blocks, not delivery services. Recovery search found historical notification components; no recovered ticket engine was identified by this bounded search. |

### Decision: tickets carry work; chat carries conversation

AgentHub owns the work specification, dependencies, assignments, execution
attempts, shared evidence, decisions and accepted outcome. Chat provides the
conversation and Council configuration. A ticket can link multiple conversations
and runs; a conversation can propose several tickets. Council can plan, critique
or review ticket work without becoming a board column or a replacement board.
Shared execution machinery may run in the supervised child without changing
those product boundaries: Council configuration remains owned by chat.

Example acceptance journey: create a ticket with a goal and acceptance criteria;
use chat to assign a planner, worker and independent reviewer from available
roles/providers; generate bounded subtasks; have two AIs contribute distinct
artifacts; pause before a configured action; open the review from a notification;
correct the proposal; resume the authorized attempt; accept the result against
the ticket criteria. Reopening DevPulse reconstructs the same work and decisions.

Proposed starting workflow: **Intake → Ready → Working → Review → Done**, with
explicit Blocked and Cancelled outcomes. Names/columns remain configurable.
Store ticket workflow state separately from run activity (queued/running/
waiting/interrupted/failed) and view ordering. Moving a card requests a validated
workflow transition; changing visual order alone never approves or executes work.
Done requires persisted acceptance evidence under the selected policy.

Tickets may originate from a person, chat/Council, an AI proposal or a configured
integration. AI-created tickets retain source, parent, rationale, deduplication
key and applicable policy. Intake/automatic admission and limits on child tickets,
depth, concurrent work, retries and spend/time are explicit. A model cannot grant
itself more authority by creating another ticket or delegating to another AI.

### Durable model and shared-work rules

The SQL namespace is `agenthub_`, including owned indexes and constraints. The
human-facing key, such as `DP-42`, is a separate configurable board/project prefix;
it is not a SQL table prefix. Stable internal IDs survive display-key changes.
The following are proposed logical tables, to validate against the schema before
implementation and add only as their delivery slices require:

| Table family | Responsibility |
| --- | --- |
| `agenthub_boards`, `agenthub_workflows`, `agenthub_tickets` | Project scope, workflow versions, ticket number allocation, goal, criteria, priority, lifecycle and revision. |
| `agenthub_dependencies`, `agenthub_assignments`, `agenthub_ticket_links` | Parent/dependency graph, role/participant assignments, references to canonical chat sessions, Council runs and source records. |
| `agenthub_runs`, `agenthub_steps`, `agenthub_checkpoints` | Attempts, provider/model/role/policy versions, bounded work units, claims, fencing tokens, execution receipts and restart state. |
| `agenthub_artifacts`, `agenthub_context_revisions`, `agenthub_events` | Versioned outputs, evidence and shared decisions with author/provenance; an ordered audit trail. Large content uses verified artifact references, not repeated stream blobs. |
| `agenthub_supervision_policies`, `agenthub_reviews`, `agenthub_review_decisions` | Immutable policy versions, the exact proposal under review, reviewer authority, decision, edits, reason and expiry. |
| `agenthub_outbox`, `agenthub_notification_rules`, `agenthub_deliveries` | Transactional event publication and ticket notification preferences/delivery attempts. Reuse a platform-wide delivery owner if its implementation audit finds one; never duplicate provider credentials. |
| `agenthub_feedback` | Ticket-specific correction/evaluation links to canonical corrections and learning records; eligibility/provenance for later reviewed datasets. Training assets/jobs belong to the model/training owner, not another copy of ticket state. |

Keep one durable write authority in the existing engine user-database service.
The bundled AgentHub child submits typed domain operations over a correlated,
bidirectional protocol; no raw SQL or credentials are exposed to AI workers.
Validate project scope, actor authority, expected revision, policy and claim in
the durable transaction. Commit state changes, audit event and outbox record
together, then notify subscribers. Materialized rows plus an audit log are enough;
a new event-sourcing infrastructure is not a prerequisite.

Multiple agents collaborate through explicit assignments, handoff artifacts and
versioned context. A worker reads a named context revision and submits a proposed
delta; conflicts are surfaced or reviewed, never silently last-write-wins. A
parallel contribution has its own step/claim, so a ticket can have several AIs
without two workers owning the same exclusive step. Dependency cycles are refused.
For code work, include isolated worktrees or scoped resource claims and an explicit
integration step; shared database state does not make concurrent filesystem edits
safe. Council visibility rules constrain which contributions each seat can read.

Claims have leases and monotonic fencing tokens. Late results from an expired
claim cannot advance the current attempt. Bounded dispatch uses idempotency keys
where the downstream action supports them. If an external side effect may have
occurred before a crash, persist an uncertain/interrupted outcome and reconcile
before another attempt. Do not promise exactly-once external execution. Resume
starts from the committed checkpoint; it never blindly repeats completed tools.

### Human involvement is a versioned execution policy

Offer understandable presets, then reveal their editable rules. Proposed presets:
**Guide each step**, **Review milestones**, **Work within limits**. These configure
the same policy engine rather than separate execution paths or a vague trust slider.

| Configurable dimension | Concrete control |
| --- | --- |
| Checkpoints | Review ticket admission, plan, selected tool/action classes, handoffs, artifact acceptance or completion. |
| Authority | Allowed workspaces, tools, endpoints and actions; per-run limits; named human reviewers and optional independent AI review. |
| Escalation | Ask on missing information, failed checks, conflicting evidence, exhausted limits or policy-defined conditions. Model-reported confidence alone cannot authorize work. |
| Response | Approve once, edit and approve the resulting revision, request changes, reject, pause, cancel or reassign. Each action has a distinct state transition. |
| Timing | Deadlines, reminders, quiet hours and escalation recipients. Silence/timeout is not approval; a policy may explicitly choose pause or cancellation. |
| Learning | Record feedback, propose a scoped workflow/role change, and separately choose whether reviewed examples may enter a dataset. |

The review UI shows the proposed action/change, affected resources, evidence,
acceptance criteria, expected cost where available and why this checkpoint fired.
Approval binds to a specific ticket/step/proposal revision and policy version.
Changed proposals invalidate old approval; a human edit produces a new revision
and is validated before dispatch. Duplicate decisions are idempotent; conflicting
decisions are rejected visibly. Authorization to act and judgment that an answer
is correct are separate facts.

Enforce policy in the execution boundary, not only in Svelte or prompt text.
Audit each provider's real controls. If a CLI cannot expose/intercept an action
that a selected policy requires reviewing, that provider cannot run that policy's
tool-enabled workflow; offer an explicit talk-only proposal or a supported route.
Closing a window does not dismiss pending review. Tightening/revoking authority
affects pending dispatch and triggers controlled cancellation where possible;
already completed external actions are not claimed to be undone.

### Notifications and supervised improvement

Notifications arise from committed ticket/review events. In-app inbox, native
desktop alerts, email and remote device push are separate delivery channels with
shared preferences, deduplication, retry/backoff, delivery status and escalation.
The outbox survives crashes and is reconciled after restart. Channel failure does
not lose the review or complete the ticket. Default payloads are summaries with a
link to current evidence; full prompts/artifacts are not copied into every alert.

Desktop notifications do not establish remote push while the computer is off.
Plan two explicit operating modes: portable/local processing while the supervised
host runs; optional always-on authenticated hosting/relay for remote work and
delivery. A remote inference endpoint alone is not an always-on ticket coordinator.
Remote review must resolve to the same authority with project-scoped identity,
current revision and expiring, replay-resistant actions. A link click or arbitrary
email reply must not become an approval. Incoming email-to-ticket intake is a
separate optional integration, with source verification and bounded admission.

Planning assumption pending the owner's training clarification: include both
tracks, deliver workflow supervision first. **Workflow improvement** turns a
reviewed correction into a proposed, versioned role/prompt/policy change with
scope, explanation, evaluation and rollback. It does not change model weights.
**Model training** requires separately reviewed examples, dataset versions,
provenance/consent, exclusions, train/evaluation separation and a compatible
training backend. Retain input, observed output, corrected target, rationale and
task/role/model versions; never label every approval or successful run ground truth.
Do not collect hidden reasoning as a training requirement. Split related tickets
and conversation families together to avoid evaluation leakage.

A training job becomes work that can itself be tracked on the board: prepare,
review dataset, train through the training owner, evaluate against a held-out
baseline, then explicitly promote or reject a candidate. Keep model/adapter
lineage and rollback. Codex subscription activation, remote inference capability
and model-training availability are independent contracts; verify support before
offering Train. No training backend or notification vendor is selected by this plan.

### ColdLight experience and delivery order

The board shows the work, blockers, responsible roles and pending decisions.
Ticket detail exposes brief/criteria, dependencies, assignments, artifacts,
activity and review. Chat owns Council template selection, premade-role editing,
provider-to-seat assignment and the linked conversation. A supervision inspector
previews which checkpoints a policy would trigger before it is applied. Training
review presents corrections and candidate examples explicitly rather than a
single unexplained rating. Cross-links preserve ticket and conversation identity.

Follow `packages/coldlight/COMPOSITION-CONTRACT.md`: reusable typed components
and behaviors in ColdLight, domain render compositions/types/tokens colocated in
`domains/agenthub/ui/<name>/` and `domains/chat/ui/<name>/`; data and commands in
their existing data-access owners. DTCG → generated CSS/TS at build time; reusable
SVG geometry, generated visual families and state treatments. Layout utilities
remain layout. No inline visual engine, duplicate component registry or parallel
V2 implementation. Audit Card, Badge, Avatar, status, dialogs, tables, drag/drop
and review behaviors before adding a reusable board column. Keyboard moves and
an equivalent list view must expose the same validated workflow actions.

Measure cold board load, incremental updates, DOM/paint cost and native interaction
at agreed ticket volumes and 1024/1440 widths. Use bounded queries/paging and
virtualization when warranted; loading a board must not scan transcript contents.
Test long content, pending/conflicting/stale decisions, offline recovery, focus,
contrast, reduced motion and generated visual families with actual CSS loaded.

| Order | Reviewable delivery | Required proof |
| --- | --- | --- |
| F0 — agree the product | One clickable ColdLight fixture of board → ticket → Council assignment → human review, with clearly labeled fixture data and supervision policy examples. Inventory ownership and preserve the useful current code. | Owner can judge the intended workflow before further runtime expansion; no claim that fixture work is functional backend delivery. |
| F1 — durable tickets | Prefix schema, workflow/revision rules, manual ticket creation, generated draft intake, real board/detail UI and persistence commands. | Reopen/restart preserves tickets; concurrent creation has unique numbers; unauthorized/stale transitions fail; history is linked context only. |
| F2 — one supervised worker | Bidirectional process boundary, durable claims/checkpoints, provider capability checks and one complete ticket run through existing provider owners. | Real selected provider produces persisted evidence; pause/review survives restart; approval resumes the exact step; crash cannot silently duplicate actions. |
| F3 — collaborating AIs and Council | Chat role/seat configuration, versioned shared context, parallel step assignments, dependency handoffs and independent review. | Two distinct AIs contribute to one ticket; conflicts are visible; Council visibility rules hold; reassignment rejects stale worker writes. |
| F4 — reach the human | Persisted review inbox, native alerts, email and selected remote push/hosting path, with visible delivery status. | Lost connection, duplicate delivery, expired review and offline host are truthful; a real notification opens the correct current review. |
| F5 — improvement with evidence | Reviewed feedback, versioned workflow changes, optional curated dataset/training/evaluation/promotion flow. | A correction improves a measured subsequent task; excluded data stays excluded; a worse candidate is rejected and rollback works. |
| Release gate | Complete bundled/installed/portable and chosen remote operating modes. | Clean-machine launch, subprocess cleanup, migration record preservation, endpoint/Codex activation, recovery and the full visible factory journey. |

Each row is split into bounded implementation phases in this same plan; none is
permission to skip correctness or defer all UI until backend work is finished.
The owner's resume starts F0. The first functional backend milestone remains
a persisted ticket with a real worker and a durable human decision.

### F0 implementation and review evidence — 2026-10-31

The clickable fixture is `AgentHub/Factory review` in Storybook, authored in
`interfaces/desktop/src/stories/AgentFactoryReview.stories.svelte`. It composes
typed `agenthub/ui/factory-board`, `agenthub/ui/ticket-detail` and the chat-owned
`chat/ui/council-config` adapters. Styles are generated from colocated DTCG
tokens through the existing pipeline. Existing Card/Button/Badge/Checkbox/Select
components provide the behavior and surfaces. No duplicate board-card kind,
compatibility facade or inline visual engine was added.

The fixture supports manual intake with criteria, ticket evidence inspection,
Council role/provider assignment, three supervision examples, acceptance gated
by criteria, corrections and a new sample proposal. It resets on reload and is
explicitly sample data. The Council preset preserves three blind answerers and
an independent selector; selecting an answerer's vendor for the selector blocks
save. Production session/history code and all recovered code remain present.

Review route while the local compiled preview server runs:
`http://127.0.0.1:6006/iframe.html?id=agenthub-factory-review--tickets-and-human-review&viewMode=story`.
Open DP-42, inspect evidence, change supervision, request a correction, load the
revised sample and confirm the criteria. Open Council in chat to assign premade
roles. New ticket creates a sample Intake card; neither action starts an agent.

Verification: eight browser/story tests pass across the factory, retained
failure-review story and ColdLight composition story; 19 architecture tests
pass with one existing skip. App, stories and ColdLight type checks have zero
errors/warnings; scoped Biome and token freshness pass (114 generated outputs).
`pnpm build-storybook` completes. Screenshots at 1440, 1024 and 390 pixels and
test/build logs are retained under `.userdata/proof/`.

Direct fixes found while exercising F0:
- ColdLight Select now forwards accessible names to its combobox behavior.
- Chat's existing `ui/index.ts` is its public presentation entry, separate from
  its runtime entry. All presentation callers moved together; no compatibility
  exports remain. Importing Council configuration no longer imports ChatRoot,
  provider/project state or the full AgentHub session feature.
- TypeScript excludes generated `storybook-static` vendor bundles from authored
  source checking. Storybook prebundles native window helpers before rendering.

Owner workflow/visual acceptance is still pending. F0 is not R3b completion:
database tickets, subprocess work/checkpoints, real Council execution/provider
activation, configurable delivery and reviewed improvement are F1–F5. This
preview does not implement drag/reorder, durable policy enforcement, remote
endpoint authentication, Codex subscription activation, notifications or model
training. Native/installed validation and production-scale cold-load/paint
budgets remain release work. Vite's development preview was slow to compile;
the review URL serves the verified compiled Storybook output instead. Do not
treat this as a production startup-performance measurement.

### Options, consequences and research

| Option | Assessment |
| --- | --- |
| Continue the session/status board | Reuses the current view but does not model factory work, durable acceptance or shared ticket state. Rejected by owner correction. |
| Ticket domain on existing database/provider/process owners | Proposed: preserves useful code and gives the factory one durable authority. Requires real workflow, concurrency, recovery and review design. |
| Introduce a separate workflow platform immediately | Adds another persistence/deployment boundary before requirements are proven. Not selected; reconsider only if the implemented workload demonstrates a need. |

Primary-source research informs these recommendations; it does not select new
dependencies. [LangGraph durable interrupts](https://docs.langchain.com/oss/python/langgraph/interrupts)
illustrate persisted human pauses and the danger of replayed side effects.
[AWS transactional outbox guidance](https://docs.aws.amazon.com/prescriptive-guidance/latest/cloud-design-patterns/transactional-outbox.html)
supports committing publication intent with state and handling duplicate delivery.
[Tauri notifications](https://v2.tauri.app/plugin/notification/) cover native
alerts and document installed-app constraints on Windows; portable and remote
push acceptance therefore need separate checks.
[Hugging Face SFT](https://huggingface.co/docs/trl/sft_trainer) documents explicit
training datasets and adapter training, distinct from conversational feedback.
[OpenAI fine-tuning guidance](https://developers.openai.com/api/docs/guides/supervised-fine-tuning)
emphasizes evaluation before training and currently documents availability
restrictions; do not promise training based on an inference/subscription login.

Open product choices for the fixture: intended supervision presets/defaults;
project versus board scope of display ticket prefixes; desktop-only versus
phone/web push and always-on hosting; workflow coaching versus actual model
training (or both); first representative factory task and expected board scale.
Defaults above are proposals, not answers supplied by the owner.

## Owner direction (2026-10-24)

> "i still have like none of my actual code recovered this is bullshit for
> years of work"

> "we also want to be smart and let devpulse sense wherever it is running if
> users have claude code, codex, and then devpulse gives you the agenthub
> board built in uses the database, and again we have this all clean as a
> portable dev instance"

Answers that day:

- **Recovery:** "All of it back now, then wire". Every gone file returns to
  the repo today, unchanged, under `recovered/` with its original path and
  the commit it came from, kept out of the build and the lint hooks. Then
  capabilities are wired back working one by one, starting with AgentHub.
- **Outside code:** "devpulselabs only". Its Rust chat crates (with the Claude
  Code and Codex session readers) are copied in once. review-archive is not
  used; the AgentHub UI is built fresh in Svelte.

## Context — what is missing (measured 2026-10-24)

Every code file (`.rs .ts .svelte .tsx .js .mjs .py .surql .sql .toml .css`)
that any branch's history deleted and that is not at HEAD — excluding build
output, vendored `deps/` and generated files:

- **4,923 files, 12.6 MB** whose content exists nowhere at HEAD (186 more
  survive verbatim under another path and are not counted).
- **2,204 files, 7.7 MB** of those have a name that exists nowhere at HEAD
  (truly gone); the other ~2,700 were moved or rewritten (e.g. `connectome/`
  files whose `cortex/` successors are here, edited).
- Largest areas: the January–March 2026 design system in
  `interfaces/desktop/src/lib/design/` (api, primitives, components, styles,
  coldlight, taxonomy, recipes, shortcodes, presets, tokens, builders —
  ~6 MB), the February `alpha/` architecture (orchestrator, engine, lab,
  shared, desktop, bad_desktop, archive — ~2.3 MB), `docs/site` (0.5 MB), the
  April–May app domains (`domains/app`: setup wizard steps, voice lab,
  Maestro, hub pages — 0.5 MB), the July kernel cut (`connectome/`,
  `devpulse-persona-mcp` — 0.45 MB), and `OLD_PROJECTS_CSS_TSX` (your older
  React projects).
- **AgentHub was never committed to this repo** (checked on every branch).
  Its pieces live in devpulselabs `crates/chat/` (16 crates:
  accounts, browser-auth, context, core, extensions, imagine, interactions,
  profiles, providers, renderers, runtime, social, store, testkit, window,
  windows) at `c78ec8b` (branch `docs/rulings-2026-10-25`).

## Non-goals

- Nothing in `recovered/` is compiled, linted or shipped. It is your code,
  kept as it was; wiring a piece back means authoring it into its owning
  boundary under that boundary's plan and rules.
- Nothing is deleted from `recovered/` without your OK per item (rule 1).

## Phases

| # | Outcome | Check |
| --- | --- | --- |
| R1 | **The repo's history, back.** `scripts/recovery/restore_history.py` writes every missing code file to `recovered/repo/<original path>` from the commit just before its deletion; `recovered/repo/SOURCES.tsv` says, per file, the commit it came from, the commit that deleted it, the date, and whether its name still exists at HEAD. `recovered/` is excluded from Biome, the lefthook hooks and any workspace glob. | 4,923 files present; every one byte-identical to `git show <commit>^:<path>`; `pnpm check`, `cargo check`, the hooks unaffected |
| R2 | **devpulselabs' chat crates, copied in once.** `crates/chat/**`, its workspace `Cargo.toml`, and its chat docs to `recovered/devpulselabs/` (tracked and untracked files, its `.gitignore` respected), with the source commit recorded. Never read from `D:\projects\devpulselabs` again. | file count and hashes match the source |
| R3 | **AgentHub AI factory (plan 0001 B5).** Retain the R3a history capability as linked context. R3b/R3c now follow the governing 2026-10-31 F0–F5 proposal above: durable tickets, cooperating AIs, configurable human supervision, notifications and reviewed improvement. Council configuration belongs in chat. | a persisted ticket worked collaboratively, reviewed against evidence, resumed safely and reconstructed after restart |
| R4 | **Then by capability, in the order you set** — from the list R1 makes visible (persona memory MCP, Cortex/Knowledge page, Visual Page Builder, voice lab, Maestro, the hub pages, …), each under its owning plan. | per capability, live |

### AgentHub architecture correction (owner, 2026-10-27)

**Status:** Accepted product requirements; implementation remains open.
**Decider:** Jesse Hades Hall. This direction governs R3b and the B5 work
in plan 0001; the earlier in-process facade is not the finished architecture.

> "agenthub should be properly using clean prefix tables, and properly
> leverage the ability to integrate clyffy from remote endpoints, activate
> with their codex subscription ... agenthub is a sub process, and properly
> bundled with devpulse"

**Context at the architecture review (before the extraction below):** `Platform` constructs
`AgentHub`, `Agents` and `Rooms` inside the desktop's engine process.
`platform/agenthub.rs` is a retained history catalog, not a supervised
AgentHub executable. The release configuration does not declare an
AgentHub binary. Shared conversation tables and `agent_threads` /
`room_threads` exist, but the board and ticket tables do not. The endpoint
probe identifies an OpenAI-compatible server; that alone does not establish
Clyffy execution through it. Codex uses its own login and the ACP connector,
but `SignedIn::Yes` does not distinguish ChatGPT login from API-key login.

**Decision and ownership:**

- AgentHub is a bundled Rust subprocess, supervised by DevPulse through
  the existing `devpulse-process` lifecycle machinery. It owns AgentHub
  orchestration, the history catalog and authoritative live execution state.
  The engine facade becomes its typed client; Tauri and Svelte consume that
  client. Reuse and relocate the active history, agent and room capabilities
  with their tests; do not leave a second in-process execution path.
- AgentHub-owned SQL tables, indexes and constraints use the `agenthub_`
  prefix. The board table is `agenthub_board_cards`; tickets and their
  related rows follow the same namespace. Inventory the existing thread,
  room, session and turn ownership before naming the rest. Shared chat and
  project records retain one canonical owner and explicit references; do not
  copy them into a second store just to add a prefix. Reauthor schema and
  every reader/writer together. Preserve existing user records through an
  explicit, tested data migration; no compatibility views, aliases or dual
  writes, and no database reset.
- Keep one authority for durable writes. The intended integration is the
  platform's existing user-database service, reached by the subprocess over
  typed requests. Answer, continuation token and completion state must commit
  together before success is published. The subprocess boundary must not
  split a logical transaction into independent acknowledgements.
- AgentHub consumes Clyffy's provider/endpoint contract. Configured remote
  endpoints are valid execution sources without a local model requirement.
  Resolve the selected endpoint and model, authentication reference and
  advertised capabilities; verify a real request, streaming, cancellation
  and disconnect behavior. Reuse the provider owners from plan 0001, not a
  second AgentHub-only registry. Do not send subscription credentials to a
  remote endpoint or silently substitute a different provider.
- Codex activation uses the user's explicit action and Codex's own sign-in.
  Distinguish installation, connector readiness, authentication method and
  successful use. A generic successful login check is not proof of an active
  subscription. Keep subscription execution through the vendor's supported
  authenticated transport; API-key usage is a separately identified choice.
  Preserve the verified workspace and resume identity across the process
  boundary. Do not copy login secrets into AgentHub tables or the bundle.
- Ship the AgentHub executable and required non-secret resources in both
  portable and installer builds. Resolve it from the installed bundle, not
  the developer checkout or a globally installed command. Verify startup
  readiness, protocol/build compatibility, logs, shutdown and child cleanup.
  A crash must resolve pending requests and invalidate live state; restarting
  the process must not silently repeat tool work.

**Trade-off:** A subprocess adds transport, lifecycle and packaging work,
but gives AgentHub the explicit runtime boundary the owner requires. Keeping
only the current in-process facade would avoid that work but would not meet
the requirement. The existing facade remains the integration point while
its implementation is reauthored, not a compatibility alternative.

**Acceptance before R3b is complete:** packaged clean-machine startup with
no checkout, one supervised AgentHub child, no child after DevPulse exits;
schema/foreign-key and record-preservation checks; two-window live-state
reconstruction; an explicitly activated Codex subscription producing and
continuing a saved turn; a configured remote endpoint powering Clyffy in an
AgentHub workflow; injected database, authentication, endpoint and child
failure with truthful UI and recoverable answers. Unit tests or a working
history list do not substitute for these integration checks.

**Execution slice (2026-10-27, resumed):** move the retained history owner
and its existing tests into `systems/devpulse-agenthub`, reached only by
the engine's existing facade over private supervised stdin/stdout. Extend
`devpulse-process` to hand protocol pipes to its caller while keeping stderr
as logs and retaining its Job Object/process-group ownership. Use bounded,
typed frames, a protocol/build handshake before requests, serialized request
ownership and fail-closed disconnects; never replay a failed request. Build
and stage the executable through xtask for development and both release
formats. Tauri's official sidecar contract requires a target-suffixed source
binary in `bundle.externalBin` (research:
https://v2.tauri.app/develop/sidecar/). Agent/room execution and live state
still require extraction after this slice; this does not complete R3b.0.

Packaging uses the explicit `tauri.agenthub.conf.json` overlay for the
runtime declaration. Both xtask launch/build commands pass it to Tauri,
and the portable planner merges the same file after platform overrides.
`cargo xtask build-agenthub [--release]` compiles/stages the real executable;
`run-dev` and `build-release` invoke the same builder automatically. Ordinary
workspace typechecking does not require a pre-existing packaged executable.

The first executable slice owns history only. Agent/room orchestration and
the authoritative live observations still run in the engine. Before moving
those owners, extend the private connection for typed host callbacks and
live notifications: persistence stays with the engine's existing Turso
authority, provider resolution stays with its existing registry, and closing
a window must never terminate unrelated tool work. The first serialized
history exchange failed closed if its caller was interrupted; the worker
phase below corrects that lifetime. It is still not the bidirectional
transport for long-running agent execution. No UI surface or vendor/
remote execution acceptance is implied by the history process tests.

**Worker execution phase (2026-10-27, delivered):** reauthor the existing
history client so a background worker owns the supervised child and every
accepted exchange. A caller dropping its response receiver must not drop
the process or lose framing for another window. Bound the request queue,
retain fail-closed transport errors without replay, detect child exit even
while idle, and make shutdown independent of the future that requested it.
Verify cancellation after dispatch, the next queued reply, startup failure,
idle/pending child failure and shutdown with real supervised test children.
This phase changes the client, its worker and tests; it does not introduce
an alternate transport or claim agent/room extraction. Typed host callbacks,
live notifications and runtime-owned execution remain the following boundary
work before R3b.0 can pass.

Worker phase verified: 13 unit tests and 5 actual-executable tests pass;
all-target Clippy passes with warnings denied. Controlled supervised peers
verify interrupted startup/callers, distinct subsequent replies, a saturated
32-command queue, pending/idle child failure, timeout, repeated shutdown and
cleanup after the shutdown caller or client is dropped.

**ACP lifecycle phase (2026-10-27, delivered):** the review found two ACP task-detachment
paths: dropping `AcpSession::start` while waiting for readiness drops a raw
JoinHandle, and the existing close timeout does the same. Tokio documents
that a dropped [JoinHandle](https://docs.rs/tokio/latest/tokio/task/struct.JoinHandle.html)
detaches its task. The installed ACP SDK 3.4.0's `acp_agent.rs` owns a
`ChildGuard` that terminates its child when the connection future is dropped
(Unix also terminates its process group; Windows descendant supervision
still requires the AgentHub Job boundary). Give the connection one background
owner with an explicit lifetime signal and confirmed cleanup. Dropped startup
or session handles must stop it; an explicit close must finish even when its
waiter leaves. Preserve graceful close, force disposal after its deadline,
clear pending permissions/turn senders, and test the actual ownership paths.
This phase touches ACP and its lifecycle tests plus this plan, and does not
claim that the engine's startup Cancel button or subprocess extraction is done.

Verification: 19 provider-session tests pass (7 new lifecycle regressions,
including cancelling a real SDK-launched Windows child before readiness).
Graceful and forced close, abandoned close waiters, session drop, startup
failure/timeout and connection panic clear their retained resources. Existing
ACP restore and permission-resolution tests still pass. The engine/runtime
run passes 204 tests (182 engine, 4 signal contracts, 18 AgentHub); four
existing integration tests remain ignored across these runs. Logs are in
`.userdata/logs/agenthub-acp-lifecycle-tests.log` and
`.userdata/logs/agenthub-lifecycle-engine-tests.log`.
All-target Clippy for kernel, engine and runtime passes with warnings denied;
`cargo xtask build-agenthub` rebuilt and staged the development executable.

Next boundary work remains concrete: extend startup cancellation and close
ownership to room seats; typed host callbacks for the existing
database/provider owners; relocate agent/room orchestration and live
state into the runtime; relay snapshots and disconnect invalidation. Then
complete the persisted board and generated ColdLight UI, remote endpoint
execution, explicit subscription activation/continuation and packaged native
acceptance. The thread lifecycle work below does not satisfy those boundaries.

**Per-conversation control phase (2026-10-28, resumed):** reauthor the
agent thread registry as one entry per conversation, retaining its session,
turn gate and cancellation/close signal. Never hold the registry lock across
provider startup. Register control before publishing Working; cancellation
must interrupt startup and prevent later dispatch when observed before it.
Do not cancel an in-progress database transaction. A running turn retains its
gate through answer persistence. Close runs independently of its waiter and
keeps the entry unavailable until both cleanup and persistence have ended.
Test independent startup, cancellation before/during startup and dispatch,
permission access during unrelated startup, close/reopen races and persistence
failure. This phase changes the agent owner, its lifecycle helper and tests,
and this plan. Room-seat lifecycle and execution extraction remain separate.

Per-conversation phase passes 194 engine/contract tests (8 new regressions)
and all-target Clippy with warnings denied. Admitted startup/persistence also
has an engine-owned task, so dropping the IPC waiter cannot abandon work.

**Headless teardown phase (2026-10-28):** review of the kernel close path
found that headless Close only sent Cancel, and its previous-turn timeout
dropped a raw JoinHandle. Reauthor the existing task ownership with the
workspace's Tokio utility guard, wait for shutdown, refuse reuse after Close,
and fail a new prompt if the previous process did not exit cleanly within
the deadline. Verify task disposal and a real fixture child's termination.
This phase touches the headless owner, session dispatcher, kernel dependency
declaration/lock and this plan; tests stay beside the existing headless tests.

Headless verification: 23 provider-session tests pass, with one existing
subscription integration test ignored. Four new regressions cover forced
task disposal, abandoned Close, Close during previous-turn exit, and actual
Windows child termination on both Close and session drop. These are local
process fixtures, not vendor subscription or native UI acceptance.

Combined verification after both changes: 212 engine/runtime tests pass
(190 engine, 4 signal contracts, 18 runtime), plus the 23 provider-session
tests above; four existing integration tests remain ignored. All-target
Clippy for kernel, engine and runtime passes with warnings denied. Logs:
`.userdata/logs/agenthub-final-tests.log`, `agenthub-headless-tests.log` and
`agenthub-final-clippy.log`. Room review confirms that Cancel can miss a seat
still starting and Close removes the live entry before run completion; those
paths need the same owned-lifetime guarantees before runtime extraction.

**Visible chat/AgentHub phase (2026-10-29, owner correction):** the owner
requires the chat and AgentHub experience to be established, not another
isolated backend milestone. Wire the existing subprocess catalog and paging
commands into the AgentHub domain under Overmind, cross-linked from the
separate tailored chat interface. Present provider-scoped parent/child sessions, retained live
activity, source failures and a read-only newest-page transcript reader with
explicit older paging. Preserve unknown/orphan sub-agents and distinguish
historical activity from observed live state. Use typed ColdLight adapters
with colocated generated visuals; do not create an execution stack in UI.
Deliver in verified phases of at most five authored files: catalog state and
race tests; session and transcript adapters; feature/page/navigation/chat
wiring. Render and test the visible flow. Persisted board placement, runtime
extraction and explicit continuation still require their original acceptance
checks; this session browser must not masquerade as the finished board.

Native verification exposed an unsafe existing launcher boundary:
`clear_build_lock_holders` kills every non-ancestor cargo/rustc process by
name, including other workspaces. The 2026-10-29 launcher log reported four
Cargo processes killed. Reauthor this scan as diagnostics only on Windows
and Unix; let Cargo own its normal file locking. Update dev/release callers
and their messages together, with no compatibility alias. This safety phase
touches the existing scanner, both callers and this plan. Do not repeat the
old launcher after this finding.

### R3b — the board, in detail (written 2026-10-25)

**Historical design, superseded by the 2026-10-31 governing section above.**
Keep the measured history/cache evidence and useful components. Do not implement
the session-card model, idle-to-Done mapping or history-first sequence as the
factory board. F0–F5 now define the proposed delivery order around actual tickets.

What R3a's live check showed, which R3b builds on:

- The 173 transcripts on this machine are **60 sessions you started**
  (Claude Code 26, Codex 34) and **113 sub-agents** those sessions spawned
  (Claude Code 105, under `<session>/subagents/agent-*.jsonl`, each marked
  `isSidechain` with its parent's `sessionId`; Codex 8, marked
  `source.subagent`). R3a lists them flat.
- Each listing re-reads every file's start, about 29 MB here: about 200 ms
  warm, 3.8–4.8 s for the first call while the app boots.
- Your design material: `recovered/devpulselabs/docs/proof/` is chat — a
  provider sidebar with each provider's found-session count, pinned rooms,
  a read-only "Past transcript" reader. Nothing in your material designs a
  board. ColdLight's `useDragAndDrop` is kept for "kanban future work"
  (`packages/coldlight/docs/BEHAVIORS-ORPHAN-HOOKS.md:23`).

The library inventory for the board (plan 0001 B4.3b's first step):

- **A card is covered:** `card` (`as="button"`, header/body/footer slots,
  `variant`, `disabled`) with `status-dot` for its state, `badge` for its
  agent, `avatar`. The board's card is a domain adapter,
  `domains/agenthub/ui/board-card/`, with its preset beside it. No
  `seat-card` kind for the board; the rooms' seat is decided with the rooms
  in B4.3b.
- **A column is not:** nothing is a labelled, ordered list that takes a
  dropped card and has a keyboard way to move one. New kind `board-column`
  (anatomy, component, types, tokens, schema, index) on `useDragAndDrop`,
  with list semantics and its count in its heading.

| # | Outcome | Check |
| --- | --- | --- |
| R3b.0 | **Runtime and provider boundary.** Extract the existing AgentHub execution owners into the bundled, supervised subprocess above; keep one typed engine client and the existing database/provider authorities. | portable and installed startup, process cleanup, durable failure handling, remote Clyffy execution and explicit Codex subscription activation |
| R3b.1 | **Sub-agents under their parent; the index kept.** The kernel's index says each sub-agent's parent (Claude Code: `isSidechain` and `sessionId`; Codex: its `source.subagent` and the parent field a key survey confirms first). The catalog keeps each source's index between calls and re-reads only files whose size or time changed; the AgentHub runtime holds one catalog. `FoundSession` gains the parent. | the current user-started sessions listed with their sub-agents under them; an unchanged second listing reads zero transcript prefixes; the first call's time measured |
| R3b.2 | **Live state.** The subprocess's agent and room owners keep each live conversation's state — working (a prompt in flight), waiting for you (a permission or a pick unanswered), idle. The engine relays revisioned snapshots and `agenthubChanged`; a process disconnect invalidates its live observations. | a Codex thread shows working, then idle; a permission request shows waiting for you; another window reconstructs both correctly |
| R3b.3 | **The board in Turso.** Columns: Working, Waiting for you, Done. Keep observed runtime state separate from persisted board placement; an explicit move wins until the user returns the card to automatic placement. Automatic placement maps working to Working, waiting to Waiting for you, and idle to Done; Done is board placement, not a claim that a task succeeded. File modification time reports recent activity only, never proves working, waiting, or completion. Found sessions without live evidence default to Done with their live state shown as unknown. A found session belongs to the most specific project folder containing its folder, using path components; the rest are "Elsewhere on this machine". What you change is kept in `agenthub_board_cards` (user database): a card's column, its place, pinned, hidden. Engine `board(project)`, `move_card`; Tauri `agenthub_board`, `agenthub_move_card`. | a moved card survives state changes and restart; a recent file write does not invent a live state |
| R3b.4 | **`board-column` in ColdLight**, as above, with its Storybook-style fixture. | the fixture renders; the curator audit has no finding |
| R3b.5 | **The module and its page.** `domains/agenthub/`: `data-access/agenthub.service.ts` (every command and event), `agenthub.state.svelte.ts`, `ui/board-card/`, `feature/AgentHubBoard.svelte`, `index.ts` (chat integrates through it alone). The page comes from its folder (plan 0008: `_nav`, its copy). A found session opens read only, newest page first, "Show older"; sub-agents fold under their parent's card. | your real sessions on the board; screenshots at 1440 and 1024 wide |
| R3b.6 | **Continue here.** On a session you started (not a sub-agent), "Continue in DevPulse" — your click — starts an agent thread in its project with the session's own id as the resume token, so the vendor continues it in its folder. | a Codex session from the terminal continued in DevPulse |

**Q54 owner correction (2026-10-29):** AgentHub belongs under **Overmind**,
at `/overmind/agenthub`. The earlier DevPulse placement was an unapproved
implementation assumption and is superseded. Chat keeps its tailored native
interface; its contextual links open the owning main-window page instead of
replacing chat with the application shell. Preserve the active conversation.
Correct the route folder and copy together, expose the entry from Overmind,
and verify navigation in both native windows. Reuse the existing domain,
typed ColdLight components and generated feature CSS. No redirect or duplicate
page at the mistaken path. Fix the observed compact-chat clipping in the
existing owners, with layout and cross-window failure regression tests.
This correction does not mark the persisted board or provider acceptance done.

Correction evidence (2026-10-29): the route folder and copy now live at
`/overmind/agenthub`, with an Overmind dashboard entry and the normal generated
submenu. Chat opens that page in the main window using an acknowledged,
targeted Tauri event; it keeps its route, draft and active session. The link
carries the selected conversation ID, which the hub identifies only when a
retained live observation exists. The return action focuses the existing chat.
Window opening restores minimized/hidden windows before focusing them.
The compact chat session rail is collapsible, its rows keep their natural
height, and export/delete actions remain behind the existing confirmation
dialogs through a compact ColdLight popover. Transcript messages likewise
keep their height in the scrolling reader and use generated part styling.

Research: existing Overmind route/navigation and native window owners;
`recovered/devpulselabs/docs/proof/chat-steam-compact-native.png` and
`chat-content-spine-native.png` (distinct chat surface with contextual links);
[Tauri targeted events](https://v2.tauri.app/reference/javascript/api/namespaceevent/).
Browser verification: 35 tests across history, live state, chat selection,
failure retention, scrolling rows and cross-window acknowledgement/error/
timeout cleanup. Route/ColdLight architecture: 12 tests. Desktop type check:
zero errors/warnings. Generated CSS: 110 outputs verified, zero changed.
Native acceptance passed: Overmind dashboard and submenu open AgentHub;
202 sessions load (146 Claude Code, 56 Codex); compact chat keeps its selected
conversation through the AgentHub round trip. Closing the main window while
chat stays open and following the link recreates the main window at AgentHub
through a readiness handshake. Seven navigation regressions cover delivery,
acknowledgement, errors, timeout cleanup, startup and duplicate delivery.
The rebuilt reader opens at the newest message, with readable row heights,
generated message borders, and one entry per actual Codex message. Local
evidence: `.userdata/proof/overmind-agenthub-native.jpg` and
`.userdata/proof/chat-overmind-native.jpg`. Rust history: 47 tests passed;
launcher compiler-survival regression passed. R3b remains incomplete as
specified in the table above; this verifies the ownership/UI correction.

Native finding: the normalized history model marked `ToolStarted`,
`ToolCompleted` and `UsageUpdated` as conversation content. Correct their
existing presentation owner to Activity so the reader's tools/diagnostics
toggle does what it says; preserve messages, warnings and failures as visible
conversation content. Add a model regression, rebuild the bundled runtime,
and recheck the real transcript. No UI-only filter or data deletion.

Native finding: Codex rollout messages appeared twice because the reader
treated both `response_item.message` and its completion notification as
conversation entries. Codex's [rollout persistence policy](https://github.com/openai/codex/blob/main/codex-rs/rollout/src/policy.rs)
persists raw message items in both history modes. Use those as the rollout
transcript authority; completion notifications remain known non-displayable
records. Standalone `item.completed` output retains its own decoder. Verify
old and current notification shapes, repeated identical real messages, and
one-event pages across mirror boundaries. Do not deduplicate by message text.

#### R3b implementation contract (Codex review, 2026-10-25)

Owner direction for this review:

> "help claude please and ensure this pre-release code is getting fixed
> directly not deprecated no compatibility we do it right and thorough"

- **Reauthor the owning implementation in place.** Change the existing
  history sources, `AgentHub`, commands and their callers together. No
  deprecated entry points, compatibility wrappers, parallel V2 paths or
  fallback to the old implementation. Preserve recovered originals and
  capabilities under the include-before-delete rule; this is not blanket
  permission to delete unrelated code or user data.
- **One catalog for listing and paging.** The retained catalog and prefix
  cache are now implemented in the existing engine/kernel owners. Move
  that single catalog into the supervised AgentHub runtime; the engine
  client must not construct a second catalog. Each source owns its bounded
  metadata cache. Keep
  filesystem work on the existing blocking executor. Concurrent requests
  must share a refresh instead of starting duplicate scans; do not hold
  an unrelated platform lock during disk reads.
- **Refresh correctness belongs in R3b.1.** Inspect the bounded directory
  inventory for additions, removals and renames. Reuse unchanged metadata;
  invalidate on size or full available modification-time changes, source
  root, definition or limits changes. Do not use the rounded display
  timestamp as the cache fingerprint. Handle missing roots appearing,
  roots disappearing, unreadable files and partial writes without
  permanently caching failure. If a file changes during a read, retry
  within a bound or mark it for refresh; do not label mixed data fresh.
  Document filesystem timestamp limitations. Keep source errors and
  truncation visible, deterministic ordering, and the existing read jail
  and paging limits. Cached paths must still be checked before opening.
- **Parentage and identity are different.** Carry an explicit sub-agent
  classification as well as an optional parent reference. Missing parents
  must not turn sub-agents into user-started sessions or hide them. Confirm
  provider parent fields from a redacted key survey and add fixtures;
  preserve Codex's first-own-metadata rule. Resolve parents within the
  provider, handle ambiguous ids, missing parents and cycles, and retain
  artifact identity when native ids repeat. Do not infer parentage from
  titles or assume every fork is a sub-agent.
- **Prove the I/O improvement.** Instrument prefix reads and bytes. An
  unchanged second listing must read zero transcript prefixes; one changed
  file must refresh only that file. Test additions, deletion, truncation,
  same-size edits with changed timestamps, partial writes, root changes,
  filtering and simultaneous listings. These are behavioral tests, not
  assertions that a cache field exists. Re-run the existing history tests.
  Measure cold startup, warm listing and paging through real IPC with
  counts and timings; 60 parents / 113 children are a dated observation,
  not a hardcoded acceptance count. An in-memory cache alone does not fix
  the first call. Profile that call and address the measured bottleneck;
  do not claim startup is fixed from a warm-cache benchmark.
- **State, persistence and continuation need end-to-end checks.** Test
  permission resolution, cancellation, failure and disconnect so cards
  cannot remain working forever. Persist moves and ordering atomically;
  runtime events must not overwrite explicit placement. Test nested and
  similarly named project folders. Continue only on an explicit click for
  a positively identified user-started session, using its own provider,
  native id and workspace; reject duplicate in-flight clicks and surface
  provider resume failures. Unknown parentage does not grant eligibility.
- **Finish each slice with evidence.** Update Rust and generated frontend
  contracts together, run affected compile/type checks, tests, clippy and
  rustfmt, then the required hooks when committing. Verify the running app
  via `cargo xtask run-dev`, including keyboard card movement, reload and
  restart persistence, newest-first page loading and screenshots for the
  UI slices. Keep unrelated generated timestamp churn out of the change.
  Report what was actually verified and any remaining failure; a plan
  update or passing unit tests alone does not complete R3b.

R3b.1 cache implementation slice (Codex, 2026-10-25): authored directly in
the existing kernel history module and engine facade, with I/O counters and
regression tests (verification below). Parent grouping and live IPC startup
measurements remain separate, unfinished R3b.1 work. No IPC payload changes
were needed for this cache slice.

#### Existing-code readiness review (2026-10-26)

Scope: the active history readers, engine agent/room execution and
persistence, Tauri intents, chat state and route/component inventory.
These are code-path findings, not claims from a new live-app run. The
recovered originals remain references; the fixes belong in their active
owners. Do not build another execution stack inside the board.

| Priority | Finding and concrete trigger | Direct fix and acceptance evidence |
| --- | --- | --- |
| P1 fixed | **A stale card could open another source's transcript.** `history/mod.rs::locator_for` hashed provider plus relative filename only. Changing a history root to another directory containing the same filename reused the locator. The strengthened engine regression reproduced the collision before the fix. | The existing locator now includes canonical source identity. Regression coverage checks identical filenames in two roots, rejection of the old locator after switching roots, distinct session/event ids, and stable identity when reopening the same source. A future persisted board needs an explicit durable card identity; do not treat a path locator as a portable logical-session id. No legacy locator fallback. |
| P1 fixed | **ACP continuation silently started fresh.** The ACP branch discarded the saved resume token. | The active transport now restores the saved id with advertised `session/resume`, or `session/load` when resume is not supported. Unsupported and refused restores fail explicitly without creating a new session. Ordered load replay is drained before readiness. Five SDK protocol-peer regressions verify identity/workspace, subsequent prompting, failed/unsupported restoration and replay exclusion. Vendor-to-DevPulse continuation still needs live verification before R3b.6 is complete. |
| P1 fixed | **Successful completion did not mean saved completion.** Agent and room owners could report completion after failed writes; agent dispatch preceded saving the prompt. | Prompt persistence now precedes dispatch. A per-thread gate covers agent execution through persistence. Answer, counter and continuation commit together. `RoomHost::record` returns failures, stops later work, and retains all already-produced parallel answers with every recovery result reported. Unsaved agent completion and room outcome emit failure, never a saved completion. Unique local recovery documents preserve the output and continuation; chat keeps a selectable stream copy until dismissed. Real-Turso failure tests verify rollback and terminal events; browser tests cover retained output. Recovery is not automatic replay or crash-atomic journaling; live snapshots and recovery management remain separate work. |
| P1 fixed | **Turn order and thread creation were not atomic.** Separate reads/writes could reuse sequence numbers or leave incomplete threads. | The existing Turso adapter now commits parameterized single-row mutations on one connection under an immediate writer lock, checking affected rows and rolling back failures. Agent and room creation use it; turn order is allocated inside the insert, with the session counter in the same transaction. Regressions verify 16 concurrent turns, first/second-statement failures, missing sessions and wrong-project writes. No database reset or compatibility path. |
| P1 implementation delivered; native acceptance open | **Live truth formerly existed only as transient events and one window's turn.** Agents and rooms now share `agenthub::live::LiveState`: retained per-conversation observations, runtime epoch/revision, all pending permissions/tools, stream text and terminal failures. Chat consumes typed snapshots and coalesced `AgentHubChanged` invalidations through `domains/agenthub`, rather than a single local turn. | Kernel tests cover permission answer/expiry/cancellation removal. Runtime tests cover concurrent threads, room seats and aggregate room waiting, late events, task drop, parallel tools and persistence-gated idle. Browser tests reconstruct two independent windows, coalesce updates, reject stale revisions/epochs, recover after failed reads and preserve dismissed failure copies. Native two-window/vendor execution and actual subprocess crash/restart invalidation remain required before R3b.2 is complete. |
| P1 fixed | **An unavailable project silently changed where tools ran.** `Agents::folder` substituted `data_dir/tools/ask` for a missing project or project-state read error; `conversation` created its working directory. Tool-enabled room seats used the same path. | `Projects::workspace` now requires a live project and an existing absolute directory, propagating database errors. Agent and room startup propagate that refusal; only an explicitly talk-only place may create its isolated folder. Five regressions cover missing/removed/restored projects, missing/non-directory/relative paths, database failure, and startup that never recreates a missing tool workspace. |
| P2 fixed | **Late loads could replace the selected conversation.** Chat loads and thread refreshes applied responses after selection changed. | The existing Svelte stores guard success and failure by request generation and project/session identity. Session selection invalidates pending loads immediately; stale completions cannot clear a newer loading flag. Browser tests cover both response orders, same-selection refreshes, project changes and stale IPC/transport errors. The browser harness now uses the SvelteKit plugin to resolve the app's existing `$app/*` imports. |
| Required delivery | **The board is not yet an available product surface.** Only generated bindings reference `agenthubSessions`/`agenthubSessionPage` in the frontend. `domains/agenthub` now supplies live snapshots to chat, but there is no board route, `agenthub_board_cards` schema or ColdLight `board-column`; room commands likewise have no frontend consumers. Parent classification, native parent references and safe artifact links are now present in the index/DTO; the UI still needs to consume them. | Finish R3b.2 and durable completion handling, then the Turso board and its own page using ColdLight card/status/badge plus the new column. Connect read-only paging, keyboard moves, manual placement persistence and chat links. Only enable Continue after the continuity and workspace checks above pass. Verify the real user journey, not just generated commands. |

Implementation order after the cache and source identity fixes:
parent/classification metadata; execution-state and persistence correctness;
persisted board and its UI; explicit continuation with restored provider
context; then R3c hand-offs. Continuation correctness can be fixed in its
provider owner earlier, but the button must not precede it. Keep cold-start
profiling separate from warm-cache evidence. The existing plan 0001 B4.3
ColdLight composition requirements still apply; plan 0009's card inventory
is the specific board decision (no extra library card kind).

## Log

- 2026-10-27 — **History moved into the supervised executable (R3b.0 slice).**
  `systems/devpulse-agenthub` now owns the retained catalog and all three
  existing catalog/parent-linking tests. The engine facade delegates over
  private bounded stdin/stdout frames; only stderr is forwarded to logs.
  The supervisor retains its process/job ownership. Protocol, package version
  and a fingerprint of runtime/provider sources and bundled definitions must
  match before requests. Disconnects, timeouts and interrupted exchanges fail
  closed without replay; shutdown closes stdin, drains output, then uses the
  existing stop policy if the peer does not exit. The new xtask builder stages
  the target-suffixed binary and is wired into dev and release; the portable
  planner consumes the same Tauri overlay and refuses a missing runtime.
  Verification: 7 runtime unit tests, 5 actual-executable tests (including a
  copied binary outside the checkout), 12 supervisor tests, 182 engine tests,
  4 signal-contract tests and 107 xtask tests pass; five existing helper/
  environment-dependent tests remain ignored. All-target Clippy exposed
  existing xtask test-assertion lint failures, now scoped to test modules
  using the repository's convention. An incorrect manifest-test expectation
  for `qwen3.5-9b` now expects 9B, with decimal and MoE cases retained.
  The real debug executable found 191 sessions (Claude Code 144, Codex 47):
  handshake 382 ms, first listing 3,754 ms, repeated listing 49 ms. The second
  listing read **zero prefixes and zero prefix bytes** for both providers.
  The first still read 22,880,087 bytes: cold-load performance is not fixed.
  Probe logs: `.userdata/logs/agenthub-real-history-{summary.json,child.log}`.
  No runtime remained after shutdown, and recovered originals are unchanged.
  **Still open:** agent/room/live-state extraction and bidirectional host
  callbacks; remote Clyffy and Codex subscription workflows; board storage,
  ColdLight column and page; native UI and full installer/clean-machine
  acceptance. No board UI exists yet; this does not complete R3b.

- 2026-10-27 — **Retained live observations implemented.** Agent and room
  producers update one state owner; provider completion clears permissions but
  remains working through the persistence attempt. Room status aggregates its
  waiting seats. Dropped unfinished observations expose failure. ACP publishes
  permission resolution on answer, expiry or cancellation. Typed Tauri snapshot
  reads and epoch/revision notifications are wired at boot, independently of
  the prompting window. Chat hydrates on opening, selects its own session's
  stream/permission/tools, targets stop/answer explicitly, and reloads history
  on persisted completion. A disconnected stream clears stale permissions
  while retaining its partial output through persistence. Provider startup
  is also observed as working, with startup failures reported in the snapshot.
  Full kernel/engine suites: 202 + 185 passing, six
  existing ignores. Sixteen Chromium tests pass, including two store instances
  representing separate windows; these are not a native vendor smoke test.
  Desktop typecheck and the production build pass; bindings are regenerated.
  Native cancellation during provider startup still needs the lifecycle work
  in R3b.0; a retained snapshot alone cannot make that startup cancellable.
  The runtime still lives
  in the engine until R3b.0 relocates these owners into the bundled subprocess.

- 2026-10-27 — **Resume: authoritative live observations (R3b.2).**
  Replace window-local execution truth with one retained runtime state owner
  shared by agents, room runs and room seats. Snapshots carry a runtime epoch
  and monotonic revision; notifications invalidate snapshots, so slow windows
  can reconstruct current state without replaying every token. Keep streamed
  text, tools, all pending permissions and terminal failures available to a
  newly opened window. A terminal provider event does not make a turn idle
  until persistence completes. Permission expiry, answer and cancellation
  remove pending requests explicitly. Wire typed Tauri commands/events and
  chat hydration; test concurrent conversations, stale loads, late permission
  events, terminal failures and cancellation. Implement in verified phases:
  permission protocol; runtime owner and producers; IPC; frontend consumers.
  This prepares the existing execution owners for subprocess extraction, not
  a second runtime or a claim that R3b.0 packaging is complete. Process-crash
  invalidation remains part of that actual transport boundary.

- 2026-10-27 — **Durable completion repair implemented and tested.** The
  execution slice below is implemented in the existing owners, without a
  compatibility path or database reset. Kernel/engine library suites pass
  (201 + 178 tests, six existing ignores). Three focused room regressions
  pass after strengthening parallel failure reporting to include every
  recovery result. Eleven Chromium chat tests pass. IPC bindings were
  regenerated; desktop and Storybook type checks report zero errors/warnings.
  The real `FailedTurn` adapter is reviewable at Storybook
  `AgentHub / Failure recovery / Retained answer`, with explicit fixture
  copy and functional dismiss/reset. Recovery documents live under the
  configured data directory's `agenthub/recovery`; they are never replayed.
  If both database and recovery-file writes fail, the error says so and the
  current chat window retains its streamed copy. This is not protection
  against a process crash before a recovery file is written, nor the
  authoritative multi-window state required by R3b.2. Room commands still
  have no product UI consumer. The native development app was stopped for
  verification; native failure injection against user data was not performed.

- 2026-10-27 — **Next execution slice: truthful durable completion.**
  Reauthor the existing agent and room owners before exposing their completion
  as board state. Save a user's prompt before dispatch; serialize a thread's
  in-flight turn through completion persistence. Commit the assistant turn,
  session counter and continuation token together. Make `RoomHost::record`
  fallible and stop subsequent phases after a storage failure, while still
  attempting to retain every answer already produced by a parallel phase.
  Never publish `Turn`/`Finished` or successful `TurnEnded` for an unsaved
  result. Preserve failed writes in a local recovery document and report its
  location; retain streamed failed answers in chat. Recovery documents are
  not another canonical database and never trigger automatic tool replay.
  Test real-Turso rollback at every statement, prompt dispatch ordering,
  room failure propagation, parallel answer retention and frontend failure
  presentation. Regenerate the IPC contract and run affected suites and hooks.
  This does not complete subprocess extraction, provider activation, live
  snapshots, board persistence or the approved ColdLight Provider migration.

- 2026-10-27 — **AgentHub table ownership implemented.** User migration 0003
  renames the existing tables in place to `agenthub_threads` and
  `agenthub_room_threads`. The original definitions are included in that
  migration for fresh installs; the base schema no longer recreates the old
  names on later boots. All active agent/room SQL uses the prefixed tables.
  Shared sessions and turns retain their canonical records. Three real-Turso
  regressions verify fresh install/reopen, preserved rows/tokens/seating/
  foreign-key references, and rollback of the first rename if the second
  fails. Full engine library suite: 172 passed, two existing ignored;
  all-targets clippy with `-D warnings` and rustfmt pass. This does not claim
  that the subprocess, remote Clyffy execution or board UI is delivered.

- 2026-10-27 — **Recovery audit and active delivery.** Recheck every recorded
  recovered blob against its source in Git, and inventory deleted source
  outside the manifest. Repair the recovery script first: its current HEAD
  blob deduplication includes `recovered/` itself, so rerunning it can erase
  provenance rows. Preserve the existing inventory, refuse to overwrite a
  changed recovered file, and add read-only verification with rerun tests.
  Report archived presence separately from active integration. Then move
  AgentHub-owned thread tables to the `agenthub_` namespace through tested
  data-preserving migrations and update their active callers together.
  - Evidence: all original 4,923 archive entries match Git. The broader
    source/supporting-file audit recovered 1,110 additional files; all 6,033
    now match their recorded blobs, with zero uncovered deletions in scope.
    Six real-Git recovery regressions pass. `recovered/STATUS.md` records
    counts, active integration gaps and the explicit limits of this audit.
  - Follow-up of every remaining file format recovered 13 more supporting
    sources, including GBNF grammars, the adapter manifest, editor files,
    CSS backup and intact design/font archives. Final inventory: 6,046
    verified files, 1,123 added this turn, zero uncovered deletions in the
    declared scope; 404 deleted paths survive verbatim in active HEAD.

- 2026-10-27 — **Verification checkpoint.** Full kernel/engine library suites
  pass: 199 kernel and 169 engine tests, with six existing ignored tests.
  This includes parent-cache/graph, ACP restore, and atomic-write regressions.
  IPC bindings regenerated through `cargo xtask regen-bindings`. Browser
  selection regressions pass (eight), and the desktop type check reports
  zero errors/warnings against the generated contract. Rustfmt and Biome
  pass; final lint/hook results are recorded at delivery. Specta's existing
  trailing spaces are retained in its generated file, not hand-edited.
  No running-app, startup-latency or completed-board claim is made.

- 2026-10-27 — **Atomic conversation writes.** Add a single-connection,
  immediate transaction for parameterized single-row writes in the existing
  Turso adapter. Each statement must affect exactly one row; failures roll
  back the whole logical write. Use it for agent/room session creation and
  turn insertion plus session counters. Allocate the turn order inside the
  insert while holding the transaction's writer lock. Test concurrent turns,
  a missing/wrong-project session and failure of each constituent statement.
  Follow-up call-site review found the two ordinary-chat Tauri writers also
  allocate sequences before inserting. Route them through the same engine
  `save_turn` operation, carrying token counts and returning the created id
  for their existing read-back. This removes the remaining cross-writer race
  rather than maintaining a second SQL implementation.

- 2026-10-27 — **Selected chat response ownership.** Guard the existing
  chat load and agent-thread refresh with monotonically increasing request
  generations and the selected project/session identity. A late success or
  error cannot replace the newer selection or clear its loading flag.
  Invalidate pending message loads immediately when selecting a session.
  Browser regressions use deferred IPC responses in both completion orders.

- 2026-10-27 — **ACP continuity repair in the active transport.**
  Carry the saved id through `AgentSession::start` to ACP startup. After
  initialization, prefer advertised `session/resume`, otherwise advertised
  `session/load`; unsupported or failed restoration is an error, never a
  new session. Drain the SDK's ordered pre-response load replay before
  making a session ready so old content cannot become a new answer.
  Exercise the actual SDK connection with an in-memory protocol peer:
  request ids/workspace, subsequent prompt, unsupported capability, refused
  restoration, and replay exclusion. No compatibility transport is added.

- 2026-10-27 — **Resume R3b: parent identity before board wiring.**
  Add explicit user-started/sub-agent/unknown classification and a separate
  optional native parent id to the existing readers and retained index.
  A bounded local key-only survey confirmed Claude's `isSidechain` plus
  `sessionId` in `subagents/` files, and Codex's first own `session_meta`
  with `source.subagent.thread_spawn.parent_thread_id` and a matching
  top-level `parent_thread_id`. A fork id alone is not sub-agent evidence.
  Resolve links within a provider only when the parent artifact is unique;
  retain orphaned, ambiguous and cyclic children visibly without granting
  continuation eligibility. Test the decoder rules, cached metadata and
  graph resolution, then regenerate IPC types and check the desktop.
  The history module is being read in focused chunks, not as a complete
  single-file read. Continue into the existing execution/persistence owners
  before enabling live board behavior or a continuation action.

- 2026-10-26 — **Push gate: newly reported compression advisories.**
  The push of `4efdc5c1` passed workspace clippy but was blocked by
  RUSTSEC-2026-0391, 0398, 0403 and 0410 in Turso's Tantivy compression
  dependencies. Turso 0.8.3 and the available 0.9 prerelease both require
  Tantivy 0.26.2; the released Tantivy 0.27 changes that package boundary.
  Patch the published `tantivy-sstable` 0.7.0 source under
  `deps/tantivy-sstable`, changing only its zstd dependency floor to 0.14.3.
  Source/test/benchmark files remain byte-identical to the registry crate;
  provenance and the upstream license are included. The upstream git snapshot
  also changes a dictionary API and cannot be used wholesale with Tantivy
  0.26.2. This minimal dependency change retains full-text search without
  introducing API adapters. Resolve zstd 0.14.3, zstd-safe 8.2.0 and zstd-sys
  2.1.2, then rerun the advisory gate, persistence tests, workspace checks and
  push hooks. No advisory ignore or application compatibility layer.
  - Verified final graph: `cargo deny check advisories`; kernel/engine
    all-targets clippy with `-D warnings`; full library suites (190 kernel,
    164 engine passed; six existing ignored tests). A new Turso regression
    builds a full-text index with 4,096 distinct terms, searches it, reopens
    the database and verifies index updates. All four Turso adapter tests
    pass. Twenty upstream source/test/benchmark files were compared byte for
    byte with the published crate. Rustfmt and diff checks pass.

- 2026-10-26 — **Resume: repair the existing verification failures.**
  Reproduce the recorded kernel/engine all-targets clippy failures, repair
  the existing tests in small groups without weakening production lint
  policy, and run the affected tests plus the full kernel/engine library
  suites. Fix any actual failing behavior those suites expose in its owner.
  Then revisit the readiness findings above; record separately what has
  been fixed and what remains unfinished. No compatibility implementations.
  The next behavior fix is workspace resolution: use the project owner to
  require a live project and an existing absolute folder; propagate that
  refusal through agent and room startup. Only an explicitly talk-only room
  place may create its isolated folder. Test missing/removed projects,
  unreadable project data, missing/non-directory/relative paths, and that
  tool-enabled startup never recreates a deleted workspace.
  - Completed the recorded test/lint repairs in their existing owners.
    Tests propagate setup failures, assert optional values directly, retain
    exact-zero sentinel assertions, and use checked-width fixture values.
    Named helpers shorten the Surreal and signal fixtures without changing
    their coverage. Intentional assertion panics have narrowly scoped test
    lint expectations; production lint policy is unchanged.
  - Workspace resolution is fixed as described in the readiness table.
    No substitute folder, deprecated API, or compatibility path was added.
  - Verified: full library suites (189 kernel and 159 engine passed, with
    six existing ignored tests); after the workspace fix, all 131 platform
    tests passed, including five new regressions; all four signal contract
    tests passed with unchanged JSON/TypeScript snapshots. Final kernel and
    engine all-targets clippy with `-D warnings`, rustfmt and diff checks pass.
  - ACP continuity, durable completion/atomic writes, authoritative live
    status, stale frontend responses and the remaining R3b UI are still open.
    No live startup measurement or completed-board claim is made.

- 2026-10-26 — **Cache pushed; existing-code review and source identity fix.**
  - Cache commit `6a111b20` pushed to `restore/pre-gb10`; normal commit
    and push hooks passed, including workspace check/clippy and cargo-deny.
  - Reviewed active history, agent/room execution, persistence and frontend
    consumers. The readiness table above records remaining direct fixes and
    concrete acceptance checks; R3b is not complete.
  - Reproduced the cross-root locator collision in the engine integration
    test using the same filename in both roots. Added canonical source
    identity to the existing locator, with no compatibility lookup path.
  - Verified after the fix: 37 history tests and the engine AgentHub
    integration test pass; rustfmt and scoped diff checks pass.
  - The dev app remains stopped; cold-start latency and the full AgentHub
    user journey still require live verification.

- 2026-10-25 — **R3b.1 cache slice implemented; R3b.1 remains open.**
  - `JsonlHistorySource` keeps bounded per-file metadata using size and full
    modification/creation timestamps. Each listing checks the directory
    inventory, evicts departed files and re-reads only changed prefixes.
    Concurrent listings share the source cache. A file changing during
    indexing gets at most two attempts; an unstable result is not cached.
  - `AgentHub` owns one catalog shared by listing and paging. Configuration
    refresh retains unchanged sources and invalidates moved, missing or
    reconfigured roots. Source snapshots let transcript reads run outside
    the catalog configuration lock. No deprecated API or compatibility path.
  - Logs expose actual prefix reads/bytes and separate total latency,
    blocking-executor queue wait, configuration refresh and listing time.
    Fixed the existing false truncation flag at exactly the file ceiling.
  - Verified: `cargo check -p devpulse-engine`; 36 history tests via
    `cargo xtask test -p devpulse-clyffy -- --lib providers::history`;
    one engine integration test via `cargo xtask test -p devpulse-engine
    -- --lib platform::agenthub::tests`; production-library clippy via
    `cargo xtask clippy -p devpulse-clyffy -p devpulse-engine -- --lib
    -- -D warnings`; rustfmt and scoped `git diff --check`.
  - Tests prove zero transcript prefix reads on an unchanged listing,
    one changed file read once, shared reads across concurrent callers,
    full timestamp invalidation for same-size edits, partial-write recovery,
    bounded retries, paging reuse, removal/rename and source reconfiguration.
  - The broader `--all-targets` clippy check fails in existing tests outside
    this change (kernel cortex and engine service/vision tests). It is not
    a clean all-targets result. Those files were not changed in this slice.
  - Not verified: real app IPC latency or cold startup improvement. The app
    was not launched, and no commit/push hooks were run for this uncommitted
    slice. The unrelated `terminology.ts` timestamp edit was left alone.
- 2026-10-24 — Plan written after the measurement above and your two answers.
- 2026-10-24 — **R1 done: the repo's history is back.** 4,923 files in
  `recovered/repo/` (2,205 whose names exist nowhere at HEAD, 2,718 moved or
  rewritten), every one byte-identical to the commit before its deletion
  (checked by blob id, and the staged blobs are the very objects history
  holds). One pair differed only in case (`HStack.svelte` / `Hstack.svelte`);
  the second is `HStack@c172b6b4.svelte`. `recovered/` is excluded from the
  Cargo workspace, Biome, the Rust/Svelte/IP/clippy hooks, and line-ending
  conversion (`-text`).
- 2026-10-24 — **R2 done: devpulselabs' chat crates copied in once.** 103
  files from `c78ec8b` (all committed there): `crates/chat/` (16 crates), its
  workspace `Cargo.toml`/`Cargo.lock`, chat design/plans/research and the
  native-chat screenshots; each compared byte for byte with its source.
- 2026-10-25 — **R3a done: your sessions, found wherever DevPulse runs.**
  - Kernel `providers/history/`, authored from `recovered/devpulselabs`:
    `store` (the bounded, read-only, jailed history reader with cursor paging
    and usage recovery) → `history/mod.rs`; the part of `core` it uses →
    `history/events.rs`; the Claude and Codex readers and usage dialects →
    `history/claude.rs`, `history/codex.rs`, their shared helpers (each crate
    had a copy) → `history/record.rs`. On DevPulse's `ProviderId`; readers
    and sources are `Send + Sync` so the engine can share the catalog.
  - Taught the formats written today (surveyed on this machine, key names
    only): Claude Code 2.1.310's tool results inside `user` records,
    thinking-only records, its own session title (`ai-title`), PR links and
    bookkeeping records; Codex's `event_msg.item_completed` (PascalCase item
    types), `token_usage_record`, `thread_settings_applied`, agent-to-agent
    messages and developer instructions. Titles skip context a tool put in
    front of your first request.
  - Found in the live check and fixed (surveyed 2026-10-25, key names and
    offsets only):
    - Codex writes up to 201 KB of instructions, tools and environment
      before your first request, past the 64 KiB a reader looks at to name a
      session; every Codex session fell back to "Codex · folder · date". A
      definition now says how far to look (`[history] prefix_bytes`, Codex
      512 KiB, validated against the 1 KiB–1 MiB the store allows), and the
      reader stops at the title.
    - A session Codex forks for a sub-agent carries its parent's
      `session_meta` second; it overwrote the session's id, folder and
      start (5 of 42). The first one is the session's own.
    - Codex sub-agents (`source.subagent`) are named by the task their
      parent sent (`agent_message`, when not encrypted), else
      "Codex sub-agent {nickname}"; a fork's copy of its parent's history
      does not name it. Codex Desktop's "## My request for Codex:" heading
      after attached context (in-app browser, files) is honoured.
    - Claude Code's `queue-operation` (what you type while it works:
      enqueue, dequeue, remove) is bookkeeping; a delivered one is in the
      history again as your message.
    - Not yet: a sub-agent session's link to its parent
      (`parent_thread_id`) — the board groups sub-agents under their
      parent in R3b.
  - Each definition says where its history is (`[history]`: format, root,
    and the variable that moves the vendor's home — `CLAUDE_CONFIG_DIR`,
    `CODEX_HOME`); a reader may only read its own provider's files.
  - Engine `platform/agenthub.rs` (no database needed) and Tauri
    `agenthub_sessions`, `agenthub_session_page` (`CommandError`).
  - Verified: 28 history tests (your store's 6, the readers' 13 plus the
    current-format, titling, fork, sub-agent, prefix and catalog tests);
    clippy (all targets), rustfmt clean.
  - Live, through the app's IPC: 173 transcripts (Claude Code 131 from
    `~/.claude/projects`, Codex 42 from `~/.codex/sessions`), newest first —
    *corrected the same day:* 60 sessions you started and 113 of their
    sub-agents, listed flat until R3b.1;
    40 of 42 Codex sessions named by your request or a sub-agent's task (the
    other two are empty sessions, rightly "Codex · folder · date"); pages in
    both directions in under 50 ms; no unknown record on the newest pages.
  - Measured, for R3b: each listing re-reads every file's start (about
    29 MB here) — about 200 ms warm, 3.8–4.8 s for the first call while the
    app boots. The board keeps the index between calls and re-reads only
    files whose size or time changed.
