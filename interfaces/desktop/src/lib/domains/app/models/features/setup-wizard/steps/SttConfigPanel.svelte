<!--
  @file SttConfigPanel.svelte
  @module @devpulse/domains/app/models/features/setup-wizard/steps/SttConfigPanel

  STT section. Shows voice.stt slot status, model assignment, mic test.
  test_microphone returns "Microphone test not yet available" — displayed raw.
-->
<script lang="ts">
import { Check, LoaderCircle, Mic, TriangleAlert } from "lucide-svelte";
import { Badge } from "$lib/design/components/badge/index.js";
import { Text } from "$lib/design/components/text/index.js";
import { box } from "$lib/design/utils/box/index.js";
import { cn } from "$lib/design/utils/cn.js";
import { hstack } from "$lib/design/utils/hstack/index.js";
import { stack } from "$lib/design/utils/stack/index.js";
import { modelsState } from "../../../runes/models.runes.svelte.js";
import { statusLabel } from "../../../types/models.types.js";

const sttStatus = $derived(modelsState.statuses["voice.stt"] ?? { type: "cold" as const });
const sttModel = $derived(modelsState.assignedModel("voice.stt"));

let micTestError = $state<string | null>(null);
let micTesting = $state(false);

async function testMic(): Promise<void> {
	micTesting = true;
	micTestError = null;
	try {
		const { invoke } = await import("@tauri-apps/api/core");
		await invoke("test_microphone");
	} catch (e) {
		micTestError = e instanceof Error ? e.message : String(e);
	} finally {
		micTesting = false;
	}
}
</script>

<div
	class={cn(box({ paddingX: "12", paddingY: "8" }), "rounded-lg w-full border")}
	style="background: var(--surface-base); border-color: var(--border-subtle);"
>
	<div class={stack({ gap: "3" })}>
		<div class={hstack({ gap: "4", align: "center" })}>
			<Mic size={16} style="color: var(--text-secondary);" />
			<Text size="sm" weight="bold" color="primary" class="flex-1">
				Speech-to-Text (STT)
			</Text>
			<Badge
				variant={sttStatus.type === "hot" || sttStatus.type === "standby" ? "positive" : sttStatus.type === "failed" ? "negative" : "neutral"}
				size="sm"
			>
				{statusLabel(sttStatus)}
			</Badge>
		</div>

		{#if sttModel}
			<Text size="xs" color="muted">Model: {sttModel.filename}</Text>
		{:else}
			<Text size="xs" color="muted">No model assigned to voice.stt slot</Text>
		{/if}

		<!-- Mic test -->
		<div class={hstack({ gap: "3", align: "center" })}>
			<button
				class="flex items-center gap-1.5 rounded px-3 py-1 text-xs transition-colors border"
				style="background: var(--surface-base); border-color: var(--border-subtle); color: var(--text-primary);"
				onclick={testMic}
				disabled={micTesting}
				aria-label="Test microphone"
			>
				{#if micTesting}
					<LoaderCircle size={12} class="animate-spin" />
				{:else}
					<Mic size={12} />
				{/if}
				Test Mic
			</button>

			{#if micTestError}
				<Text size="xs" color="muted">{micTestError}</Text>
			{/if}
		</div>
	</div>
</div>
