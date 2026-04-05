<!--
  @file LatencyTuningPanel.svelte
  @module @devpulse/domains/app/models/features/setup-wizard/steps/LatencyTuningPanel

  Dev-only latency config. Content source selector, pipeline timing,
  latency tolerance slider, stream/buffer/hybrid, memory lane protocol.
  All values show "—" until Phase 4 tests populate real data.
-->
<script lang="ts">
import { Text } from "$lib/design/components/text/index.js";
import { box } from "$lib/design/utils/box/index.js";
import { cn } from "$lib/design/utils/cn.js";
import { hstack } from "$lib/design/utils/hstack/index.js";
import { stack } from "$lib/design/utils/stack/index.js";
import { wizardState } from "../wizard.runes.svelte.js";
import type { VoiceDeliveryMode } from "../wizard.types.js";

function setLatency(ms: number): void {
	wizardState.voiceConfig = { ...wizardState.voiceConfig, latencyToleranceMs: ms };
}

function setDeliveryMode(mode: VoiceDeliveryMode): void {
	wizardState.voiceConfig = { ...wizardState.voiceConfig, deliveryMode: mode };
}

$effect(() => {
	persistConfig();
});

async function persistConfig(): Promise<void> {
	try {
		const { invoke } = await import("@tauri-apps/api/core");
		await invoke("set_preference", {
			key: "voice_config",
			value: JSON.stringify(wizardState.voiceConfig),
		});
	} catch {
		// Non-critical
	}
}
</script>

<div
	class={cn(box({ paddingX: "12", paddingY: "8" }), "rounded-lg w-full border")}
	style="background: var(--surface-base); border-color: var(--border-subtle);"
>
	<div class={stack({ gap: "4" })}>
		<Text size="sm" weight="bold" color="primary">Latency Tuning (dev only)</Text>

		<!-- Pipeline timing — dashes until Phase 4 populates -->
		<div class={stack({ gap: "1" })}>
			<Text size="xs" weight="bold" color="secondary">Pipeline Timing</Text>
			<Text size="xs" color="muted">
				User speaks → [STT: —ms] → [Reasoning: —ms] → [serialize: &lt;1ms] → [TTS: —ms] → [Play: —s]
			</Text>
			<Text size="xs" color="muted">Total: — (measured in Phase 4)</Text>
		</div>

		<!-- Latency tolerance slider -->
		<div class={stack({ gap: "2" })}>
			<div class={hstack({ gap: "4", align: "center", justify: "between" })}>
				<Text size="xs" weight="bold" color="secondary">
					Acceptable delay before Clyffy speaks
				</Text>
				<Text size="xs" color="muted">{wizardState.voiceConfig.latencyToleranceMs}ms</Text>
			</div>
			<input
				type="range"
				min="500"
				max="10000"
				step="100"
				value={wizardState.voiceConfig.latencyToleranceMs}
				oninput={(e) => setLatency(Number(e.currentTarget.value))}
				class="w-full accent-[var(--accent-teal-main)]"
				aria-label="Latency tolerance in milliseconds"
			/>
			<div class={hstack({ justify: "between" })}>
				<Text size="xs" color="muted">500ms</Text>
				<Text size="xs" color="muted">10000ms</Text>
			</div>
		</div>

		<!-- Delivery mode -->
		<div class={stack({ gap: "2" })}>
			<Text size="xs" weight="bold" color="secondary">Delivery Mode</Text>
			{#each [
				{ id: "stream" as const, label: "Stream", desc: "Starts speaking immediately, may pause mid-sentence" },
				{ id: "buffer" as const, label: "Buffer", desc: "Wait for full response, smooth delivery" },
				{ id: "hybrid" as const, label: "Hybrid", desc: "Stream after first sentence complete" },
			] as mode (mode.id)}
				<label class="flex items-start gap-2 cursor-pointer">
					<input
						type="radio"
						name="delivery-mode"
						value={mode.id}
						checked={wizardState.voiceConfig.deliveryMode === mode.id}
						onchange={() => setDeliveryMode(mode.id)}
						class="mt-0.5 accent-[var(--accent-teal-main)]"
					/>
					<div>
						<Text size="xs" weight="bold" color="primary">{mode.label}</Text>
						<Text size="xs" color="muted">{mode.desc}</Text>
					</div>
				</label>
			{/each}
		</div>

	</div>
</div>
