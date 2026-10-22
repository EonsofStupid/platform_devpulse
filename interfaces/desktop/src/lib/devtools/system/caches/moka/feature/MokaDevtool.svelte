<!--
	@file MokaDevtool.svelte
	@module @devpulse/devtools/system/caches/moka

	Wired against the real `cache_health` Tauri command. Moka is
	non-persistent (RAM-only), so there's no "list keys" or "clear all"
	surface — those would misrepresent Moka's TTL-driven behavior.
-->
<script lang="ts">
import { Badge } from "@devpulse/coldlight/components/badge";
import { Button } from "@devpulse/coldlight/components/button";
import { InlineMessage } from "@devpulse/coldlight/components/inline-message";
import { Text } from "@devpulse/coldlight/components/text";
import { invoke } from "@tauri-apps/api/core";
import { RefreshCw } from "lucide-svelte";
import { onMount } from "svelte";
import { type HealthBadge, ScopedLogPanel, ServiceDevtoolShell } from "$lib/devtools/index.js";

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

// Mount-load — `$effect` would re-fire on `refreshing` flag flips inside refresh().
onMount(() => {
	void refresh();
});
</script>

<ServiceDevtoolShell
	health={badge}
>
	{#snippet status()}
		<div class="space-y-3">
			<div class="flex items-center justify-between">
				<Text size="sm" weight="bold">
					{health?.reachable ? "Service booted" : "Service down"}
				</Text>
				<Button variant="ghost" size="sm" onclick={refresh} disabled={refreshing}>
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
				<InlineMessage tone="error">{health.error ?? "Unreachable"}</InlineMessage>
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
		<ScopedLogPanel target="devtools.cache" />
	{/snippet}

	{#snippet actions()}
		<div class="space-y-3">
			<Text size="sm" color="muted">
				Moka is non-persistent and TTL-driven. There's no "clear all"
				surface — entries evict on their own as their TTLs expire.
				Actions here cover refresh + a probe-style ping.
			</Text>
			<div class="rounded-lg p-3" style="background: var(--surface-base); border: 1px solid var(--border-subtle);">
				<div class="flex items-center justify-between mb-2">
					<Text size="sm" weight="bold">Re-ping cache</Text>
					<Button variant="primary" size="sm" onclick={refresh} disabled={refreshing}>
						<RefreshCw size={12} />
						Re-ping
					</Button>
				</div>
				<Text size="xs" color="muted">
					Calls <code>cache_health</code> on the kernel and reloads
					latency. Use this when adjacent surfaces (RRO retrieval, hot
					cache hits) report unexpected staleness.
				</Text>
			</div>
		</div>
	{/snippet}

	{#snippet debug()}
		<div class="space-y-3">
			<Text size="sm" color="muted">
				Power-user probes. The cache is opaque by design (no key
				inspection), so debug is health-only — round-trip latency tells
				you whether the cache process is responsive.
			</Text>
			<div class="rounded-lg p-3" style="background: var(--surface-base); border: 1px solid var(--border-subtle);">
				<Text size="sm" weight="bold" class="block mb-2">Last ping</Text>
				{#if health}
					<div class="text-xs space-y-1">
						<div class="flex justify-between">
							<span style="color: var(--text-secondary)">Reachable</span>
							<span class="font-mono">{health.reachable ? "yes" : "no"}</span>
						</div>
						<div class="flex justify-between">
							<span style="color: var(--text-secondary)">Latency</span>
							<span class="font-mono">{(health.latency_us / 1000).toFixed(2)} ms</span>
						</div>
						{#if health.error}
							<div class="text-red-400 break-all mt-1">{health.error}</div>
						{/if}
					</div>
				{:else}
					<Text size="xs" color="muted">No ping yet. Refresh in Status.</Text>
				{/if}
			</div>
		</div>
	{/snippet}
</ServiceDevtoolShell>

{#if error}
	<div class="moka-devtool__error-toast" role="alert">
		<InlineMessage tone="error">{error}</InlineMessage>
	</div>
{/if}

<style>
	.moka-devtool__error-toast {
		position: fixed;
		bottom: var(--space-12);
		right: var(--space-12);
		max-width: 30rem;
		z-index: 50;
	}
</style>
