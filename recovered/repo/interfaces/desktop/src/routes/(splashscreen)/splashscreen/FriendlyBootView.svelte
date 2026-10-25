<!--
	@component FriendlyBootView
	Production mode splashscreen — clean, professional loading screen.
	Shows friendly names, progress bar, status indicators.
-->
<script lang="ts">
import { bootState } from "$lib/sys/runes/bootState.svelte.js";
import { friendlyLabel, bootMessage, FRIENDLY_LABELS } from "./boot-labels.js";

interface StepDisplay {
	step: string;
	label: string;
	status: "waiting" | "running" | "done" | "error" | "skipped";
}

// Build display list from known steps + any unknown steps that appear
const steps = $derived.by((): StepDisplay[] => {
	// Start with all known steps in order
	const knownSteps = Object.keys(FRIENDLY_LABELS);
	const seenSteps = new Set(bootState.events.map((e) => e.step));

	const display: StepDisplay[] = [];

	for (const step of knownSteps) {
		const events = bootState.events.filter((e) => e.step === step);
		const lastEvent = events.length > 0 ? events[events.length - 1] : null;

		let status: StepDisplay["status"] = "waiting";
		if (lastEvent) {
			switch (lastEvent.status) {
				case "Ok":
					status = "done";
					break;
				case "Error":
					status = "error";
					break;
				case "Skipped":
					status = "skipped";
					break;
				case "Running":
					status = "running";
					break;
			}
		}

		display.push({ step, label: friendlyLabel(step), status });
	}

	// Add any unknown steps that appeared
	for (const step of seenSteps) {
		if (!knownSteps.includes(step)) {
			const events = bootState.events.filter((e) => e.step === step);
			const lastEvent = events[events.length - 1];
			let status: StepDisplay["status"] = "waiting";
			if (lastEvent.status === "Ok") status = "done";
			else if (lastEvent.status === "Error") status = "error";
			else if (lastEvent.status === "Running") status = "running";
			else if (lastEvent.status === "Skipped") status = "skipped";
			display.push({ step, label: friendlyLabel(step), status });
		}
	}

	return display;
});

function statusIndicator(status: StepDisplay["status"]): string {
	switch (status) {
		case "done":
			return "\u2713";
		case "running":
			return "\u25FC";
		case "error":
			return "\u2717";
		case "skipped":
			return "\u2014";
		case "waiting":
			return "\u25CB";
	}
}

function statusLabel(status: StepDisplay["status"]): string {
	switch (status) {
		case "done":
			return "Ready";
		case "running":
			return "Starting up...";
		case "error":
			return "Failed";
		case "skipped":
			return "Skipped";
		case "waiting":
			return "Waiting";
	}
}
</script>

<div class="friendly-boot">
	<header class="header">
		<h1 class="wordmark">DevPulse</h1>
	</header>

	<div class="steps">
		{#each steps as step}
			<div class="step-row {step.status}">
				<span class="indicator">{statusIndicator(step.status)}</span>
				<span class="label">{step.label}</span>
				<span class="status-text">{statusLabel(step.status)}</span>
			</div>
		{/each}
	</div>

	<div class="progress-section">
		<div class="progress-track">
			<div class="progress-fill" style="width: {bootState.progress}%"></div>
		</div>
		<span class="progress-percent">{bootState.progress}%</span>
	</div>

	<footer class="footer">
		<p class="message">{bootMessage(bootState.progress, bootState.hasErrors)}</p>
		{#if bootState.hasErrors && bootState.error}
			<p class="error-detail">{bootState.error}</p>
		{/if}
	</footer>
</div>

<style>
.friendly-boot {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	height: 100%;
	padding: 48px 64px;
	gap: 32px;
}

.header {
	text-align: center;
}

.wordmark {
	font-size: 28px;
	font-weight: 700;
	color: #c0caf5;
	letter-spacing: 0.05em;
	margin: 0;
}

.steps {
	width: 100%;
	max-width: 360px;
	display: flex;
	flex-direction: column;
	gap: 12px;
}

.step-row {
	display: flex;
	align-items: center;
	gap: 12px;
	font-size: 14px;
}

.indicator {
	width: 20px;
	text-align: center;
	font-size: 16px;
}

.label {
	flex: 1;
	color: #c0caf5;
}

.status-text {
	color: #565f89;
	font-size: 13px;
}

/* Status colors */
.step-row.done .indicator { color: #9ece6a; }
.step-row.done .status-text { color: #9ece6a; }

.step-row.running .indicator {
	color: #e0af68;
	animation: pulse 1.2s ease-in-out infinite;
}
.step-row.running .status-text { color: #e0af68; }

.step-row.error .indicator { color: #f7768e; }
.step-row.error .label { color: #f7768e; }
.step-row.error .status-text { color: #f7768e; }

.step-row.skipped .indicator { color: #565f89; }
.step-row.skipped .label { color: #565f89; }

.step-row.waiting .indicator { color: #3b3b52; }
.step-row.waiting .label { color: #565f89; }

@keyframes pulse {
	0%, 100% { opacity: 1; }
	50% { opacity: 0.4; }
}

.progress-section {
	width: 100%;
	max-width: 360px;
	display: flex;
	align-items: center;
	gap: 12px;
}

.progress-track {
	flex: 1;
	height: 4px;
	background: #1a1a2e;
	border-radius: 2px;
	overflow: hidden;
}

.progress-fill {
	height: 100%;
	background: #7aa2f7;
	border-radius: 2px;
	transition: width 0.3s ease;
}

.progress-percent {
	color: #565f89;
	font-size: 13px;
	min-width: 36px;
	text-align: right;
}

.footer {
	text-align: center;
}

.message {
	color: #565f89;
	font-size: 14px;
	margin: 0;
}

.error-detail {
	color: #f7768e;
	font-size: 12px;
	margin: 8px 0 0;
}
</style>
