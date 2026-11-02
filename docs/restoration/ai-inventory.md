# Historical AI source inventory

Inventory date: 2026-11-02. Execution owner: [plan 0009](../../.plan/0009-repo--wire-recovered-code.md).

**Restoration follow-up:** the twelve missing snapshot documents are now back
at their original paths. The two colliding documents retain both complete
bodies, with current-direction notes separating historical material from
current requirements. [The restoration ledger](snapshot-documents.json)
records all fourteen source hashes, destination hashes and retained ranges.
The TSV and counts below remain the **initial discovery baseline from
`1d623407`**, before this restoration; use the ledger for snapshot completion.

The historical AI work is spread across the old orchestrator, engine, kernel,
desktop, devpulselabs import and a local recovery snapshot. It is not all
functionally restored. This inventory identifies review candidates and their
provenance before the next connected restoration batch; it changes no product
source or restoration-manifest claim.

## What was found

The scan accounts for **6,957 source records** and flags **1,209 candidates**
representing **1,153 distinct contents**. A record means a historical path and
revision, not a separate feature. Candidates include 333 logic files, 316
presentation files, 65 configuration files, 35 desktop bridges, 4 schema/data
files, 428 reference documents/assets and 28 development-tooling files.
These are discovery classifications requiring review, not verified missing code.

| Source | Records scanned | Candidates |
| --- | ---: | ---: |
| Git recovery manifest | 6,066 | 728 |
| Additional latest-deleted sources surviving elsewhere | 392 | 76 |
| Tracked historical documentation trees | 351 | 271 |
| Preserved devpulselabs import | 103 | 95 |
| October 6 snapshot ZIP, excluding IDE caches | 40 | 38 |
| October 6 saved patch fragments | 5 | 1 |

Of the 728 manifest candidates, **588 remain staged** and 140 already have
recorded destinations. The 588 comprise 370 under `alpha`, 150 under
`interfaces`, 33 under `kernel`, 26 under `systems`, and 9 elsewhere. Other
engine sources without a strong AI signal still need infrastructure review;
the classification is not permission to discard them.

The full manifest remains at **812 recorded destinations and 5,254 staged
records**. This inventory does not increase that restoration count.

Use [the complete TSV](ai-inventory.tsv) to filter by source, capability,
layer, preservation status and candidate owner. It contains negative results
too, so unflagged files remain accounted for. [The summary JSON](ai-inventory-summary.json)
contains reproducible counts. Each source has an immutable Git reference or
snapshot hash, a SHA-256 content hash, its preserved location and evidence line
numbers. Shared symbols and renamed paths identify comparison targets only.
Even identical bytes in a working source tree do not prove a reachable runtime.

## Capability map and restoration sequence

Counts below overlap: one file can contribute to multiple capabilities.
Current owners identify where to inspect and integrate, not completed features.

