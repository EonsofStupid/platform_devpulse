<!--
	@component StoreHeroCard
	@module @devpulse/devtools/system/datastores/_shared

	Large hero card that gives each datastore (DuckDB / Turso /
	SurrealDB / Qdrant) its own visual identity. Renders as the top
	element in the Status snippet so the operator's first impression
	is "this store is X, in Y health, with Z activity right now."

	## Composition slots

	- **Default slot** — drop a per-store hero visualization here
	  (animated columns for DuckDB, ripple-grid for Turso,
	  node-graph for SurrealDB). The card frames it with consistent
	  padding + accent edge; the slot owns the unique character.
	- **`syncChip`** — sync-status pill (synced / syncing / queued / paused).
	  Optional — omit until the sync subsystem is wired.

	## Identity and accent

	The card is part of a store's devtool page, and that page's route
	folder names and draws it (plan 0008): the name from the page's copy,
	the icon from its `_nav`. The accent is the shell's
	(`--accent-service-main`, set by `ServiceDevtoolShell` from the
	page's `_devtool.accent`), so the card and the shell always agree.
	It drives the left-edge stripe, the icon tint, and the subtle
	gradient on the background.
-->
<script lang="ts">
import type { Snippet } from "svelte";
import { Text } from "$lib/design/components/text/index.js";
import { routeCopy, routeHere } from "$lib/sys/routing/index.js";
import HealthSignal from "./HealthSignal.svelte";
import LiveActivityPulse from "./LiveActivityPulse.svelte";

type HealthState = "up" | "starting" | "degraded" | "down" | "unknown";

interface Props {
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
	/** Hero visualization — the per-store unique character. */
	children?: Snippet;
	/** Optional sync-status chip (Phase 1.4 — wire when sync subsystem lands). */
	syncChip?: Snippet;
}

let {
	purpose,
	health,
	latencyMs = null,
	healthLabel = undefined,
	activityTick = 0,
	children = undefined,
	syncChip = undefined,
}: Props = $props();

/** The store's page: its name and icon. */
const here = $derived(routeHere());
const name = $derived(here ? routeCopy(here)?.label : undefined);
const Icon = $derived(here?.nav.icon);
</script>

<div class="hero-card">
	<div class="accent-stripe"></div>

	<div class="hero-body">
		<div class="header">
			<div class="icon-tile">
				{#if Icon}
					<Icon size={28} class="hero-icon" />
				{/if}
			</div>
			<div class="header-text">
				<div class="name-row">
					<Text size="lg" weight="bold">{name}</Text>
					<HealthSignal state={health} latencyMs={latencyMs} label={healthLabel} />
				</div>
				<Text size="sm" color="muted">{purpose}</Text>
			</div>
			<div class="header-trailing">
				<LiveActivityPulse {activityTick} accentVar="--accent-service-main" />
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
		/* The shell's accent, set from the page's `_devtool.accent`. */
		--store-accent: var(--accent-service-main);
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
