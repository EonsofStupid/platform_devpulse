<!--
	@file LiveSubsystemStrip.svelte
	@module @devpulse/devtools/_shared

	The "Live subsystems" strip on the devtools dashboard. Renders one
	`SubsystemTile` per Clyffy subsystem the dev cares about most:
	cortex (memory), vision (eyes), ears (STT/Sherpa), mouth (TTS),
	and reasoning (RRD). Each tile shows live status on hover + a
	one-click verb that hits the real kernel command (load/reload).

	# Why this lives in `_shared`, not `design/blocks`

	The strip wires DOMAIN-SPECIFIC state runes (`modelsState`,
	`rrdState`) so it isn't a primitive — it composes the
	`SubsystemTile` block with the project's actual state. Following
	the composition contract: domain-specific composer in
	`lib/devtools/_shared/`, primitive in `lib/design/blocks/`.
-->
<script lang="ts">
import { BrainCircuit, Ear, Eye, Sparkles, Volume2 } from "lucide-svelte";
import { onMount } from "svelte";
import { goto } from "$app/navigation";
import { resolve } from "$app/paths";
import {
	type SubsystemState,
	SubsystemTile,
	type SubsystemVerb,
} from "$lib/design/blocks/devtools/index.js";
import { isInferenceReady, modelsState } from "$lib/domains/app/models/index.js";
import { rroState } from "$lib/sys/data-access/rro/rro.state.svelte.js";

onMount(() => {
	// Subscribe to live RRO state transitions so the Reasoning tile
	// updates in real time as the daemon walks
	// idle → gathering → processing → ruminating → ready (or purged / forked).
	// `initialLoad` is idempotent — re-entering the dashboard does
	// not re-subscribe.
	void rroState.initialLoad();
	return () => rroState.teardownRroState();
});

/**
 * Build the live state summary for a slot-backed subsystem. Reads
 * `modelsState.slots` + `modelsState.statuses` and maps to a layman
 * status tone + label. Falls back to "unknown" when the slot id
 * isn't registered yet (auto-config hasn't run).
 */
function slotState(slotId: string, readyLabel: string): SubsystemState {
	const slot = modelsState.slots.find((s) => s.id === slotId);
	if (!slot) {
		return { tone: "unknown", label: "Slot not registered", detail: slotId };
	}
	const status = modelsState.statuses[slotId];
	if (!slot.assigned_model_id) {
		return {
			tone: "stopped",
			label: "No model assigned",
			detail: "Auto-config hasn't reached this slot yet",
		};
	}
	const model = modelsState.models.find((m) => m.id === slot.assigned_model_id) ?? null;
	if (status && isInferenceReady(status)) {
		return {
			tone: "up",
			label: readyLabel,
			detail: model ? `${model.filename} · ${slotId}` : `${slot.assigned_model_id} · ${slotId}`,
		};
	}
	if (status?.type === "loading") {
		return { tone: "starting", label: "Loading…", detail: slot.assigned_model_id };
	}
	if (status?.type === "failed") {
		return {
			tone: "down",
			label: "Load failed",
			detail: status.type === "failed" ? "See devtool logs" : slot.assigned_model_id,
		};
	}
	return {
		tone: "stopped",
		label: "Assigned · not loaded",
		detail: model ? model.filename : slot.assigned_model_id,
	};
}

/** Vision · SigLIP encoder (`vision.embedder`). */
const visionState = $derived<SubsystemState>(
	slotState("vision.embedder", "Ready · vision encode live"),
);

/** Ears · STT (`voice.stt`). */
const earsState = $derived<SubsystemState>(slotState("voice.stt", "Ready · STT live"));

/** Mouth · TTS (`voice.tts`). */
const mouthState = $derived<SubsystemState>(slotState("voice.tts", "Ready · TTS live"));

/**
 * Cortex · the orchestration layer. Reads aggregate slot readiness
 * across the four sensory slots. Cortex itself has no slot — it's
 * "up" iff every dependency is up.
 */
const cortexState: SubsystemState = $derived.by<SubsystemState>(() => {
	const slots = ["chat.brain", "vision.embedder", "voice.stt", "voice.tts"];
	const states = slots.map((id) => slotState(id, "ready"));
	const tones = states.map((s) => s.tone);
	if (tones.every((t) => t === "up")) {
		return { tone: "up", label: "All sensors ready", detail: "Memory orchestration live" };
	}
	if (tones.some((t) => t === "down")) {
		return {
			tone: "degraded",
			label: "One or more sensors failed",
			detail: "Hover into the offending tile for details",
		};
	}
	if (tones.some((t) => t === "starting")) {
		return {
			tone: "starting",
			label: "Sensors loading…",
			detail: "Cortex warms once all four are up",
		};
	}
	return {
		tone: "stopped",
		label: "Sensors offline",
		detail: "Auto-config hasn't completed the chain yet",
	};
});

