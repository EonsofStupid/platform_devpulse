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
import {
	type SubsystemState,
	SubsystemTile,
	type SubsystemVerb,
} from "$lib/design/blocks/devtools/index.js";
import { isInferenceReady, modelsState } from "$lib/domains/app/models/index.js";
import { rrdState } from "$lib/sys/data-access/rrd/rrd.state.svelte.js";

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
const cortexState = $derived<SubsystemState>(() => {
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
 * Reasoning · RRD daemon. Maps the RRD state machine (idle /
 * starting / running / maintenance / failed) onto the subsystem
 * tone bucket.
 */
const reasoningState = $derived<SubsystemState>(() => {
	const last = rrdState.last;
	if (!last) {
		return {
			tone: "unknown",
			label: "RRD not yet probed",
			detail: "Open the devtool for first run",
		};
	}
	const phase = last.phase;
	if (phase === "running") {
		return { tone: "up", label: "Subconscious live", detail: `Phase · ${phase}` };
	}
	if (phase === "starting") {
		return { tone: "starting", label: "Initializing…", detail: `Phase · ${phase}` };
	}
	if (phase === "failed") {
		return {
			tone: "down",
			label: "RRD failed",
			detail: last.detail ?? "See reasoning devtool logs",
		};
	}
	if (phase === "maintenance") {
		return { tone: "degraded", label: "Maintenance mode", detail: `Phase · ${phase}` };
	}
	return { tone: "stopped", label: "Idle", detail: `Phase · ${phase}` };
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
					window.location.assign(`/devtools/runtimes/orchestrator/slots`);
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
 * Reasoning verb: clear the rolling RRD phase-transition history.
 * The actual re-probe path is owned by the kernel daemon; the
 * frontend just listens. Clearing the history gives the dev a
 * clean slate to watch the next pause→resume cycle.
 */
const reasoningVerbs = $derived<SubsystemVerb[]>([
	{
		id: "clear-history",
		label: "Clear history",
		ariaLabel: "Clear the local RRD phase-transition history",
		tone: "ghost",
		onclick: () => rrdState.clear(),
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
			route="/devtools/clyffy/memory/cortex"
			label="Cortex"
			blurb="Memory orchestration · cross-sensor"
			icon={Sparkles}
			accent="cyan"
			state={cortexState()}
			verbs={cortexVerbs}
		/>
		<SubsystemTile
			route="/devtools/clyffy/eyes/vision"
			label="Vision"
			blurb="SigLIP image embeddings"
			icon={Eye}
			accent="purple"
			state={visionState}
			verbs={visionVerbs}
		/>
		<SubsystemTile
			route="/devtools/clyffy/ears/stt"
			label="Ears"
			blurb="Sherpa speech-to-text"
			icon={Ear}
			accent="ember"
			state={earsState}
			verbs={earsVerbs}
		/>
		<SubsystemTile
			route="/devtools/clyffy/mouth/tts"
			label="Mouth"
			blurb="Voice synthesis"
			icon={Volume2}
			accent="coral"
			state={mouthState}
			verbs={mouthVerbs}
		/>
		<SubsystemTile
			route="/devtools/clyffy/reasoning/rrd"
			label="Reasoning"
			blurb="RRD subconscious daemon"
			icon={BrainCircuit}
			accent="teal"
			state={reasoningState()}
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
