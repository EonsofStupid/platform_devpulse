<!--
	@component TechnicalBootView
	Advanced display's boot screen — terminal-style raw event output.
	Shows every InitEvent with raw step names, latencies, and status symbols.
	Rendered by BootOverlay while the platform starts. ColdLight's Log keeps to
	the newest line until you scroll away.
-->
<script lang="ts">
import { Log, type LogLine } from "@devpulse/coldlight/components/log";
import { Text } from "@devpulse/coldlight/components/text";
import { copyState, fill } from "#lib/sys/copy/index.js";
import type { InitEvent } from "#lib/sys/generated/bindings.js";
import { platformState } from "#lib/sys/runes/platformState.svelte.js";
import { formatLatency } from "./boot-format.js";

const copy = $derived(copyState.catalog?.hubs.boot);

function symbol(status: InitEvent["status"]): string {
	switch (status) {
		case "Running":
			return "[>]";
		case "Ok":
			return "[+]";
		case "Error":
			return "[!]";
		case "Skipped":
			return "[-]";
	}
}

function line(event: InitEvent, id: number): LogLine {
	const message = event.message ? ` (${event.message})` : "";
	const latency = event.latency_us === null ? "" : `  ${formatLatency(event.latency_us)}`;
	return {
		id,
		source: symbol(event.status),
		level: event.status === "Error" ? "error" : undefined,
		text: `${event.step}${message}${latency}`,
	};
}

const lines = $derived.by((): LogLine[] => {
	const events = platformState.bootEvents.map(line);
	const running = platformState.currentStep;
	const out: LogLine[] = [{ id: "boot", text: copy?.section_boot ?? "" }, ...events];
	if (running) out.push({ id: "running", source: "[...]", text: running });
	if (platformState.isReady) {
		out.push(
			{ id: "ready", text: copy?.section_ready ?? "" },
			{
				id: "healthy",
				source: "[+]",
				text: `${copy?.platform_healthy ?? ""}  ${fill(copy?.total ?? "", {
					elapsed: formatLatency(platformState.totalLatencyUs),
				})}`,
			},
		);
	}
	return out;
});
</script>

<div class="flex h-[70vh] w-full flex-col gap-3" data-slot="technical-boot">
	<header>
		<Text as="div" size="sm" weight="semibold" class="font-mono" data-text-glow="teal">
			{fill(copy?.title ?? "", { version: platformState.appVersion ?? "" })}
		</Text>
	</header>

	<Log class="min-h-0 flex-1" {lines} label={copy?.log_label} />

	<footer class="flex items-center justify-between">
		<Text size="sm" color="muted" class="font-mono">{platformState.progress}%</Text>
		{#if platformState.hasSubsystemFailure}
			<span class="font-mono font-semibold" data-slot="errors">{copy?.errors_detected}</span>
		{/if}
	</footer>
</div>

<style>
	[data-slot="errors"] {
		font-size: var(--font-size-sm);
		color: var(--signal-error);
	}
</style>
