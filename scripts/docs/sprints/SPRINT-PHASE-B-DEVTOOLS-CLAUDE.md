# SPRINT: Phase B — `/devtools/claude` Default Brain + Auto-Fallback Routing

> **Date**: 2026-04-20
> **Parent**: `SPRINT-WIZARD-FINISH.md`
> **Status**: READY (owner directive 2026-04-20: "Add to /devtools/claude Subscription tab as 'Default Brain' card... SUBSCRIPTION IS DEFAULT USED UNTIL THE FUCKING LOCAL LLM HAS BEEN SAVED/APPLIED")
> **Scope**: **S-M** — 3 files created, 1 edited.
> **Prerequisite**: None from Phase A (parallelizable). Benefits from Phase 0a/0b spans on `set_inference_provider` for debugging.
> **Owner**: EonsofStupid

---

## What This Sprint Finishes

Connects the existing `/devtools/claude` Subscription tab to live backend state AND gives it the behavior the owner needs:

1. **Default Brain card** on Subscription tab — shows `chat.brain` slot, lets owner pick from loaded local models.
2. **Auto-fallback routing** —
   - App default: `LocalClaudeSubscription` (Claude subscription).
   - When local LLM is assigned + applied + loaded to `chat.brain` → auto-switch to `LocalFirst`.
   - When `chat.brain` goes back to unloaded/unassigned → auto-fall back to `LocalClaudeSubscription`.
3. **Live routing badge** on the Subscription tab header showing the current mode.

Pure frontend wiring. Backend is already complete (`set_inference_provider`, `get_inference_provider`, `provider:changed` event, `modelsState.assign` / `.load`).

---

## What This Sprint Is NOT (SCOPE LOCK)

| Originally in plan | Status now | Reason |
|---|---|---|
| `RoutingModeRadio` component in wizard ConfigView 5th tab | **SUPERSEDED** | Would duplicate `/devtools/claude`. Owner directive relocated it. |
| Settings-page routing component reuse | **DEFERRED** | `/devtools/claude` IS the settings surface. Revisit only if owner adds a separate "Settings → Routing" route. |
| MCP / sidecar / Claude Code connection probes | **DEFERRED** (separate sprint) | No backend probe commands exist yet. Keep hardcoded-false displays until that sprint. |
| OpenAI / Gemini `cloud_chat` implementations | **DEFERRED** (separate sprint) | `ApiProviderConfig` declares them but no chat command exists. Provider cards stay display-only. |
| API Providers tab key-entry form | **DEFERRED** (separate sprint) | `store_api_key` backend is wired; form UI is its own sprint. Out of Phase B scope. |
| Lane usage live counters | **DEFERRED** | No telemetry feed wired to the page. Hardcoded zeros stay. |

These deferrals are intentional. Phase B ships the owner's core "subscription-until-local-applied" behavior. Other wire-ups follow in separate sprints.

---

## Decisions Locked

| ID | Decision | Rationale |
|---|---|---|
| Q-D (pivoted) | `/devtools/claude` Subscription tab, NOT wizard ConfigView | Owner directive. Avoids duplication. |
| Q-E (pivoted) | **Neither draft nor instant.** Routing is an **automatic consequence** of `chat.brain` state | Owner's fallback rule: local saved+applied+loaded ⇒ LocalFirst. Anything else ⇒ LocalClaudeSubscription. No user-visible "pick a routing mode" button. |
| Q-F | Settings page component reuse | DEFERRED — `/devtools/claude` IS the settings for now. |
| New: Y1 | Default Brain card scoped to `chat.brain` only, NOT a 13-slot manager | `/devtools/models` already handles full slot management. |

---

## SSOT Map

| Layer | File | Current state | Phase B action |
|---|---|---|---|
| Rune state — routing | NEW `domains/app/models/data-access/routing.state.svelte.ts` | Does not exist | Authoritative `$state<InferenceProvider>`, subscribes to `provider:changed`, loads `getInferenceProvider` on start, exposes `ensureAutoFallback(brainReady: boolean, brainAssigned: boolean)`. |
| Dumb UI — default brain card | NEW `domains/app/models/ui/DefaultBrainCard.svelte` | Does not exist | Reads `modelsState.slots['chat.brain']`, model picker from `modelsState.models` filtered by TextGeneration capability. Apply button wires `assign → load → ensureAutoFallback(true, true)`. Unload button reverts. |
| Devtools page | [routes/(devtools)/devtools/claude/+page.svelte](interfaces/desktop/src/routes/(devtools)/devtools/claude/+page.svelte) | 3 tabs, Subscription tab has MCP + Sidecar + ClaudeCode + InternalLane cards | Import routing state. Mount `<DefaultBrainCard />` between Sidecar and Internal Lane Usage. Replace hardcoded `mcpConnected` badge with a live routing-mode badge. |
| Subscription as runtime default | *bootstrap* — `init()` or boot flow | No auto-set of routing | Phase B adds: if `get_inference_provider` returns something AND no local brain is loaded on first frame after boot, call `set_inference_provider(LocalClaudeSubscription)` once. Covers fresh-install first run. |

