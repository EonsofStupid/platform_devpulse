<!--
	@component RroDevtool
	@kind clyffy.reasoning.rro.feature
	@layer feature
	@description Top-level RRO devtool. Composes ServiceDevtoolShell so
		the entire `/devtools/*` surface ships with a single chrome
		(header, accent backdrop, tab keyboard nav, Copy/Export + size
		guard) — RRO is no longer the one custom outlier.

	Tab mapping vs. legacy capability ids (locked):
	- Status  → live RRO state machine (`StatePanel`)
	- Config  → retrieval tuning + presets (`TuningPanel`)
	- Logs    → scoped `tracing` tail under `devtools.rro`
	- Actions → encoder load / swap / probe (`EncoderPanel`)
	- Debug   → search probe (`SearchPanel`) — power-user verbs
	- Extra   → "Knowledge Stores" (`CollectionsPanel`)

	Routes import ONLY this (via the domain index barrel).
-->
<script lang="ts">
import { Compass, Database } from "@lucide/svelte";
import {
	type ExtraTab,
	type HealthBadge,
	ScopedLogPanel,
	ServiceDevtoolShell,
} from "$lib/devtools/index.js";
import { rroState } from "$lib/sys/data-access/rro/rro.state.svelte.js";
import { captureForTab } from "../util/rro.capture.js";
import CollectionsPanel from "./panels/CollectionsPanel.svelte";
import EncoderPanel from "./panels/EncoderPanel.svelte";
import SearchPanel from "./panels/SearchPanel.svelte";
import StatePanel from "./panels/StatePanel.svelte";
import TuningPanel from "./panels/TuningPanel.svelte";

// Initial load fires once on mount — subscribes to event bridge.
$effect(() => {
	void rroState.initialLoad();
	return () => rroState.teardownRroState();
});

const extraTabs: ExtraTab[] = [{ id: "collections", label: "Knowledge Stores", Icon: Database }];

// ── Health badge ────────────────────────────────────────────
// Bound to two real signals:
//   1. Vector store reachability (health probe — gates retrieval).
//   2. RRO state machine status (idle / gathering / ready / …).
//
// Tone preference, worst → best:
//   • down       — vector store unreachable (no retrieval possible)
//   • degraded   — vector up but RRO purged / fork stale
//   • starting   — health probe in flight
//   • up         — vector up + RRO state ready / processing / ruminating
//   • stopped    — vector up + RRO idle
//   • unknown    — health unknown
const badge = $derived<HealthBadge>(
	rroState.healthLoading
		? { state: "starting", label: "Probing vector store…" }
		: rroState.health === null
			? rroState.healthError !== null
				? { state: "down", label: rroState.healthError }
				: { state: "unknown", label: "Health unknown" }
			: rroState.rroSnapshot === null
				? { state: "up", label: "Vector store reachable" }
				: badgeFromSnapshotState(rroState.rroSnapshot.state),
);

function badgeFromSnapshotState(
	state: NonNullable<typeof rroState.rroSnapshot>["state"],
): HealthBadge {
	switch (state) {
		case "idle":
			return { state: "stopped", label: "Idle — no active retrieval" };
		case "gathering":
			return { state: "up", label: "Gathering context" };
		case "processing":
			return { state: "up", label: "Processing context" };
		case "ruminating":
			return { state: "up", label: "Weighing alternatives" };
		case "ready":
			return { state: "up", label: "Ready" };
		case "purged":
			return { state: "degraded", label: "Context purged — re-run gather" };
		case "forked":
			return { state: "up", label: "Branched context active" };
	}
}
</script>

<ServiceDevtoolShell
	title="RRO Trifecta"
	description="Embedder + encoder + vector store · retrieval-rumination orchestrator"
	icon={Compass}
	axis="capabilities"
	accent="cyber"
	health={badge}
	{extraTabs}
	capture={captureForTab}
>
	{#snippet status()}
		<StatePanel />
	{/snippet}

	{#snippet config()}
		<TuningPanel />
	{/snippet}

	{#snippet logs()}
		<ScopedLogPanel target="devtools.rro" limit={100} />
	{/snippet}

	{#snippet actions()}
		<EncoderPanel />
	{/snippet}

	{#snippet debug()}
		<SearchPanel />
	{/snippet}

	{#snippet extra(tabId: string)}
		{#if tabId === "collections"}
			<CollectionsPanel />
		{/if}
	{/snippet}
</ServiceDevtoolShell>
