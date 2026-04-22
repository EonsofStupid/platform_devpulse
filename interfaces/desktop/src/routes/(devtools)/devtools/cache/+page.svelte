<!--
	@file /devtools/cache — Moka in-memory cache devtool
	@route /devtools/cache

	Wired against the real `cache_health` Tauri command. Moka is
	non-persistent (RAM-only), so there's no "list keys" or "clear all"
	surface — those would misrepresent Moka's TTL-driven behavior.
-->
<script lang="ts">
import { invoke } from "@tauri-apps/api/core";
import { Database, RefreshCw } from "lucide-svelte";
import { Badge } from "$lib/design/components/badge/index.js";
import { Button } from "$lib/design/components/button/index.js";
import { Text } from "$lib/design/components/text/index.js";
import { type HealthBadge, ServiceDevtoolShell } from "$lib/domains/platform/index.js";

// Local type — replaced by the generated binding on the next
// `cargo xtask run-dev` (tauri-specta regenerates bindings.ts).
interface CacheHealthDto {
	reachable: boolean;
	latency_us: number;
	error: string | null;
}

let health = $state<CacheHealthDto | null>(null);
let refreshing = $state(false);
let error = $state<string | null>(null);

const badge = $derived<HealthBadge>(
	health === null
		? { state: "unknown", label: "Checking…" }
		: health.reachable
			? {
					state: "up",
					label: `Moka · ${(health.latency_us / 1000).toFixed(2)} ms ping`,
				}
			: {
					state: "down",
					label: health.error ?? "Unreachable",
				},
);

async function refresh(): Promise<void> {
	refreshing = true;
	error = null;
	try {
		health = await invoke<CacheHealthDto>("cache_health");
	} catch (e) {
		error = e instanceof Error ? e.message : String(e);
	} finally {
		refreshing = false;
	}
}

$effect(() => {
	void refresh();
});
</script>

<ServiceDevtoolShell
	title="Cache"
	description="In-memory Moka store · non-persistent · TTL-driven"
	icon={Database}
	axis="stores"
	health={badge}
>
	{#snippet status()}
		<div class="space-y-3">
			<div class="flex items-center justify-between">
				<Text size="sm" weight="bold">
					{health?.reachable ? "Service booted" : "Service down"}
				</Text>
				<Button preset="button-ghost" size="sm" onclick={refresh} disabled={refreshing}>
					<RefreshCw size={12} />
					Refresh
				</Button>
			</div>

			{#if health?.reachable}
				<div class="rounded-lg p-3" style="background: var(--surface-base); border: 1px solid var(--border-subtle);">
					<div class="flex items-center gap-2 mb-1">
						<Badge variant="positive" size="sm">Reachable</Badge>
						<Text size="xs" color="muted">
							ping → {(health.latency_us / 1000).toFixed(2)} ms
						</Text>
					</div>
					<Text size="xs" color="muted">
						Moka is a non-persistent TTL-indexed cache. Keys and values are
						not inspectable by design — devtools show health only.
					</Text>
				</div>
			{:else if health}
				<div class="rounded-lg p-3" style="background: var(--signal-error-subtle, #3b1a1a); border: 1px solid var(--signal-error);">
					<Text size="sm">{health.error ?? "Unreachable"}</Text>
				</div>
			{/if}
		</div>
	{/snippet}

	{#snippet config()}
		<Text size="sm" color="muted">
			Cache capacity + TTL are configured in
			<span class="font-mono text-[10px]">
				config/platform/services/system/cache.toml
			</span>
			(max entries, time-to-live). Changes apply at boot.
			TODO(reality-gap 2026-04-21): live reconfiguration wires up with
			<code>cache_save_config</code>.
		</Text>
	{/snippet}

	{#snippet logs()}
		<Text size="sm" color="muted">
			Cache doesn't emit per-entry logs by design (TTL-driven, too noisy).
			Aggregate hit/miss counters live in the platform telemetry lane —
			see the telemetry devtool for that surface.
		</Text>
	{/snippet}

	{#snippet actions()}
		<div class="space-y-2">
			<Text size="sm" color="muted">
				Moka is a library cache, not a standalone service — there's no
				start/stop/restart verb. A "clear all entries" verb wires up with
				<code>cache_clear</code> in a follow-up sprint.
			</Text>
			<div class="flex gap-2 opacity-50">
				<Button preset="default" size="sm" disabled>Clear all (not wired)</Button>
			</div>
		</div>
	{/snippet}
</ServiceDevtoolShell>

{#if error}
	<div
		class="fixed bottom-4 right-4 rounded p-3 text-sm"
		style="background: var(--signal-error-subtle, #3b1a1a); border: 1px solid var(--signal-error); color: var(--text-primary); max-width: 30rem;"
	>
		{error}
	</div>
{/if}