| Batch | Historical material | Current owners to compare | Remaining work and completion evidence |
| --- | --- | --- | --- |
| 1. Endpoint and subscription activation (299 candidates) | `alpha/orchestrator/src/adapters/web/`; old engine provider/MCP modules; devpulselabs provider activation, especially Codex | `kernel/devpulse-clyffy/src/providers/{adapters,discovery,connect,session}`; engine `platform/providers`; desktop `domains/app/providers` | Compare installation, authentication, handshake, model discovery and session execution as one flow. Local and remote endpoints use configured connections. Show a verified service becoming available in the Tauri UI, plus useful failure states. Retain engine process supervision and platform-tool ownership. |
| 2. Memory, context and knowledge (472 candidates) | `alpha/orchestrator/src/cortex/{cag,costar,rumination}` and `infra/persistence`; remaining `connectome` adapters; snapshot block and persistence specs | `kernel/devpulse-clyffy/src/cortex/{cag,knowledge,persistence,intelligence,reasoning,traits}` | Compare algorithms and schemas, preserve authored decisions, implement missing consumers directly. Verify durable memory across restart, global/project isolation, context selection and locked/pinned data. Migrate old storage API use into the current adapters without restoring obsolete storage stacks. |
| 3. Chat, Council and roles (567 chat / 461 role candidates) | Old desktop chat/persona UI; orchestrator chat and guardian; old Maestro; devpulselabs `crates/chat/{core,accounts,profiles,context,runtime,store,providers}` | Kernel provider sessions/history and Cortex personas; engine agent lifecycle; desktop `domains/chat/ui/council-config` | Preserve configurable roles, assignment, streaming, approvals, session ownership and history semantics. Review old Codex app-server capabilities against the current transport instead of assuming an ACP implementation covers them. Council belongs in Chat with cross-links to ticket work. |
| 4. AI ticket factory (48 candidates) | AgentHub/Overmind references and recovered work records; related persistence schemas | `systems/devpulse-agenthub`; engine `platform/agenthub` and migrations; desktop `domains/agenthub` | Audit real ticket identity, prefixed tables, assignments, shared state, handoff, human decisions, board persistence, bundled subprocess and Overmind navigation. Thread/session tables alone do not establish the ticket model. R3b stays incomplete. |
| 5. Model, voice and vision services (390 model / 406 voice candidates) | Old built-ins, Candle/Moshi, llama.cpp, Sherpa; orchestrator audio/vision/embedding; old engine boot/service modules | `kernel/model-loader`, including `runtimes/{llama_server,voice_stt,voice_tts}`; engine service lifecycle; Tauri commands and Clyffy UI | Salvage configuration, asset knowledge, capabilities and behavior. Reconcile execution with configured endpoints and supervised runtimes. Verify installation, readiness, an actual request, cancellation and shutdown; copying old embedded runtimes does not finish this work. |
| 6. Supervised feedback and training (11 candidates) | Historical specifications and training/feedback mentions across the preceding batches | Cortex domain contracts, approved dataset/training pipelines and DevPulse UI | Establish what is implemented versus planned. Trace human decisions to consented, inspectable records and exports. This scan does not demonstrate a complete training pipeline, email or push delivery. |

UI restoration accompanies each batch: typed ColdLight base components,
generated CSS and colocated domain UI. Shared presentation belongs in
`packages/coldlight`; AI decisions belong in kernel. Include kernel capabilities
in the shipped app, with understandable labels and full advanced inspection.
Do not revive old React/GPUI/Svelte-store frameworks as parallel applications.

## Concrete comparisons already inspected

- The old [OpenAI adapter](../../recovered/repo/alpha/orchestrator/src/adapters/web/openai.rs)
  accepts a configured endpoint, but its `check_availability` accepts any
  received HTTP response. The current [endpoint probe](../../kernel/devpulse-clyffy/src/providers/adapters/openai_compatible.rs)
  distinguishes authentication requirements, unsuccessful responses and a valid
  model-list body. Preserve endpoint flexibility while comparing the complete
  request path; copying the old readiness check would lose current validation.
- The old [CAG implementation](../../recovered/repo/alpha/orchestrator/src/cortex/cag.rs)
  has assembly types and an embed/search/rerank pipeline. Its header explicitly
  leaves persona skew, MMR and focus-sphere behavior as TODOs. Compare against
  current `cortex/cag` before claiming those capabilities were lost or restored.
- The imported [Codex provider](../../recovered/devpulselabs/crates/chat/providers/codex/src/lib.rs)
  exposes activation coordination, app-server transport and a capability
  manifest. That is a substantive comparison source for subscription/session
  work. A manifest declaration alone is not proof every capability works.
- Several old `connectome` modules survive byte-for-byte in working-owner
  locations, including memory traits, reasoning chains, knowledge loading and
  cache adapters. The TSV distinguishes these from documentation-only copies.
- The old [Maestro memory file](../../recovered/repo/kernel/devpulse-maestro/src/memory.rs)
  contains only `// Memory Stub`. Preserve its provenance, but do not report it
  as a recovered memory implementation.
