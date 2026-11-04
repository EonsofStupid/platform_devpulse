<!--
  @file LatencyTuningPanel.svelte
  @domain models/setup-wizard/panels

  Latency / response source tuning for the voice + chat pipeline.
  LocalFirst / LocalClaudeSubscription / LocalClaudeApiCouncil radio
  (the engine `InferenceProvider` enum, value-for-value with the kernel
  `RoutingMode`). Audio buffer slider (50–1000 ms), VAD silence slider
  (200–2000 ms), advanced stream chunk size knob behind a disclosure.

  Drafts persist immediately via `setupWizardOverlayState.saveLatency`
  → `commands.routingSaveConfig` (engine `Platform::routing_config_save`).
  The engine clamps + writes through to the kernel `assistant.routing.mode`
  so the chat dispatcher uses the chosen lane on the next request.
-->
<script lang="ts">
import { Heading } from "@devpulse/coldlight/components/heading";
import { Text } from "@devpulse/coldlight/components/text";
import { ChevronDown, ChevronUp, Clock, Settings, Zap } from "lucide-svelte";
import type { InferenceProvider } from "#lib/sys/generated/bindings.js";
import { logInfo } from "#lib/sys/logger.js";
import { setupWizardOverlayState } from "../../../data-access/setup-wizard-overlay.state.svelte.js";

const LOG_TARGET = "wizard.latency";
const overlayState = setupWizardOverlayState;

interface SourceOption {
	id: InferenceProvider;
	label: string;
	desc: string;
	icon: typeof Zap;
}

const SOURCES: SourceOption[] = [
	{
		id: "local_first",
		label: "Local only",
		desc: "Fastest. Every request runs on your hardware.",
		icon: Zap,
	},
	{
		id: "local_claude_subscription",
		label: "Claude subscription",
		desc: "Local first, escalate via the Claude subscription lane when local can't answer.",
		icon: Settings,
	},
	{
		id: "local_claude_api_council",
		label: "API council",
		desc: "Local first; full Claude API council for deeper reasoning.",
		icon: Zap,
	},
];

let showAdvanced = $state(false);

async function setSource(id: InferenceProvider): Promise<void> {
	logInfo(LOG_TARGET, `setSource(${id})`);
	await overlayState.saveLatency({
		...overlayState.routing.latency,
		response_source: id,
	});
}

async function setBuffer(ms: number): Promise<void> {
	logInfo(LOG_TARGET, `setBuffer(${ms})`);
	await overlayState.saveLatency({
		...overlayState.routing.latency,
		audio_buffer_ms: ms,
	});
}

async function setVadSilence(ms: number): Promise<void> {
	logInfo(LOG_TARGET, `setVadSilence(${ms})`);
	await overlayState.saveLatency({
		...overlayState.routing.latency,
		vad_silence_ms: ms,
	});
}

async function setStreamChunk(size: number): Promise<void> {
	logInfo(LOG_TARGET, `setStreamChunk(${size})`);
	await overlayState.saveLatency({
		...overlayState.routing.latency,
		stream_chunk_size: size,
	});
}
</script>