## Duplication Scan

- `routing.state.svelte.ts` — no existing equivalent. `modelsState` handles slots, not routing mode.
- `DefaultBrainCard.svelte` — existing [BrainCard.svelte](interfaces/desktop/src/lib/domains/app/models/feature/components/BrainCard.svelte) is **wizard-specific** (size selector, first-run narrative). Different audience, different props, different parent. DefaultBrainCard is devtool-scoped: current model + picker + apply.
- `/devtools/models/+page.svelte` — handles ALL 13 slots. Phase B adds `chat.brain`-scoped card on `/devtools/claude`. Not duplication — different surface, different intent.
- `provider:changed` event — emitted by `set_inference_provider`. Existing subscribers: none (confirmed by grep). Phase B adds the first one.
- `modelsState.slots` access pattern — already used in `/devtools/models`, wizard BrainCard, `/devtools/sts`. Re-use, don't re-export.

## Files (3 new, 1 edit)

1. NEW `interfaces/desktop/src/lib/domains/app/models/data-access/routing.state.svelte.ts`:
   ```ts
   import { listen, type UnlistenFn } from "@tauri-apps/api/event";
   import { commands, type InferenceProvider } from "$lib/sys/generated/bindings.js";
   import { logError, logInfo } from "$lib/sys/logger.js";

   const LOG = "models.routing";

   class RoutingState {
     current = $state<InferenceProvider>("LocalClaudeSubscription");
     loading = $state(false);
     error = $state<string | null>(null);
     private unlisten: UnlistenFn | null = null;
     private started = false;

     async start(): Promise<void> {
       if (this.started) return;
       this.started = true;
       logInfo(LOG, "start()");
       const result = await commands.getInferenceProvider();
       if (result.status === "ok") this.current = result.data;
       this.unlisten = await listen<{ provider: string }>("provider:changed", (e) => {
         logInfo(LOG, `provider:changed → ${e.payload.provider}`);
         this.current = e.payload.provider as InferenceProvider;
       });
     }

     stop(): void {
       this.unlisten?.();
       this.unlisten = null;
       this.started = false;
     }

     async ensureAutoFallback(brainReady: boolean, brainAssigned: boolean): Promise<void> {
       const wanted: InferenceProvider = brainReady && brainAssigned
         ? "LocalFirst"
         : "LocalClaudeSubscription";
       if (this.current === wanted) return;
       logInfo(LOG, `auto-fallback: ${this.current} → ${wanted} (ready=${brainReady} assigned=${brainAssigned})`);
       this.loading = true;
       try {
         const result = await commands.setInferenceProvider(wanted);
         if (result.status === "error") throw new Error(result.error);
       } catch (e) {
         const msg = e instanceof Error ? e.message : String(e);
         this.error = msg;
         logError(LOG, `ensureAutoFallback failed: ${msg}`);
       } finally {
         this.loading = false;
       }
     }
   }

   export const routingState = new RoutingState();
   ```

2. NEW `interfaces/desktop/src/lib/domains/app/models/ui/DefaultBrainCard.svelte`:
   - Imports `modelsState`, `routingState`, `isInferenceReady`.
   - `$derived` slot = `modelsState.slots.find(s => s.id === "chat.brain")`.
   - `$derived` model = assigned model metadata.
   - `$derived` availableModels = `modelsState.models.filter(m => m.capabilities?.includes("TextGeneration"))`.
   - `$effect` watches `[slot.assigned_model_id, isInferenceReady(status)]` — calls `routingState.ensureAutoFallback(ready, assigned)`.
   - UI: current brain name + ready/assigned badge + model picker dropdown + Apply button.
   - On Apply: `modelsState.assign(selectedId)` → `modelsState.load("chat.brain")` → rune $effect propagates to routing auto-fallback.
   - On "Clear" (unassign): `modelsState.unload("chat.brain")` → auto-fallback reverts to Subscription.
   - DTCG tokens, no raw hex/px. Uses existing `Card` / `Badge` / `Button` / `Spinner` ColdLight components.
   - No IPC on mount (dumb UI — state from `modelsState` which is already listening).

3. EDIT `interfaces/desktop/src/routes/(devtools)/devtools/claude/+page.svelte`:
   - Import `routingState` + `DefaultBrainCard`.
   - `$effect` on mount: `routingState.start()`, cleanup `routingState.stop()`.
   - Replace the Subscription-tab MCP header badge with a live routing-mode badge:
     - `LocalClaudeSubscription` → "Subscription" (teal)
     - `LocalFirst` → "Local Brain" (positive green)
     - `LocalClaudeApiCouncil` → "Council" (purple)
   - Insert `<DefaultBrainCard />` in the Subscription tab grid — between Sidecar card and Internal Lane Usage card (col-span-2 or col-span-1 as layout demands).
   - Leave API Providers tab and Council tab UNTOUCHED (deferred).

