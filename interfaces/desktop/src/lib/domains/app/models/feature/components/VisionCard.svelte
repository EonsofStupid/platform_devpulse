<!--
  @file VisionCard — "How Clyffy sees your screen" card for the consumer model loader.
  Auto-detects built-in VLM vs SigLIP2. Zero jargon.
  ALL styling via ColdLight semantic token vars.
-->
<script lang="ts">
import { Badge } from "@devpulse/coldlight/components/badge";
import { Spinner } from "@devpulse/coldlight/components/spinner";
import { Text } from "@devpulse/coldlight/components/text";
import { cssVarString, renderForge } from "@devpulse/coldlight/renderforge";
import { hstack } from "@devpulse/coldlight/utils/hstack";
import { stack } from "@devpulse/coldlight/utils/stack";
import { Download, Eye, Power, PowerOff, Sparkles, X } from "lucide-svelte";
import { logInfo } from "#lib/sys/logger.js";
import { hardwareState } from "../../data-access/hardware.state.svelte.js";
import { modelsState } from "../../data-access/models.state.svelte.js";
import { narrationState } from "../../data-access/narration.state.svelte.js";
import { visionCardState } from "../../data-access/vision-card.state.svelte.js";
import {
	formatEta,
	formatMb,
	formatSpeed,
	statusLabel,
	statusToTone,
} from "../../util/models.types.js";
import { wizardState } from "../setup-wizard/wizard.state.svelte.js";
import ModelPicker from "./ModelPicker.svelte";

interface Props {
	advanced?: boolean;
}

let { advanced = false }: Props = $props();
const visionState = visionCardState;
const cardM = $derived(renderForge({ kind: "vision-card", preset: "glass-elevated" }));

$effect(() => {
	void visionState.ensureCatalogLoaded();
});

// ── Recommendation prefill ──────────────────────────────
// Vision card binds against `vision.embedder` — the standalone vision
// slot used when the brain isn't a VLM. When a recommendation exists
// for that slot AND the user hasn't picked yet AND the file is on
// disk, prefill the model selection.
const visionRec = $derived(wizardState.recommendations.find((r) => r.slot === "vision.embedder"));
const recIsActive = $derived(
	visionRec !== undefined &&
		visionState.committedModelId === null &&
		visionState.pendingModelId === null,
);

$effect(() => {
	const rec = visionRec;
	if (!rec?.alreadyDownloaded) return;
	if (visionState.committedModelId || visionState.pendingModelId) return;
	const model = modelsState.models.find((m) => m.filename === rec.file);
	if (model && visionState.selectedModelId !== model.id) {
		logInfo("vision-card", `prefill selectedModelId=${model.id} from recommendation`);
		visionState.selectModel(model.id);
	}
});
</script>

<div
	{...cardM.dataAttrs}
	style="{cssVarString(cardM.cssVars)} border-left: 3px solid var(--accent-cyan-main); box-shadow: 0 0 0 1px var(--accent-cyan-fill);"
	class="rounded-xl p-5 transition-all"
	data-component="vision-card"
	data-role="vision"
	title="Lets Clyffy see what's on your screen — helps with error dialogs, layout issues, and visual problems"
