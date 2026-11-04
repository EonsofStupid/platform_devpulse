<!--
	@file DevtoolLogsTab
	@domain platform/_shared

	Self-contained Logs-tab body. Owns:
	- WAI-ARIA APG `Tabs` (manual activation) for the target preset selector
	- `TauriQuery<ScopedLogEntry[], string>` instance (queryScopedLog)
	- Level color mapping (ERROR/WARN/INFO/DEBUG/other)
	- `DevtoolRefreshButton` bound to the query
	- `EmptyState` for no-data
	- `CommandErrorAlert` for failures (Result<T, string> wrapped)

	Replaces the per-devtool re-rolled Logs panels (Claude, STT, etc.).
	Supersedes `ScopedLogPanel.svelte` for consumers that need more than
	one target preset.

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
import { EmptyState } from "@devpulse/coldlight/components/empty-state";
import { Tabs, TabsList, TabsTrigger } from "@devpulse/coldlight/components/tabs";
import { Text } from "@devpulse/coldlight/components/text";
import { ScrollText } from "lucide-svelte";
import { untrack } from "svelte";
import { commands, type ScopedLogEntry } from "#lib/sys/generated/bindings.js";
import { TauriQuery } from "#lib/sys/runes/index.js";
import CommandErrorAlert from "./CommandErrorAlert.svelte";
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

<div class="flex flex-col gap-[var(--space-3)] h-full">
	<div class="flex items-center gap-[var(--space-2)] flex-wrap">
		<Tabs
			value={selectedTarget}
			onValueChange={(v) => {
				selectedTarget = v;
			}}
			activateOnFocus={false}
			loop
		>
			<TabsList class="flex flex-wrap gap-[var(--space-1)]">
				{#each targetPresets as opt (opt.value)}
					<TabsTrigger value={opt.value}>{opt.label}</TabsTrigger>
				{/each}
			</TabsList>
		</Tabs>
		<div class="ml-auto flex items-center gap-[var(--space-2)]">
			<Text size="xs" color="muted">{entries.length} entries</Text>
			<DevtoolRefreshButton query={logsQuery} />
		</div>
	</div>

	<CommandErrorAlert error={logsQuery.error} />

	{#if entries.length === 0 && !logsQuery.loading}
		<EmptyState>
			<div class="flex flex-col items-center gap-[var(--space-2)]">
				<ScrollText size={28} style="color: var(--text-muted);" />
				<Text size="sm" weight="semibold">No log entries match this filter</Text>
				<Text size="xs" color="muted">
					Activity in the Status / Actions tabs will appear here as it happens.
				</Text>
			</div>
		</EmptyState>
	{:else}
		<div
			class="flex-1 overflow-y-auto rounded-lg p-[var(--space-2)] font-mono text-xs leading-relaxed"
			style="background: var(--surface-base); border: var(--border-width-hairline) solid var(--border-subtle);"
		>
			{#each entries as entry, i (i)}
				<div
					class="flex gap-[var(--space-2)] py-[var(--space-1)] border-b border-[var(--border-subtle)] last:border-b-0"
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
