<!--
	@file DevtoolLogsTab
	@domain platform/_shared

	Self-contained Logs-tab body. Owns:
	- Target-preset selector (chips above the table)
	- `TauriQuery<ScopedLogEntry[], string>` instance (queryScopedLog)
	- Level color mapping (ERROR/WARN/INFO/DEBUG/other)
	- Refresh button via `DevtoolRefreshButton`
	- Empty state via `DevtoolEmptyState`
	- Error surface via `DevtoolErrorPanel`

	Replaces the per-devtool re-rolled Logs panels (Claude, STT, etc.).
	Supersedes `ScopedLogPanel.svelte` for any consumer that needs more
	than one target preset.

	# Usage

	```svelte
	<DevtoolLogsTab
		targetPresets={[
			{ value: "devtools.claude", label: "Devtool UI" },
			{ value: "claude", label: "Engine — Claude" },
			{ value: "mcp_stdio_server", label: "MCP subprocess" },
			{ value: "", label: "All targets" },
		]}
	/>
	```

	Single-preset usage (replaces ScopedLogPanel):

	```svelte
	<DevtoolLogsTab targetPresets={[{ value: "devtools.stt", label: "STT" }]} />
	```
-->
<script lang="ts">
import { ScrollText } from "lucide-svelte";
import { untrack } from "svelte";
import { Text } from "$lib/design/components/text/index.js";
import { commands, type ScopedLogEntry } from "$lib/sys/generated/bindings.js";
import { TauriQuery } from "$lib/sys/runes/index.js";
import DevtoolEmptyState from "./DevtoolEmptyState.svelte";
import DevtoolErrorPanel from "./DevtoolErrorPanel.svelte";
import DevtoolRefreshButton from "./DevtoolRefreshButton.svelte";

export interface LogTargetPreset {
	/** Tracing-target prefix passed to `queryScopedLog`. Empty = all targets. */
	value: string;
	/** Human label rendered on the chip. */
	label: string;
}

interface Props {
	targetPresets: readonly LogTargetPreset[];
	/** Initial preset value. Defaults to the first preset. */
	defaultTarget?: string;
	/** Tail length. Default 200. */
	limit?: number;
}

let { targetPresets, defaultTarget, limit = 200 }: Props = $props();

let selectedTarget = $state<string>(untrack(() => defaultTarget ?? targetPresets[0]?.value ?? ""));

const logsQuery = new TauriQuery<ScopedLogEntry[], string>(() =>
	commands.queryScopedLog(selectedTarget, limit),
);

let firstFetch = true;
$effect(() => {
	const _ = selectedTarget;
	if (firstFetch) {
		firstFetch = false;
		return;
	}
	void logsQuery.refresh();
});

function levelColor(level: string): string {
	switch (level) {
		case "ERROR":
			return "var(--signal-error)";
		case "WARN":
			return "var(--signal-warning)";
		case "INFO":
			return "var(--signal-success)";
		case "DEBUG":
			return "var(--accent-purple-main)";
		default:
			return "var(--text-muted)";
	}
}

const entries = $derived(logsQuery.data ?? []);
</script>

<div class="flex flex-col gap-3 h-full">
	<div class="flex items-center gap-2 flex-wrap">
		<Text size="xs" color="muted">Target:</Text>
		{#each targetPresets as opt (opt.value)}
			<button
				type="button"
				class="rounded-md px-2 py-1 text-xs transition-colors"
				style={selectedTarget === opt.value
					? "background: var(--accent-teal-fill); color: var(--accent-teal-main); border: var(--border-width-hairline) solid var(--accent-teal-main);"
					: "background: var(--surface-base); color: var(--text-muted); border: var(--border-width-hairline) solid var(--border-subtle);"}
				onclick={() => {
					selectedTarget = opt.value;
				}}
			>
				{opt.label}
			</button>
		{/each}
		<div class="ml-auto flex items-center gap-2">
			<Text size="xs" color="muted">{entries.length} entries</Text>
			<DevtoolRefreshButton query={logsQuery} />
		</div>
	</div>

	<DevtoolErrorPanel error={logsQuery.error} />

	{#if entries.length === 0 && !logsQuery.loading}
		<DevtoolEmptyState
			icon={ScrollText}
			title="No log entries match this filter"
			description="Activity in the Status / Actions tabs will appear here as it happens."
		/>
	{:else}
		<div
			class="flex-1 overflow-y-auto rounded-lg p-2 font-mono text-xs leading-relaxed"
			style="background: var(--surface-base); border: var(--border-width-hairline) solid var(--border-subtle);"
		>
			{#each entries as entry, i (i)}
				<div
					class="flex gap-2 py-0.5 border-b border-[var(--border-subtle)] last:border-b-0"
				>
					<span style="color: var(--text-muted);">{entry.timestamp.slice(11, 19)}</span>
					<span style={`color: ${levelColor(entry.level)}; min-width: 3.5rem;`}>
						{entry.level}
					</span>
					<span
						style="color: var(--accent-teal-main); min-width: 12rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;"
					>
						{entry.target}
					</span>
					<span style="color: var(--text-primary); flex: 1; word-break: break-word;">
						{entry.message}
					</span>
				</div>
			{/each}
		</div>
	{/if}
</div>