>
	<div class={stack({ gap: "3" })}>
		<div class={hstack({ justify: "between", align: "center" })}>
			<div class={stack({ gap: "1" })}>
				<div class={hstack({ gap: "2", align: "center" })}>
					<Eye size={18} style="color: var(--accent-teal-main);" />
					<Text size="base" weight="bold" color="primary">Vision</Text>
					{#if recIsActive}
						<Badge variant="informative" size="sm" title="This card is pre-filled from your model plan">
							<Sparkles size={10} />
							Recommended
						</Badge>
					{:else if visionRec}
						<Badge variant="neutral" size="sm" title="You overrode the recommendation">
							Custom pick
						</Badge>
					{/if}
				</div>
				<Text size="xs" color="muted">How Clyffy sees your screen</Text>
			</div>
			<Badge
				variant={visionState.isLoaded ? "positive" : visionState.hasModel ? "neutral" : "neutral"}
				size="sm"
				title={visionState.isLoaded
					? "Vision is active — Clyffy can see your screen"
					: visionState.hasModel
						? "Vision model is downloaded — click Activate to turn it on"
						: "You need to install the vision model so Clyffy can see your screen"}
			>
				{visionState.isLoaded ? "Active" : visionState.hasModel ? "Ready" : "Not installed"}
			</Badge>
		</div>

		<div class="rounded-lg px-3 py-2" style="background: oklch(0.15 0 0 / 0.3);">
			{#if visionState.brainHasVision}
				<Text size="sm" color="secondary" title="Your Brain model already includes vision — no separate download needed">
					Using built-in vision from your Brain model (recommended).
					No extra download needed.
				</Text>
			{:else}
				<Text size="sm" color="secondary" title="A small separate model that lets Clyffy understand screenshots and UI elements">
					Clyffy uses a separate eye to see your screen and help with visual
					problems like error dialogs and layout issues.
				</Text>
			{/if}
		</div>

		<div class="flex gap-4">
			<label class="flex items-center gap-2 text-sm" style="color: var(--text-secondary);" title="When on, Clyffy automatically takes screenshots when you switch windows or tabs">
				<input type="checkbox" bind:checked={visionState.autoCapture} class="accent-teal-500" />
				Auto-capture
			</label>

			<label class="flex items-center gap-2 text-sm" style="color: var(--text-secondary);" title="Higher quality captures more detail but uses more memory — Standard is fine for most uses">
				Quality:
				<select
					bind:value={visionState.screenshotQuality}
					class="rounded border px-2 py-0.5 text-xs"
					style="background: var(--surface-base); border-color: var(--border-subtle); color: var(--text-primary);"
				>
					<option value="standard">Standard</option>
					<option value="high">High</option>
				</select>
			</label>
		</div>

		{#if !visionState.brainHasVision}
			<ModelPicker
				models={visionState.compatibleModels}
				selectedModelId={visionState.selectedModelId}
				committedModelId={visionState.committedModelId}
				pendingModelId={visionState.pendingModelId}
				onSelect={(modelId) => visionState.selectModel(modelId)}
			/>

			{#if visionState.isTransitioning && visionState.modelStatus}
				<div class={stack({ gap: "1" })}>
					<div class={hstack({ gap: "2", align: "center" })}>
						<Spinner size="sm" tone={statusToTone(visionState.modelStatus)} />
						<Text size="xs" color="muted">{statusLabel(visionState.modelStatus)}</Text>
					</div>
					{#if visionState.modelStatus.type === "loading"}
						<div class="h-1.5 w-full overflow-hidden rounded-full" style="background: var(--border-subtle);">
							<div class="h-full rounded-full transition-all duration-300" style="width: {visionState.modelStatus.progressPct}%; background: var(--accent-teal-main);"></div>
						</div>
					{/if}
				</div>
			{/if}

			<div class={hstack({ gap: "2", align: "center" })}>
				{#if visionState.downloading}
					<div class={stack({ gap: "1" })} style="flex: 1;">
						<div class={hstack({ justify: "between", align: "center" })}>
							<div class={hstack({ gap: "1", align: "center" })}>
								<Spinner size="sm" tone="accent" />
								<Text size="xs" color="muted">Downloading {visionState.downloadPct}%</Text>
							</div>
							<div class={hstack({ gap: "2", align: "center" })}>
								{#if visionState.downloadSpeedBps > 0}
									<Text size="xs" color="muted">{formatSpeed(visionState.downloadSpeedBps)}</Text>
								{/if}
								{#if visionState.downloadEtaSecs >= 0}
									<Text size="xs" color="muted">{formatEta(visionState.downloadEtaSecs)}</Text>
								{/if}
								<button
									class="rounded p-1 transition-colors hover:brightness-125"
									style="color: var(--signal-error);"
									onclick={() => visionState.handleCancelDownload()}
									title="Cancel download"
									aria-label="Cancel download"
								>
									<X size={12} />
								</button>
							</div>
						</div>
						<div class="h-1.5 w-full overflow-hidden rounded-full" style="background: var(--border-subtle);">
							<div class="h-full rounded-full transition-all duration-300" style="width: {visionState.downloadPct}%; background: var(--accent-teal-main);"></div>
						</div>
					</div>
				{:else if !visionState.hasModel}
					<div class={stack({ gap: "1" })}>
						{#if hardwareState.diskFreeMb !== null && visionState.visionSizeMb > 0}
							<Text size="xs" color="muted">{formatMb(visionState.visionSizeMb)} download · {formatMb(hardwareState.diskFreeMb)} free on disk</Text>
						{/if}
						<button
							class="flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold transition-all hover:brightness-125"
							style="background: var(--accent-teal-main); color: var(--surface-base);"
							onclick={() => visionState.handleDownload()}
							disabled={visionState.isTransitioning}
							title="Download the vision model so Clyffy can see your screen — small download, runs on CPU"
						>
							<Download size={14} />
							Install ({formatMb(visionState.visionSizeMb)})
						</button>
					</div>
				{:else if visionState.isLoaded}
					<button
						class="flex items-center gap-1.5 rounded px-3 py-1.5 text-xs font-medium transition-colors hover:brightness-110"
						style="background: var(--surface-base); border: 1px solid var(--border-subtle); color: var(--text-secondary);"
						onclick={() => visionState.handleUnload()}
						disabled={visionState.isTransitioning}
						title="Turn off vision to save memory — Clyffy won't see your screen until you reactivate"
					>
						<PowerOff size={12} />
						Deactivate
					</button>
				{:else}
					<button
						class="flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold transition-all hover:brightness-125"
						style="background: var(--accent-teal-main); color: var(--surface-base);"
						onclick={() => visionState.handleLoad()}
						disabled={visionState.isTransitioning}
						title="Turn on vision so Clyffy can see your screen and help with visual problems"
					>
						<Power size={14} />
						Activate
					</button>
				{/if}
			</div>
		{/if}

		{#if advanced}
			<div class="rounded border px-3 py-2" style="border-color: var(--border-subtle); background: oklch(0.15 0 0 / 0.5);">
				<Text size="xs" color="muted">
					Slot: {visionState.slotId} | File: {visionState.visionFile} | Brain VLM: {visionState.brainHasVision ? "yes" : "no"}
				</Text>
			</div>
		{/if}

		{#if narrationState.forSlot(visionState.slotId)}
			{@const msg = narrationState.forSlot(visionState.slotId)}
			{#if msg}
				<div
					class="rounded-lg border-l-2 px-3 py-2 text-xs"
					style="background: oklch(0.15 0.02 185 / 0.3); border-color: var(--accent-teal-main); color: var(--text-secondary);"
				>
					{msg.line}
				</div>
			{/if}
		{/if}

		{#if visionState.error}
			<Text size="xs" color="negative">{visionState.error}</Text>
		{/if}
	</div>
</div>