<div class="lat-panel">
	<div class="lat-head">
		<div class="lat-head-icon"><Clock size={18} /></div>
		<div class="lat-head-text">
			<Heading level={3} size="sm">Latency tuning</Heading>
			<Text size="xs" color="muted">
				Trade speed against quality for voice and chat. Defaults work for most setups.
			</Text>
		</div>
	</div>

	<!-- Response source -->
	<div class="lat-section">
		<Text size="xs" weight="bold" color="muted" class="lat-section-title">Response source</Text>
		<div class="lat-radio-group" role="radiogroup" aria-label="Response source">
			{#each SOURCES as src (src.id)}
				{@const SrcIcon = src.icon}
				<button
					type="button"
					class="lat-radio"
					class:lat-radio-active={overlayState.routing.latency.response_source === src.id}
					role="radio"
					aria-checked={overlayState.routing.latency.response_source === src.id}
					onclick={() => void setSource(src.id)}
				>
					<SrcIcon size={16} />
					<div class="lat-radio-text">
						<Text size="sm" weight="bold">{src.label}</Text>
						<Text size="xs" color="muted">{src.desc}</Text>
					</div>
				</button>
			{/each}
		</div>
	</div>

	<!-- Audio buffer -->
	<div class="lat-section">
		<Text size="xs" weight="bold" color="muted" class="lat-section-title">Audio buffer</Text>
		<div class="lat-slider-row">
			<Text size="xs" color="muted" class="lat-slider-label">Buffer</Text>
			<input
				type="range"
				class="lat-range"
				min={50}
				max={1000}
				step={50}
				value={overlayState.routing.latency.audio_buffer_ms}
				oninput={(e) => void setBuffer(Number(e.currentTarget.value))}
				aria-label="Audio buffer in milliseconds"
			/>
			<Text size="xs" weight="bold" class="lat-slider-value">
				{overlayState.routing.latency.audio_buffer_ms}ms
			</Text>
		</div>
		<Text size="xs" color="muted">
			Smaller = faster response. Larger = smoother audio. 200ms is a good default.
		</Text>
	</div>

	<!-- VAD silence -->
	<div class="lat-section">
		<Text size="xs" weight="bold" color="muted" class="lat-section-title">
			Voice activity detection
		</Text>
		<div class="lat-slider-row">
			<Text size="xs" color="muted" class="lat-slider-label">Silence</Text>
			<input
				type="range"
				class="lat-range"
				min={200}
				max={2000}
				step={100}
				value={overlayState.routing.latency.vad_silence_ms}
				oninput={(e) => void setVadSilence(Number(e.currentTarget.value))}
				aria-label="VAD silence threshold in milliseconds"
			/>
			<Text size="xs" weight="bold" class="lat-slider-value">
				{overlayState.routing.latency.vad_silence_ms}ms
			</Text>
		</div>
		<Text size="xs" color="muted">
			How long to wait after you stop talking before processing. 500ms balances speed and
			complete sentences.
		</Text>
	</div>

	<!-- Advanced -->
	<button class="lat-advanced-toggle" type="button" onclick={() => (showAdvanced = !showAdvanced)}>
		<Settings size={14} />
		<span>{showAdvanced ? "Hide advanced" : "Show advanced"}</span>
		{#if showAdvanced}
			<ChevronUp size={14} />
		{:else}
			<ChevronDown size={14} />
		{/if}
	</button>

	{#if showAdvanced}
		<div class="lat-section">
			<Text size="xs" weight="bold" color="muted" class="lat-section-title">
				Stream chunk size
			</Text>
			<div class="lat-slider-row">
				<Text size="xs" color="muted" class="lat-slider-label">Tokens</Text>
				<input
					type="range"
					class="lat-range"
					min={64}
					max={1024}
					step={64}
					value={overlayState.routing.latency.stream_chunk_size}
					oninput={(e) => void setStreamChunk(Number(e.currentTarget.value))}
					aria-label="Stream chunk size in tokens"
				/>
				<Text size="xs" weight="bold" class="lat-slider-value">
					{overlayState.routing.latency.stream_chunk_size}
				</Text>
			</div>
			<Text size="xs" color="muted">
				Larger chunks reduce overhead but delay the first token. Default 256 is a good balance.
			</Text>
		</div>
	{/if}
</div>

<style>
	.lat-panel {
		display: flex;
		flex-direction: column;
		gap: clamp(0.625rem, 1.25vw, 0.875rem);
	}

	.lat-head {
		display: flex;
		align-items: flex-start;
		gap: 0.625rem;
	}
	.lat-head-icon {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 1.75rem;
		height: 1.75rem;
		border-radius: 0.5rem;
		background: color-mix(in oklch, var(--accent-teal-main) 25%, transparent);
		color: var(--accent-teal-main);
		flex-shrink: 0;
	}
	.lat-head-text {
		display: flex;
		flex-direction: column;
		gap: 0.125rem;
		flex: 1;
		min-width: 0;
	}

	.lat-section {
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
	}
	:global(.lat-section-title) {
		text-transform: uppercase;
		letter-spacing: 0.06em;
	}

	.lat-radio-group {
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
	}

	.lat-radio {
		display: flex;
		align-items: flex-start;
		gap: 0.625rem;
		padding: 0.625rem 0.75rem;
		border-radius: 0.625rem;
		border: 1px solid var(--border-soft);
		background: var(--surface-raised);
		color: var(--text-secondary);
		cursor: pointer;
		text-align: left;
		transition: border-color 150ms ease-out, background 150ms ease-out, box-shadow 150ms ease-out;
	}
	.lat-radio:hover {
		border-color: color-mix(in oklch, var(--accent-teal-main) 35%, var(--border-soft));
	}
	.lat-radio-active {
		border-color: var(--accent-teal-main);
		background: color-mix(in oklch, var(--accent-teal-fill) 90%, transparent);
		box-shadow: 0 0 0.625rem color-mix(in oklch, var(--accent-teal-glow) 40%, transparent);
		color: var(--accent-teal-main);
	}

	.lat-radio-text {
		display: flex;
		flex-direction: column;
		gap: 0.125rem;
		flex: 1;
		min-width: 0;
	}

	.lat-slider-row {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}
	:global(.lat-slider-label) {
		min-width: 4rem;
	}
	:global(.lat-slider-value) {
		min-width: 3.5rem;
		text-align: right;
	}
	.lat-range {
		flex: 1;
		accent-color: var(--accent-teal-main);
	}

	.lat-advanced-toggle {
		display: inline-flex;
		align-items: center;
		gap: 0.375rem;
		padding: 0.375rem 0.5rem;
		border-radius: 0.375rem;
		background: transparent;
		border: 1px solid var(--border-soft);
		color: var(--text-secondary);
		font-size: 0.75rem;
		cursor: pointer;
		transition: color 150ms ease-out, background 150ms ease-out;
		align-self: flex-start;
	}
	.lat-advanced-toggle:hover {
		color: var(--accent-teal-main);
		background: color-mix(in oklch, var(--accent-teal-fill) 70%, transparent);
	}
</style>
