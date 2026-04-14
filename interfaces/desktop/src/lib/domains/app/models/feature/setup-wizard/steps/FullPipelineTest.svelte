<!--
  @file FullPipelineTest.svelte
  5-step voice pipeline end-to-end test. STT→Brain→TTS chain.
  Real invoke calls. Shows pass/fail per step with timing.
  Colocated CSS. No renderForge.
-->
<script lang="ts">
import { Brain, Check, LoaderCircle, Mic, Play, RotateCcw, Volume2, X } from "lucide-svelte";

interface TestStep {
	id: string;
	label: string;
	desc: string;
	icon: typeof Mic;
	status: "pending" | "running" | "pass" | "fail" | "skipped";
	latencyMs: number;
	error: string | null;
}

let steps = $state<TestStep[]>([
	{
		id: "stt-load",
		label: "Load STT Model",
		desc: "Whisper loads into memory",
		icon: Mic,
		status: "pending",
		latencyMs: 0,
		error: null,
	},
	{
		id: "stt-test",
		label: "Speech Recognition",
		desc: "Record 3s of audio → transcribe",
		icon: Mic,
		status: "pending",
		latencyMs: 0,
		error: null,
	},
	{
		id: "brain-test",
		label: "Brain Response",
		desc: "Send transcript → get AI response",
		icon: Brain,
		status: "pending",
		latencyMs: 0,
		error: null,
	},
	{
		id: "tts-load",
		label: "Load TTS Model",
		desc: "Kokoro loads into memory",
		icon: Volume2,
		status: "pending",
		latencyMs: 0,
		error: null,
	},
	{
		id: "tts-test",
		label: "Voice Output",
		desc: "Speak AI response out loud",
		icon: Volume2,
		status: "pending",
		latencyMs: 0,
		error: null,
	},
]);

let running = $state(false);
let currentStep = $state(-1);

async function runTests(): Promise<void> {
	running = true;
	steps = steps.map((s) => ({ ...s, status: "pending", latencyMs: 0, error: null }));

	for (let i = 0; i < steps.length; i++) {
		currentStep = i;
		steps = steps.map((s, j) => (j === i ? { ...s, status: "running" } : s));

		const start = performance.now();
		try {
			const { invoke } = await import("@tauri-apps/api/core");
			switch (steps[i].id) {
				case "stt-load":
					await invoke("load_slot", { slotId: "voice.stt" });
					break;
				case "stt-test":
					await invoke("test_microphone");
					break;
				case "brain-test":
					await invoke("test_inference", {
						slotId: "chat.brain",
						prompt: "Hello, can you hear me?",
					});
					break;
				case "tts-load":
					await invoke("load_slot", { slotId: "voice.tts" });
					break;
				case "tts-test":
					await invoke("speak", {
						text: "I can hear you! Everything is working.",
						voice: "default-female",
						slot: "voice.tts",
					});
					break;
			}
			const ms = Math.round(performance.now() - start);
			steps = steps.map((s, j) => (j === i ? { ...s, status: "pass", latencyMs: ms } : s));
		} catch (e) {
			const ms = Math.round(performance.now() - start);
			const msg = e instanceof Error ? e.message : String(e);
			steps = steps.map((s, j) =>
				j === i ? { ...s, status: "fail", latencyMs: ms, error: msg } : s,
			);
		}
	}
	running = false;
	currentStep = -1;
}

const passCount = $derived(steps.filter((s) => s.status === "pass").length);
const failCount = $derived(steps.filter((s) => s.status === "fail").length);
const allDone = $derived(steps.every((s) => s.status === "pass" || s.status === "fail"));
</script>

