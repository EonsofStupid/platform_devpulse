<!--
	@file ScopedLogPanel
	@domain platform/_shared

	Uniform scoped-log tail used by every devtool's Logs tab. Calls
	`commands.queryScopedLog(target, limit)` and renders a compact
	timestamp / level / message table with a Refresh button.

	Every devtool picks a `target` string matching the `tracing` target
	its backend tags log events with — e.g. `devtools.surreal`,
	`devtools.cache`. When a service has no backend logs (library-only,
	aggregate-only), prefer omitting the `logs` snippet entirely over
	wiring this with a dead target.

	# Usage

	```svelte
	<script lang="ts">
import { ScopedLogPanel } from "$lib/devtools/index.js";
</script>

	<ServiceDevtoolShell …>
		{#snippet logs()}
			<ScopedLogPanel target="devtools.cache" />
		{/snippet}
	</ServiceDevtoolShell>
	```
-->
<script lang="ts">
	import { Button } from "$lib/design/components/button/index.js";
	import { Spinner } from "$lib/design/components/spinner/index.js";
	import { Text } from "$lib/design/components/text/index.js";
	import type { ScopedLogEntry } from "$lib/sys/generated/bindings.js";
	import { commands } from "$lib/sys/generated/bindings.js";

	interface Props {
		/** Tracing target filter — e.g. `devtools.surreal`. */
		target: string;
		/** Max rows to load. Defaults to 100. */
		limit?: number;
	}

	let { target, limit = 100 }: Props = $props();

	let entries = $state<ScopedLogEntry[]>([]);
	let loading = $state(false);
	let error = $state<string | null>(null);

	async function load(): Promise<void> {
		loading = true;
		error = null;
		try {
			const r = await commands.queryScopedLog(target, limit);
			if (r.status === "error") throw new Error(r.error);
			entries = r.data;
		} catch (e) {
			error = e instanceof Error ? e.message : String(e);
		} finally {
			loading = false;
		}
	}
</script>

<div class="space-y-3">
	<div class="flex items-center justify-between">
		<Text size="sm" weight="semibold">
			Scoped log — <span class="font-mono text-xs">{target}</span>
		</Text>
		<Button preset="ghost" size="sm" onclick={load} disabled={loading}>
			{#if loading}
				<Spinner size="xs" tone="accent" />
			{:else}
				Refresh
			{/if}
		</Button>
	</div>

	{#if error}
		<div class="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-xs text-red-400">
			{error}
		</div>
	{/if}

	{#if entries.length > 0}
		<div
			class="rounded-lg border border-[var(--border-subtle)] overflow-hidden max-h-80 overflow-y-auto"
		>
			<table class="w-full text-xs">
				<thead class="sticky top-0 bg-[var(--surface-raised)]">
					<tr class="border-b border-[var(--border-subtle)]">
						<th class="text-left px-2 py-1 font-medium text-[var(--text-secondary)]">Time</th>
						<th class="text-left px-2 py-1 font-medium text-[var(--text-secondary)]">Level</th>
						<th class="text-left px-2 py-1 font-medium text-[var(--text-secondary)]">Message</th>
					</tr>
				</thead>
				<tbody>
					{#each entries as line (line.timestamp + line.message)}
						<tr class="border-b border-[var(--border-subtle)]">
							<td class="px-2 py-1 font-mono text-xs text-[var(--text-secondary)]">
								{line.timestamp.slice(11, 19)}
							</td>
							<td class="px-2 py-1 font-mono text-xs">{line.level}</td>
							<td class="px-2 py-1 break-all">{line.message}</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{:else if loading}
		<Text size="sm" color="muted">Loading…</Text>
	{:else}
		<Text size="sm" color="muted">
			No entries yet — click Refresh to tail the current session log.
		</Text>
	{/if}
</div>
