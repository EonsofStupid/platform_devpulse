<!--
	@component RroDevtool
	@kind sys.rro.feature
	@layer feature
	@description Top-level RRO devtool orchestrator. Capability-driven tabs.

	Routes import ONLY this (via the domain index barrel). Everything else
	is an implementation detail of the sys/rro domain.
-->
<script lang="ts">
import {
	Activity,
	ArrowLeft,
	Brain,
	Check,
	Compass,
	Copy,
	Database,
	Download,
	Search,
	Settings2,
	Shapes,
} from "lucide-svelte";
import type { Component } from "svelte";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "$lib/design/components/tabs/index.js";
import { Text } from "$lib/design/components/text/index.js";
import { SERVICE_ACCENTS, serviceAccentStyle } from "$lib/domains/platform/_shared/index.js";
import { rroState } from "../data-access/rro.state.svelte.js";
import type { Capability } from "../util/rro.capabilities.js";
import { RRO_CAPABILITIES } from "../util/rro.capabilities.js";
import { captureForTab } from "../util/rro.capture.js";
import type { RroTabId } from "../util/rro.types.js";
import BrainPanel from "./panels/BrainPanel.svelte";
import CollectionsPanel from "./panels/CollectionsPanel.svelte";
import EncoderPanel from "./panels/EncoderPanel.svelte";
import SearchPanel from "./panels/SearchPanel.svelte";
import StatePanel from "./panels/StatePanel.svelte";
import TuningPanel from "./panels/TuningPanel.svelte";

// Static icon lookup — keeps the capability manifest string-only.
const ICON_MAP: Record<Capability["icon"], Component<{ size?: number; class?: string }>> = {
	search: Search,
	settings: Settings2,
	database: Database,
	brain: Brain,
	shapes: Shapes,
	activity: Activity,
};

const PANEL_MAP: Record<RroTabId, Component> = {
	state: StatePanel,
	search: SearchPanel,
	tuning: TuningPanel,
	collections: CollectionsPanel,
	brain: BrainPanel,
	encoder: EncoderPanel,
};

// Initial load fires once on mount — subscribes to event bridge.
$effect(() => {
	void rroState.initialLoad();
	// Tear down the listener when the component unmounts.
	return () => rroState.teardownRroState();
});

// Brain loads lazily on first tab visit — saves a boot-time round-trip.
$effect(() => {
	if (rroState.activeTab === "brain" && !rroState.brainHealth && !rroState.brainLoading) {
		void rroState.loadBrain();
	}
});

// ── Capture (Copy / Export) ─────────────────────────────────
/** 256 KiB ceiling — above this Copy is disabled, Export remains. Matches
 *  the shell-level guard in `ServiceDevtoolShell` so RRO behaves the same
 *  way despite running its own custom chrome. */
const SIZE_GUARD_BYTES = 256 * 1024;
const currentCapture = $derived(captureForTab(rroState.activeTab));
const captureBytes = $derived(currentCapture ? currentCapture.content.length : 0);
const captureTooLarge = $derived(captureBytes > SIZE_GUARD_BYTES);
let copiedAt = $state<number | null>(null);
const copiedRecently = $derived(copiedAt !== null && Date.now() - copiedAt < 1500);

function formatBytes(n: number): string {
	if (n < 1024) return `${n} B`;
	if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KiB`;
	return `${(n / (1024 * 1024)).toFixed(1)} MiB`;
}

async function handleCopy(): Promise<void> {
	if (!currentCapture || captureTooLarge) return;
	try {
		await navigator.clipboard.writeText(currentCapture.content);
		copiedAt = Date.now();
		setTimeout(() => {
			if (copiedAt !== null && Date.now() - copiedAt >= 1500) copiedAt = null;
		}, 1600);
	} catch (err) {
		// Clipboard write can fail in non-secure contexts or under permission policy —
		// surface to the console; UI just won't flash "Copied".
		console.error("RroDevtool: clipboard write failed", err);
	}
}

function handleExport(): void {
	if (!currentCapture) return;
	const blob = new Blob([currentCapture.content], { type: currentCapture.mime });
	const url = URL.createObjectURL(blob);
	const a = document.createElement("a");
	a.href = url;
	a.download = currentCapture.filename;
	document.body.appendChild(a);
	a.click();
	document.body.removeChild(a);
	URL.revokeObjectURL(url);
}

// ── Keyboard nav (Ctrl+1..6 jumps capability tabs) ──────────
function handleKeydown(event: KeyboardEvent): void {
	if (!event.ctrlKey && !event.metaKey) return;
	const index = Number.parseInt(event.key, 10);
	if (Number.isNaN(index) || index < 1 || index > RRO_CAPABILITIES.length) return;
	event.preventDefault();
	rroState.setTab(RRO_CAPABILITIES[index - 1].id);
}
</script>

<svelte:window onkeydown={handleKeydown} />

<div class="flex flex-col h-full" style={serviceAccentStyle(SERVICE_ACCENTS.rro)}>
	<!-- Header -->
	<header class="flex items-center gap-3 h-10 px-4 border-b border-[var(--border-subtle)]">
		<a href="/devtools" class="hover:text-[var(--accent-service-main)]">
			<ArrowLeft size={14} />
		</a>
		<Compass size={16} class="text-[var(--accent-service-main)]" />
		<Text size="sm" weight="semibold">Search Tuning</Text>
		<Text size="xs">How Clyffy finds things in your stored knowledge.</Text>

		{#if currentCapture}
			<div class="ml-auto flex items-center gap-1">
				<button
					type="button"
					class="rro-cap-btn"
					aria-label={captureTooLarge
						? `Copy disabled — payload is ${formatBytes(captureBytes)}, above the 256 KiB clipboard guard. Use Export.`
						: copiedRecently
							? "Copied"
							: `Copy ${formatBytes(captureBytes)} to clipboard`}
					title={captureTooLarge
						? `Payload is ${formatBytes(captureBytes)} — above 256 KiB. Use Export instead.`
						: copiedRecently
							? "Copied!"
							: `Copy (${formatBytes(captureBytes)})`}
					disabled={captureTooLarge}
					onclick={handleCopy}
				>
					{#if copiedRecently}
						<Check size={12} />
						<span>Copied</span>
					{:else}
						<Copy size={12} />
						<span>Copy</span>
					{/if}
				</button>
				<button
					type="button"
					class="rro-cap-btn"
					aria-label={`Export ${currentCapture.filename} (${formatBytes(captureBytes)})`}
					title={`Export ${currentCapture.filename}`}
					onclick={handleExport}
				>
					<Download size={12} />
					<span>Export</span>
				</button>
			</div>
		{/if}
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

<style>
	.rro-cap-btn {
		display: inline-flex;
		align-items: center;
		gap: 0.25rem;
		padding: 0.1875rem 0.5rem;
		font-size: var(--font-size-xs);
		border-radius: 0.25rem;
		background: transparent;
		border: var(--border-width-hairline) solid var(--border-subtle);
		color: var(--text-secondary);
		cursor: pointer;
		transition:
			color 150ms ease-out,
			border-color 150ms ease-out,
			background 150ms ease-out;
	}

	.rro-cap-btn:hover:not(:disabled) {
		color: var(--accent-service-main);
		border-color: var(--accent-service-main);
		background: var(--accent-service-fill);
	}

	.rro-cap-btn:focus-visible {
		outline: var(--border-width-thin) solid var(--accent-service-main);
		outline-offset: var(--space-2);
	}

	.rro-cap-btn:disabled {
		cursor: not-allowed;
		opacity: 0.5;
	}
</style>