/**
 * Reasoning · RRO state machine (the "subconscious"). Drives off
 * `rroState.rroSnapshot` which mirrors the kernel's live state
 * transitions via `platform:rro-state-changed`.
 *
 * State map → tone:
 * - `idle`        → `stopped` (no active retrieval)
 * - `gathering`   → `up`      (collecting context)
 * - `processing`  → `up`      (structuring context)
 * - `ruminating`  → `up`      (weighing alternatives)
 * - `ready`       → `up`      (context prepared — ready to act)
 * - `purged`      → `degraded`(context discarded — needs re-gather)
 * - `forked`      → `up`      (branched into alternative path)
 */
const reasoningState: SubsystemState = $derived.by<SubsystemState>(() => {
	const snap = rroState.rroSnapshot;
	if (!snap) {
		return {
			tone: "unknown",
			label: "Reasoning not yet probed",
			detail: "Open the devtool to initialize",
		};
	}
	switch (snap.state) {
		case "idle":
			return { tone: "stopped", label: "Idle", detail: `source · ${snap.source}` };
		case "gathering":
			return {
				tone: "up",
				label: "Gathering context",
				detail: `from · ${snap.source}`,
			};
		case "processing":
			return {
				tone: "up",
				label: "Processing context",
				detail: `depth · ${snap.depth}`,
			};
		case "ruminating":
			return {
				tone: "up",
				label: "Weighing alternatives",
				detail: `depth · ${snap.depth}`,
			};
		case "ready":
			return {
				tone: "up",
				label: "Ready",
				detail: `depth · ${snap.depth} · source ${snap.source}`,
			};
		case "purged":
			return {
				tone: "degraded",
				label: "Context purged",
				detail: "Run Gather to re-fill",
			};
		case "forked":
			return {
				tone: "up",
				label: "Branched context active",
				detail: `source · ${snap.source}`,
			};
	}
});

/**
 * Build the load/reload verb for a slot-backed subsystem.
 * - "Download model" when no model assigned (navigates to slots devtool
 *   which owns the downloader overlay).
 * - "Load" when assigned but not loaded.
 * - "Reload" when loaded (unload + load).
 */
function slotVerbs(slotId: string): SubsystemVerb[] {
	const slot = modelsState.slots.find((s) => s.id === slotId);
	if (!slot) return [];
	if (!slot.assigned_model_id) {
		return [
			{
				id: "open-downloader",
				label: "Download model",
				ariaLabel: `Open the model downloader for ${slotId}`,
				tone: "primary",
				onclick: () => {
					void goto(resolve("/devtools/runtimes/orchestrator/slots"));
				},
			},
		];
	}
	const status = modelsState.statuses[slotId];
	const loading = status?.type === "loading";
	const ready = status ? isInferenceReady(status) : false;
	if (ready) {
		return [
			{
				id: "reload",
				label: "Reload",
				ariaLabel: `Reload ${slotId}`,
				tone: "primary",
				busy: loading,
				onclick: async () => {
					await modelsState.unload(slotId);
					await modelsState.load(slotId);
				},
			},
		];
	}
	return [
		{
			id: "load",
			label: "Load",
			ariaLabel: `Load ${slotId}`,
			tone: "primary",
			busy: loading,
			onclick: () => modelsState.load(slotId),
		},
	];
}

const visionVerbs = $derived<SubsystemVerb[]>(slotVerbs("vision.embedder"));
const earsVerbs = $derived<SubsystemVerb[]>(slotVerbs("voice.stt"));
const mouthVerbs = $derived<SubsystemVerb[]>(slotVerbs("voice.tts"));

/**
 * Local busy flag for the cortex rescan verb (modelsState doesn't
 * expose a global `loading` rune — scan is a one-shot RPC).
 */
let cortexBusy = $state(false);