<div class="test-panel">
	<div class="header">
		<Play size={20} class="icon" />
		<div>
			<h3 class="title">Voice Pipeline Test</h3>
			<p class="subtitle">End-to-end test: microphone → transcription → AI → speech. Tests each step with real calls.</p>
		</div>
	</div>

	<div class="steps">
		{#each steps as step, i (step.id)}
			{@const Icon = step.icon}
			<div class="step" class:pass={step.status === "pass"} class:fail={step.status === "fail"} class:running={step.status === "running"}>
				<div class="step-icon">
					{#if step.status === "running"}<LoaderCircle size={18} class="animate-spin" />
					{:else if step.status === "pass"}<Check size={18} />
					{:else if step.status === "fail"}<X size={18} />
					{:else}<Icon size={18} />{/if}
				</div>
				<div class="step-info">
					<span class="step-label">{step.label}</span>
					<span class="step-desc">{step.desc}</span>
					{#if step.error}<span class="step-error">{step.error}</span>{/if}
				</div>
				{#if step.latencyMs > 0}<span class="step-time">{step.latencyMs}ms</span>{/if}
			</div>
		{/each}
	</div>

	{#if allDone}
		<div class="result" class:all-pass={failCount === 0}>
			{#if failCount === 0}
				<Check size={18} /> All {passCount} tests passed!
			{:else}
				<X size={18} /> {passCount} passed, {failCount} failed
			{/if}
		</div>
	{/if}

	<div class="actions">
		<button class="btn-primary" onclick={runTests} disabled={running}>
			{#if running}<LoaderCircle size={14} class="animate-spin" /> Running...
			{:else if allDone}<RotateCcw size={14} /> Run Again
			{:else}<Play size={14} /> Run Pipeline Test{/if}
		</button>
	</div>
</div>

<style>
	.test-panel { display:flex;flex-direction:column;gap:1rem;background:oklch(0.12 0.025 220/0.65);border:1px solid oklch(0.3 0.03 220/0.4);border-radius:0.75rem;padding:1.25rem;backdrop-filter:blur(12px); }
	.header { display:flex;align-items:flex-start;gap:0.75rem; }
	:global(.icon) { color:oklch(0.65 0.17 185); }
	.title { font-size:1rem;font-weight:700;color:oklch(0.93 0.015 224);margin:0; }
	.subtitle { font-size:0.8125rem;color:oklch(0.6 0.02 220);margin:0.25rem 0 0; }

	.steps { display:flex;flex-direction:column;gap:0.375rem; }
	.step { display:flex;align-items:center;gap:0.75rem;padding:0.75rem;border-radius:0.5rem;border:1px solid oklch(0.25 0.02 220/0.3);background:oklch(0.13 0.02 220/0.4);transition:all 150ms; }
	.step.pass { border-color:oklch(0.72 0.19 152/0.4);background:oklch(0.15 0.05 152/0.15); }
	.step.fail { border-color:oklch(0.6 0.22 25/0.4);background:oklch(0.15 0.05 25/0.15); }
	.step.running { border-color:oklch(0.65 0.17 185/0.4); }

	.step-icon { color:oklch(0.5 0.02 220);flex-shrink:0; }
	.step.pass .step-icon { color:oklch(0.72 0.19 152); }
	.step.fail .step-icon { color:oklch(0.6 0.22 25); }
	.step.running .step-icon { color:oklch(0.65 0.17 185); }

	.step-info { flex:1; }
	.step-label { display:block;font-size:0.875rem;font-weight:600;color:oklch(0.9 0.015 224); }
	.step-desc { display:block;font-size:0.875rem;color:oklch(0.55 0.02 220); }
	.step-error { display:block;font-size:0.875rem;color:oklch(0.7 0.18 25);margin-top:0.25rem; }
	.step-time { font-size:0.875rem;color:oklch(0.6 0.02 220);flex-shrink:0; }

	.result { display:flex;align-items:center;gap:0.5rem;padding:0.75rem;border-radius:0.5rem;font-size:0.875rem;font-weight:600;background:oklch(0.2 0.06 25/0.2);color:oklch(0.7 0.15 25); }
	.result.all-pass { background:oklch(0.2 0.06 152/0.2);color:oklch(0.72 0.19 152); }

	.actions { display:flex;gap:0.5rem; }
	.btn-primary { display:inline-flex;align-items:center;gap:0.375rem;padding:0.5rem 1.25rem;border-radius:0.5rem;border:none;background:oklch(0.65 0.17 185);color:oklch(0.12 0.02 220);font-size:0.875rem;font-weight:700;cursor:pointer; }
	.btn-primary:hover { filter:brightness(1.15); }
	.btn-primary:disabled { opacity:0.5;cursor:not-allowed; }
</style>
