<!--
	@component RroDevtool
	@kind sys.rro.feature
	@layer feature
	@description Top-level RRO devtool orchestrator. Capability-driven tabs.

	Routes import ONLY this (via the domain index barrel). Everything else
	is an implementation detail of the sys/rro domain.
-->
<script lang="ts">
import { ArrowLeft, Brain, Compass, Database, Search, Settings2, Shapes } from "lucide-svelte";
import type { Component } from "svelte";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "$lib/design/components/tabs/index.js";
import { Text } from "$lib/design/components/text/index.js";
import { rroState } from "../data-access/rro.state.svelte.js";
import type { Capability } from "../util/rro.capabilities.js";
import { RRO_CAPABILITIES } from "../util/rro.capabilities.js";
import type { RroTabId } from "../util/rro.types.js";
import BrainPanel from "./panels/BrainPanel.svelte";
import CollectionsPanel from "./panels/CollectionsPanel.svelte";
import EncoderPanel from "./panels/EncoderPanel.svelte";
import SearchPanel from "./panels/SearchPanel.svelte";
import TuningPanel from "./panels/TuningPanel.svelte";

// Static icon lookup — keeps the capability manifest string-only.
const ICON_MAP: Record<Capability["icon"], Component<{ size?: number; class?: string }>> = {
	search: Search,
	settings: Settings2,
	database: Database,
	brain: Brain,
	shapes: Shapes,
};

const PANEL_MAP: Record<RroTabId, Component> = {
	search: SearchPanel,
	tuning: TuningPanel,
	collections: CollectionsPanel,
	brain: BrainPanel,
	encoder: EncoderPanel,
};

// Initial load fires once on mount.
$effect(() => {
	void rroState.initialLoad();
});

// Brain loads lazily on first tab visit — saves a boot-time round-trip.
$effect(() => {
	if (rroState.activeTab === "brain" && !rroState.brainHealth && !rroState.brainLoading) {
		void rroState.loadBrain();
	}
});
</script>

<div class="flex flex-col h-full">
	<!-- Header -->
	<header class="flex items-center gap-3 h-10 px-4 border-b border-[var(--border-subtle)]">
		<a href="/devtools" class="hover:text-[var(--color-teal-400)]">
			<ArrowLeft size={14} />
		</a>
		<Compass size={16} class="text-[var(--color-teal-400)]" />
		<Text size="sm" weight="semibold">Search Tuning</Text>
		<Text size="xs">How Clyffy finds things in your stored knowledge.</Text>
	</header>

	<!-- Tabs — driven by capability manifest -->
	<Tabs
		value={rroState.activeTab}
		onValueChange={(v) => rroState.setTab(v as RroTabId)}
		preset="default"
	>
		<TabsList class="flex border-b border-[var(--border-subtle)]">
			{#each RRO_CAPABILITIES as cap}
				{@const Icon = ICON_MAP[cap.icon]}
				<TabsTrigger
					value={cap.id}
					class="flex items-center gap-1.5 px-3 py-2 text-xs"
					title={cap.tagline}
				>
					<Icon size={14} />
					{cap.label}
				</TabsTrigger>
			{/each}
		</TabsList>

		{#each RRO_CAPABILITIES as cap}
			{@const Panel = PANEL_MAP[cap.id]}
			<TabsContent value={cap.id} class="flex-1 overflow-y-auto p-4 space-y-3">
				<Panel />
			</TabsContent>
		{/each}
	</Tabs>
</div>
