<!--
	@component TechnicalBootView
	Dev mode splashscreen — terminal-style raw event output.
	Shows every InitEvent with raw step names, latencies, and status symbols.
-->
<script lang="ts">
import { bootState } from "$lib/sys/runes/bootState.svelte.js";
import type { InitEvent } from "$lib/sys/generated/init.types.js";

function symbol(status: InitEvent["status"]): string {
	switch (status) {
		case "Running":
			return ">";
		case "Ok":
			return "+";
		case "Error":
			return "!";
		case "Skipped":
			return "-";
	}
}

function symbolClass(status: InitEvent["status"]): string {
	switch (status) {
		case "Running":
			return "status-running";
		case "Ok":
			return "status-ok";
		case "Error":
			return "status-error";
		case "Skipped":
			return "status-skipped";
	}
}

function formatLatency(ms: number | null): string {
	if (ms === null) return "";
	if (ms >= 1000) return `${(ms / 1000).toFixed(1)}s`;
	return `${ms}ms`;
}

function formatTotalElapsed(ms: number): string {
	if (ms >= 1000) return `${(ms / 1000).toFixed(1)}s total`;
	return `${ms}ms total`;
}

let logEl: HTMLDivElement | undefined = $state();

$effect(() => {
	// Auto-scroll on new events
	bootState.events.length;
	if (logEl) {
		logEl.scrollTop = logEl.scrollHeight;
	}
});
</script>

<div class="technical-boot">
	<header class="banner">
		<span class="title">DevPulse Platform v0.1.0</span>
	</header>

	<div class="log" bind:this={logEl}>
		<div class="section-header">--- Platform Boot ---</div>

		{#each bootState.events as event}
			<div class="log-line {symbolClass(event.status)}">
				<span class="bracket">[</span><span class="sym">{symbol(event.status)}</span><span class="bracket">]</span>
				<span class="step">{event.step}</span>
				{#if event.message}
					<span class="msg">({event.message})</span>
				{/if}
				{#if event.latency_ms !== null}
					<span class="latency">{formatLatency(event.latency_ms)}</span>
				{/if}
			</div>
		{/each}

		{#if bootState.currentStep}
			<div class="log-line status-running spinner-line">
				<span class="bracket">[</span><span class="sym spinner">...</span><span class="bracket">]</span>
				<span class="step">{bootState.currentStep}</span>
			</div>
		{/if}

		{#if bootState.complete}
			<div class="section-header">--- Ready ---</div>
			<div class="log-line status-ok">
				<span class="bracket">[</span><span class="sym">+</span><span class="bracket">]</span>
				<span class="step">Platform Healthy</span>
				<span class="latency">{formatTotalElapsed(bootState.totalLatencyMs)}</span>
			</div>
		{/if}
	</div>

	<footer class="footer">
		<span class="progress-text">{bootState.progress}%</span>
		{#if bootState.hasErrors}
			<span class="error-indicator">ERRORS DETECTED</span>
		{/if}
	</footer>
</div>

<style>
.technical-boot {
	display: flex;
	flex-direction: column;
	height: 100%;
	padding: 24px;
	font-family: "Cascadia Code", "Fira Code", "JetBrains Mono", monospace;
	font-size: 13px;
	line-height: 1.6;
}

.banner {
	margin-bottom: 16px;
}

.title {
	color: #7aa2f7;
	font-weight: 600;
	font-size: 14px;
}

.log {
	flex: 1;
	overflow-y: auto;
	scrollbar-width: thin;
	scrollbar-color: #2a2a3a #0a0a0f;
}

.section-header {
	color: #565f89;
	margin: 12px 0 4px;
}

.log-line {
	display: flex;
	align-items: baseline;
	gap: 6px;
	padding: 1px 0;
}

.bracket {
	color: #565f89;
}

.sym {
	font-weight: 700;
	min-width: 1ch;
}

.step {
	color: #c0caf5;
}

.msg {
	color: #565f89;
}

.latency {
	color: #7dcfff;
	margin-left: auto;
}

/* Status colors */
.status-running .sym { color: #e0af68; }
.status-ok .sym { color: #9ece6a; }
.status-error .sym { color: #f7768e; }
.status-skipped .sym { color: #565f89; }
.status-error .step { color: #f7768e; }

/* Spinner animation */
.spinner {
	animation: pulse 1s ease-in-out infinite;
}

@keyframes pulse {
	0%, 100% { opacity: 1; }
	50% { opacity: 0.3; }
}

.footer {
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding-top: 12px;
	border-top: 1px solid #1a1a2e;
	margin-top: 8px;
}

.progress-text {
	color: #565f89;
	font-size: 12px;
}

.error-indicator {
	color: #f7768e;
	font-weight: 600;
	font-size: 12px;
}
</style>