/** Cortex verb: rescan all model files on disk. */
const cortexVerbs = $derived<SubsystemVerb[]>([
	{
		id: "rescan",
		label: "Rescan models",
		ariaLabel: "Rescan the on-disk model directory",
		tone: "primary",
		busy: cortexBusy,
		onclick: async () => {
			cortexBusy = true;
			try {
				await modelsState.scan();
				await modelsState.refresh();
			} finally {
				cortexBusy = false;
			}
		},
	},
]);

/**
 * Reasoning verbs — drive the RRO state machine from the tile.
 * Each verb fires a kernel `trigger_*` IPC and the live
 * `platform:rro-state-changed` event updates `rroSnapshot` so
 * the tile reflects the new state without a manual refresh.
 *
 * - **Gather** — absorb context from the default source
 *   (`gatherSource` rune field; "manual" if empty). Transitions
 *   idle → gathering → processing → ruminating → ready.
 * - **Purge** — discard the current context with the configured
 *   reason ("stale" if empty). Transitions whatever-state →
 *   purged. The dev runs Gather afterwards to re-fill.
 * - **Fork** — branch the current context into an alternative
 *   path under the configured label ("alt" if empty).
 *
 * Each verb's `busy` flag mirrors the matching
 * `rroState.rroActionLoading.{gather,purge,fork}` field so the
 * tile shows a spinner while the kernel transition is in flight.
 */
const reasoningVerbs = $derived<SubsystemVerb[]>([
	{
		id: "gather",
		label: "Gather",
		ariaLabel: "Absorb context — transition the RRO state machine to gathering",
		tone: "primary",
		busy: rroState.rroActionLoading.gather,
		onclick: () => rroState.triggerGather(),
	},
	{
		id: "purge",
		label: "Purge",
		ariaLabel: "Discard the current RRO context",
		tone: "ghost",
		busy: rroState.rroActionLoading.purge,
		onclick: () => rroState.triggerPurge(),
	},
	{
		id: "fork",
		label: "Fork",
		ariaLabel: "Branch the current RRO context into an alternative path",
		tone: "ghost",
		busy: rroState.rroActionLoading.fork,
		onclick: () => rroState.triggerFork(),
	},
]);
</script>

<section class="live-subsystem-strip" aria-label="Live subsystems">
	<header class="live-subsystem-strip__header">
		<h2 class="live-subsystem-strip__title">Live subsystems</h2>
		<p class="live-subsystem-strip__blurb">
			Hover any tile for live status + one-click load. The dedicated devtool opens on click.
		</p>
	</header>

	<div class="live-subsystem-strip__grid">
		<SubsystemTile
			route={resolve("/devtools/clyffy/memory/cortex")}
			label="Cortex"
			blurb="Memory orchestration · cross-sensor"
			icon={Sparkles}
			accent="cyan"
			status={cortexState}
			verbs={cortexVerbs}
		/>
		<SubsystemTile
			route={resolve("/devtools/clyffy/eyes/vision")}
			label="Vision"
			blurb="SigLIP image embeddings"
			icon={Eye}
			accent="purple"
			status={visionState}
			verbs={visionVerbs}
		/>
		<SubsystemTile
			route={resolve("/devtools/clyffy/ears/stt")}
			label="Ears"
			blurb="Sherpa speech-to-text"
			icon={Ear}
			accent="ember"
			status={earsState}
			verbs={earsVerbs}
		/>
		<SubsystemTile
			route={resolve("/devtools/clyffy/mouth/tts")}
			label="Mouth"
			blurb="Voice synthesis"
			icon={Volume2}
			accent="coral"
			status={mouthState}
			verbs={mouthVerbs}
		/>
		<SubsystemTile
			route={resolve("/devtools/clyffy/reasoning/rrd")}
			label="Reasoning"
			blurb="RRD subconscious daemon"
			icon={BrainCircuit}
			accent="teal"
			status={reasoningState}
			verbs={reasoningVerbs}
		/>
	</div>
</section>

<style>
	.live-subsystem-strip {
		display: flex;
		flex-direction: column;
		gap: var(--space-9);
		margin-bottom: var(--space-12);
	}

	.live-subsystem-strip__header {
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
	}

	.live-subsystem-strip__title {
		margin: 0;
		font-size: var(--font-size-sm);
		font-weight: var(--font-weight-semibold);
		color: var(--text-primary);
	}

	.live-subsystem-strip__blurb {
		margin: 0;
		font-size: var(--font-size-xs);
		color: var(--text-muted);
	}

	.live-subsystem-strip__grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(16rem, 1fr));
		gap: var(--space-9);
	}
</style>