- Current engine migration tests name `agenthub_threads` and
  `agenthub_room_threads`. That evidence establishes thread persistence work,
  not completion of the intended AI ticket factory.

These are selected comparisons, not a full semantic audit of all candidates.

## Snapshot gap identified in the initial scan

`recovery-test-20261006-195113/untracked.zip` is outside the Git-only recovery
manifest. Its 40 non-IDE entries include authored planning and old agent tooling.
The scanner reads entries without extracting or activating them; 24 IDE-cache
entries are excluded. Five saved patch fragments are inventoried separately and
must not be mistaken for complete files.

The following AI-related documents were **absent at their original locations**
in the initial scan and have now been restored:

- `docs/PLATFORM_SPEC_LAYMAN.v1.bak.md`
- `scripts/docs/consolidation/RESEARCH_FORCED_MEMORY_SYSTEM.md`
- `scripts/docs/consolidation/WANTS_FROM_CLYFFY_RUMINATE_SPEC.md`
- `scripts/docs/consolidation/tmp/correction.md`
- `scripts/docs/poam/POAM_MASTER_MCP_BRIDGE_BACKEND.md`
- `scripts/docs/poam/POAM_SHAPE_A_BRIDGE.md`
- `scripts/docs/poam/POAM_SHAPE_B_BACKEND.md`
- `scripts/docs/specs/cortex/memory/BLOCK_SCHEMA_SPEC.md`
- `scripts/docs/specs/persistence/PERSISTENCE_LAYER_SPEC.md`
- `scripts/docs/sprints/SPRINT-DEV-RELIABILITY.research.md`

`LOCKED_DECISIONS.md` and `RRO_CORTEX_RAW_DUMP.md` differed from the snapshot;
both revisions now survive in each owning document. The full RRO capture has
2,596 lines, compared with 571 in the rebuilt copy, which stopped at chunk 5.
The complete capture restores chunks 6–8 and their source details. Two additional
snapshot documents without an AI signal (`TOOL_TEST.md` and
`SPRINT-DEV-RELIABILITY.md`) are also restored. Old `.agents`,
`.codex` and `AGENTS.md` entries are development tooling, not product features
or current instructions.

The opening sections of the memory, persistence, rumination and MCP documents
were inspected. They preserve requirements for global/project memory blocks,
pinned context, provider-independent intelligence, replaceable persistence
adapters and external consumers. Their old dependency versions, research
claims and deployment proposals have not been revalidated. Preserve the
authored material and reconcile it with current owner direction before using
it as implementation authority. Some are explicitly drafts.

Source preservation is complete for these fourteen documents. Detailed
requirements-to-implementation reconciliation remains open. The archive itself
remains local; its private configuration, agent hooks and IDE caches have not
been restored or published. Scoped Git attributes preserve the restored text's
original line endings and whitespace.

The activation comparison also restored one behavior from the imported Codex
adapter into the current kernel: unrecognized status output remains unknown.
A failed status command no longer falls back to an existing login file, and
positive output from an unsuccessful or abnormal process cannot activate
Chat/Council. Both subscription and API-key login remain supported through the
configured Codex definition. This does not complete endpoint persistence,
remote Clyffy routing, the Chat capability comparison or AgentHub R3b.

## Reproduce and interpret

```powershell
python -B scripts/recovery/test_inventory_ai.py
python -B scripts/recovery/inventory_ai.py
python -B scripts/recovery/test_restore_history.py
python -I scripts/recovery/restore_history.py --check
python -B scripts/recovery/verify_snapshot_docs.py
# After staging, verify the exact bytes Git will commit:
python -B scripts/recovery/verify_snapshot_docs.py --index
```

Coverage includes the latest deleted revision per eligible path across local
Git refs, the recovery manifest, tracked historical roots, the preserved
devpulselabs import and named local recovery snapshots. It does not inspect
every intermediate historical version, other repositories or machine-wide
backups. File-extension and keyword discovery can miss relevant material;
negative results are retained for review. This is the first inventory pass,
not proof that all of the owner's work has been found or restored.
