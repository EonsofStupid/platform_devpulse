<!--
  @file FullPipelineTest.svelte
  @module @devpulse/domains/app/models/features/setup-wizard/steps/FullPipelineTest

  5-step end-to-end voice pipeline test. Most steps WILL fail in dev track
  (stubs). Raw errors prove the plumbing works.
-->
<script lang="ts">
import { Check, LoaderCircle, Play, TriangleAlert } from "lucide-svelte";
import { Badge } from "$lib/design/components/badge/index.js";
import { Text } from "$lib/design/components/text/index.js";
import { box } from "$lib/design/utils/box/index.js";
import { cn } from "$lib/design/utils/cn.js";
import { hstack } from "$lib/design/utils/hstack/index.js";
import { stack } from "$lib/design/utils/stack/index.js";
import { testInference } from "../wizard.service.js";

type StepStatus = "pending" | "running" | "passed" | "failed" | "skipped";

interface TestStep {
	name: string;
	status: StepStatus;
	result: string | null;
	error: string | null;
}

let running = $state(false);
let testSteps = $state<TestStep[]>([
	{ name: "1. STT Transcription", status: "pending", result: null, error: null },
	{ name: "2. Voice Brain Response", status: "pending", result: null, error: null },
	{ name: "3. TTS Vocalization", status: "pending", result: null, error: null },
	{ name: "4. Chat Brain Escalation", status: "pending", result: null, error: null },
	{ name: "5. API Key Check", status: "pending", result: null, error: null },
]);

function updateStep(index: number, update: Partial<TestStep>): void {
	testSteps = testSteps.map((s, i) => (i === index ? { ...s, ...update } : s));
}

async function runAllTests(): Promise<void> {
	running = true;
	// Reset all
	testSteps = testSteps.map((s) => ({ ...s, status: "pending", result: null, error: null }));

	// Step 1: STT
	updateStep(0, { status: "running" });
	try {
		const { invoke } = await import("@tauri-apps/api/core");
		await invoke("test_microphone");
		updateStep(0, { status: "passed", result: "Microphone test passed" });
	} catch (e) {
		updateStep(0, { status: "failed", error: e instanceof Error ? e.message : String(e) });
	}

	// Step 2: voice.brain
	updateStep(1, { status: "running" });
	try {
		const response = await testInference("voice.brain", "Hello, quick test", 64, 0.7);
		updateStep(1, { status: "passed", result: response.slice(0, 80) });
	} catch (e) {
		updateStep(1, { status: "failed", error: e instanceof Error ? e.message : String(e) });
	}

	// Step 3: TTS
	updateStep(2, { status: "running" });
	try {
		const { invoke } = await import("@tauri-apps/api/core");
		await invoke("speak", {
			text: "Testing voice output",
			voice: "clyffy-default",
			slot: "voice.tts",
		});
		updateStep(2, { status: "passed", result: "TTS output succeeded" });
	} catch (e) {
		updateStep(2, { status: "failed", error: e instanceof Error ? e.message : String(e) });
	}

	// Step 4: chat.brain escalation
	updateStep(3, { status: "running" });
	try {
		const response = await testInference(
			"chat.brain",
			"Explain what DevPulse does in one sentence",
			128,
			0.7,
		);
		updateStep(3, { status: "passed", result: response.slice(0, 80) });
	} catch (e) {
		updateStep(3, { status: "failed", error: e instanceof Error ? e.message : String(e) });
	}

	// Step 5: API key check
	updateStep(4, { status: "running" });
	try {
		const { invoke } = await import("@tauri-apps/api/core");
		const statuses =
			await invoke<Array<{ provider: string; stored: boolean }>>("get_api_key_status");
		const hasKey = statuses.some((s) => s.stored);
		if (hasKey) {
			const stored = statuses.filter((s) => s.stored).map((s) => s.provider);
			updateStep(4, { status: "passed", result: `Keys stored: ${stored.join(", ")}` });
		} else {
			updateStep(4, { status: "skipped", result: "No API keys stored — skip" });
		}
	} catch (e) {
		updateStep(4, { status: "failed", error: e instanceof Error ? e.message : String(e) });
	}

	running = false;
}

function statusVariant(status: StepStatus): "positive" | "negative" | "neutral" | "informative" {
	switch (status) {
		case "passed":
			return "positive";
		case "failed":
			return "negative";
		case "running":
			return "informative";
		default:
			return "neutral";
	}
}
</script>

<div
	class={cn(box({ paddingX: "12", paddingY: "8" }), "rounded-lg w-full border")}
	style="background: var(--surface-base); border-color: var(--border-subtle);"
>
	<div class={stack({ gap: "4" })}>
		<div class={hstack({ gap: "3", align: "center", justify: "between" })}>
			<Text size="sm" weight="bold" color="primary">Full Pipeline Test</Text>
			<button
				class="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all disabled:opacity-40"
				style="background: var(--accent-teal-main); color: var(--surface-base);"
				onclick={runAllTests}
				disabled={running}
				aria-label="Run all pipeline tests"
			>
				<Play size={12} />
				{running ? "Running..." : "Run All Tests"}
			</button>
		</div>

		<Text size="xs" color="muted">
			Dev track: most tests will fail (stubs). Raw errors prove the plumbing works.
		</Text>

		<!-- Test steps -->
		<div class={stack({ gap: "2" })}>
			{#each testSteps as step, i (step.name)}
				<div class={hstack({ gap: "3", align: "center" })}>
					{#if step.status === "pending"}
						<span
							class="inline-block w-3 h-3 rounded-full border"
							style="border-color: var(--border-subtle);"
						></span>
					{:else if step.status === "running"}
						<LoaderCircle size={12} class="animate-spin" style="color: var(--accent-teal-main);" />
					{:else if step.status === "passed"}
						<Check size={12} style="color: var(--signal-success);" />
					{:else if step.status === "failed"}
						<TriangleAlert size={12} style="color: var(--signal-error);" />
					{:else}
						<span
							class="inline-block w-3 h-3 rounded-full"
							style="background: var(--text-muted);"
						></span>
					{/if}

					<Text size="xs" weight="bold" color="primary">{step.name}</Text>

					<Badge variant={statusVariant(step.status)} size="sm">
						{step.status}
					</Badge>

					{#if step.error}
						<Text size="xs" color="muted" class="flex-1 truncate">{step.error}</Text>
					{:else if step.result}
						<Text size="xs" color="muted" class="flex-1 truncate">{step.result}</Text>
					{/if}
				</div>
			{/each}
		</div>
	</div>
</div>