4. NEW `interfaces/desktop/src/lib/domains/app/models/index.ts` — add exports if not already exported:
   ```ts
   export { routingState } from "./data-access/routing.state.svelte.js";
   export { default as DefaultBrainCard } from "./ui/DefaultBrainCard.svelte";
   ```

## Execution Order

1. **Create `routing.state.svelte.ts`**. `pnpm check` green.
2. **Create `DefaultBrainCard.svelte`**. `pnpm check` green. Render in isolation if a test route exists; otherwise defer visual check to step 3.
3. **Edit `/devtools/claude/+page.svelte`** — mount the card, add routing badge, wire `routingState.start/stop`. `pnpm check` green.
4. **Manual round-trip** with the app running:
   - Open `/devtools/claude` Subscription tab.
   - Observe badge = "Subscription" (app default).
   - Use `/devtools/models` or wizard to assign a local model to `chat.brain`. Apply in DefaultBrainCard. Load finishes.
   - Badge flips to "Local Brain". `get_inference_provider` returns `LocalFirst`. `provider:changed` event fires.
   - Unload the slot. Badge flips back to "Subscription".
5. Commit: `feat(devtools): Default Brain card + auto-fallback routing (Phase B)`.

## Verification Gate

- [ ] `pnpm check` — 0 errors, 0 warnings.
- [ ] `cargo check -p devpulse_desktop_backend` — 0 errors (no backend changes, should be unchanged).
- [ ] Round-trip works on a live app: assigning a loaded local model flips routing to LocalFirst; unloading reverts.
- [ ] Session JSONL: `models.routing` logger shows `provider:changed` events AND `ensureAutoFallback` transitions.
- [ ] Opening the page and closing it cleanly unsubscribes (no duplicate `provider:changed` listeners — verify via repeated open/close + a known event count).
- [ ] `lefthook run pre-commit` — passes (no kernel vocabulary leak, no raw hex/px, IP boundary clean).

## Do NOT Touch

- `/devtools/claude` API Providers tab — deferred.
- `/devtools/claude` Council tab — deferred.
- Wizard `ConfigView`, `ValidateView`, `DoneView`, `BrainCard` — wizard keeps its own flow.
- `/devtools/models` — full-slot manager stays primary for multi-slot editing.
- Kernel `RoutingMode` enum — untouched.
- `commands/cloud/mod.rs` — Phase 0b already migrated it.
- MCP / sidecar / Claude Code probe stubs — separate sprint.
- API key entry UI — separate sprint.

## Anti-Pattern Risks

| Risk | Prevention |
|---|---|
| Adding a "routing mode picker" dropdown anywhere | Owner directive: routing is auto-consequence of brain state. No user-facing picker. |
| Duplicating `/devtools/models` slot management inside DefaultBrainCard | Card is `chat.brain`-scoped ONLY. No "load all", no multi-slot. |
| Calling `set_inference_provider` from anywhere but `routingState.ensureAutoFallback` | One chokepoint. Grep enforces this: any direct `commands.setInferenceProvider` call outside `routing.state.svelte.ts` = drift. |
| Subscribing to `provider:changed` from multiple places | Only `routingState.start()` owns the listener. Components read `routingState.current`. |
| Firing `ensureAutoFallback` in a loop from a poorly-written $effect | `$effect` depends on exact slot-status dependencies. Early-return in state when `current === wanted`. |
| Forgetting `routingState.stop()` on devtool page unmount | $effect cleanup function returned explicitly. Test: open page 10 times, `provider:changed` still fires once per backend event. |
| Mounting DefaultBrainCard outside /devtools/claude | It's scoped to that surface. Re-use means re-think. |

## Post-Sprint Cleanup

- Update `SPRINT-WIZARD-FINISH.md` — strike through "RoutingModeRadio component + ConfigView 5th tab + settings reuse" with a note linking to Phase B.
- Worklog entry: "Phase B — /devtools/claude wired to live routing + auto-fallback. Subscription is default until local brain applied."
- `.claude/mistakes.md` entry if any duplication near-miss (none expected but document if it happens).

## Future Follow-Ups (NOT in this sprint)

- MCP / sidecar / Claude Code probe commands (authoring) + live badge wiring on Subscription tab.
- OpenAI / Gemini `cloud_chat` implementations (backend) + API Providers tab key-entry + per-provider default selection.
- API Providers tab "Set as default" button wired to `set_inference_provider` OR a new `set_active_api_provider` (depends on whether routing-mode enum is extended).
- Council tab live arbitration config writes.
- Lane usage telemetry feed from engine → frontend stats cards.

## Links

- Parent: `SPRINT-WIZARD-FINISH.md`
- Depends on: nothing blocking (Phase 0a/0b help debugging but aren't hard deps)
- Blocks: none (Phase C is independent)
- Research: `SPRINT-WIZARD-FINISH.research.md` §Item 2
- Owner directive anchor: conversation on 2026-04-20 — "SUBSCRIPTION IS DEFAULT USED UNTIL THE FUCKING LOCAL LLM HAS BEEN SAVED/APPLIED"
