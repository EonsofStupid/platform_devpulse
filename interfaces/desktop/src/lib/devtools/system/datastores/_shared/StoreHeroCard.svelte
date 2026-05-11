<!--
	@component StoreHeroCard
	@module @devpulse/devtools/system/datastores/_shared

	Large hero card that gives each datastore (DuckDB / libSQL /
	SurrealDB / Qdrant) its own visual identity. Renders as the top
	element in the Status snippet so the operator's first impression
	is "this store is X, in Y health, with Z activity right now."

	## Composition slots

	- **Default slot** — drop a per-store hero visualization here
	  (animated columns for DuckDB, ripple-grid for libSQL,
	  node-graph for SurrealDB). The card frames it with consistent
	  padding + accent edge; the slot owns the unique character.
	- **`syncChip`** — sync-status pill (synced / syncing / queued / paused).
	  Optional — omit until the sync subsystem is wired.

	## Accent contract

	`accentVar` drives the left-edge stripe, the icon tint, and the
	subtle gradient on the background. Convention:
	- `--accent-amber` — DuckDB (analytical / warm)
	- `--accent-cyan` — libSQL (clean / relational)
	- `--accent-purple` — SurrealDB (graph / vibrant)

	The accent should match the store's devtool accent on
	`ServiceDevtoolShell` so the hero card and the shell agree.
-->
<script lang="ts">
import type { Component, Snippet } from "svelte";
import { Text } from "$lib/design/components/text/index.js";
import HealthSignal from "./HealthSignal.svelte";
import LiveActivityPulse from "./LiveActivityPulse.svelte";

type HealthState = "up" | "starting" | "degraded" | "down" | "unknown";

interface Props {
	/** Lucide icon component for this store. */
	icon: Component<{ size?: number; class?: string }>;
	/** Display name (e.g. "DuckDB", "libSQL", "SurrealDB"). */
	name: string;
	/** One-line layman purpose ("Columnar analytics engine", "Relational
	 *  rows for system + user state", "Graph + document multi-model"). */
	purpose: string;
	/** Health state from the store's probe. */
	health: HealthState;
	/** Optional latency reading from the latest probe. */
	latencyMs?: number | null;
	/** Optional short health label ("Online", "Probing…", "Unreachable"). */
	healthLabel?: string;
	/** Live activity tick — bump on each observed read/write event. */
	activityTick?: number;
	/** Accent CSS variable. Defaults to the platform's electric accent
	 *  so callers that haven't picked yet still render coherently. */
	accentVar?: string;
	/** Hero visualization — the per-store unique character. */
	children?: Snippet;
	/** Optional sync-status chip (Phase 1.4 — wire when sync subsystem lands). */
	syncChip?: Snippet;
}

let {
	icon: Icon,
	name,
	purpose,
	health,
	latencyMs = null,
	healthLabel = undefined,
	activityTick = 0,
	accentVar = "--accent-electric",
	children = undefined,
	syncChip = undefined,
}: Props = $props();
</script>

<div class="hero-card" style={`--store-accent: var(${accentVar});`}>
	<div class="accent-stripe"></div>

	<div class="hero-body">
		<div class="header">
			<div class="icon-tile">
				<Icon size={28} class="hero-icon" />
			</div>
			<div class="header-text">
				<div class="name-row">
					<Text size="lg" weight="bold">{name}</Text>
					<HealthSignal state={health} latencyMs={latencyMs} label={healthLabel} />
				</div>
				<Text size="sm" color="muted">{purpose}</Text>
			</div>
			<div class="header-trailing">
				<LiveActivityPulse {activityTick} {accentVar} />
				{#if syncChip}
					{@render syncChip()}
				{/if}
			</div>
		</div>

		{#if children}
			<div class="hero-viz">
				{@render children()}
			</div>
		{/if}
	</div>
</div>

<style>
	.hero-card {
		position: relative;
		display: flex;
		border-radius: 0.625rem;
		overflow: hidden;
		background: linear-gradient(
			135deg,
			var(--surface-raised) 0%,
			color-mix(in oklch, var(--store-accent) 4%, var(--surface-raised)) 100%
		);
		border: 1px solid color-mix(in oklch, var(--store-accent) 25%, var(--border-subtle));
		box-shadow: 0 0.125rem 0.75rem color-mix(in oklch, var(--store-accent) 8%, transparent);
	}
	.accent-stripe {
		width: 0.25rem;
		background: linear-gradient(
			180deg,
			var(--store-accent) 0%,
			color-mix(in oklch, var(--store-accent) 60%, transparent) 100%
		);
		flex-shrink: 0;
	}
	.hero-body {
		flex: 1;
		padding: 1rem 1.25rem;
		display: flex;
		flex-direction: column;
		gap: 0.875rem;
		min-width: 0;
	}
	.header {
		display: flex;
		align-items: flex-start;
		gap: 0.875rem;
	}
	.icon-tile {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 3rem;
		height: 3rem;
		border-radius: 0.5rem;
		background: color-mix(in oklch, var(--store-accent) 12%, transparent);
		border: 1px solid color-mix(in oklch, var(--store-accent) 28%, transparent);
		flex-shrink: 0;
	}
	:global(.hero-icon) {
		color: var(--store-accent);
	}
	.header-text {
		flex: 1;
		min-width: 0;
		display: flex;
		flex-direction: column;
		gap: 0.125rem;
	}
	.name-row {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		flex-wrap: wrap;
	}
	.header-trailing {
		display: flex;
		flex-direction: column;
		align-items: flex-end;
		gap: 0.375rem;
		flex-shrink: 0;
	}
	.hero-viz {
		padding-top: 0.25rem;
		border-top: 1px solid color-mix(in oklch, var(--store-accent) 12%, transparent);
	}
</style>
