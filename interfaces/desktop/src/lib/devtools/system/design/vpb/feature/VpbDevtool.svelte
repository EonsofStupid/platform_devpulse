<!--
	@file VpbDevtool.svelte
	@module @devpulse/devtools/system/design/vpb

	The Visual Page Builder on `ServiceDevtoolShell`. The builder itself is
	mounted by the root layout for the Advanced display, over every window; this
	page shows its state in this window and opens it. On the Simple display it
	says so, and offers the switch, since nothing else on the page can work.
-->
<script lang="ts">
import { Button } from "@devpulse/coldlight/components/button";
import { Text } from "@devpulse/coldlight/components/text";
import type { HealthBadge } from "$lib/devtools/index.js";
import { ServiceDevtoolShell } from "$lib/devtools/index.js";
import { presentationState } from "$lib/domains/app/devpulse/index.js";
import { copyState, fill } from "$lib/sys/copy/index.js";
import { vpb, vpbDocument } from "$lib/sys/debug/vpb/state/index.js";

const text = $derived(copyState.catalog?.vpb);
const tree = $derived(vpbDocument.document.root);

const scanLabel = $derived(
	!vpb.scanActive
		? text?.status_ready
		: vpb.scanPaused
			? text?.status_paused
			: text?.status_scanning,
);

const badge = $derived<HealthBadge>(
	!presentationState.advanced
		? { state: "stopped", label: text?.devtool_needs_advanced_short ?? "" }
		: { state: vpb.scanActive ? "starting" : "up", label: scanLabel ?? "" },
);

function openPanel() {
	vpb.open();
	vpb.dock();
}

function startScan() {
	openPanel();
	vpb.startScan();
}
</script>

<ServiceDevtoolShell health={badge}>
	{#snippet status()}
		<div class="space-y-3">
			{#if !presentationState.advanced}
				<Text size="sm">{text?.devtool_needs_advanced}</Text>
				<Button size="sm" onclick={() => presentationState.setMode("advanced")}>
					{text?.devtool_turn_on_advanced}
				</Button>
			{:else}
				<Text size="sm">{fill(text?.block_count ?? "", { count: tree.length })}</Text>
				<Text size="sm">{scanLabel}</Text>
				<Text size="sm">{text?.devtool_where}</Text>
			{/if}
		</div>
	{/snippet}

	{#snippet actions()}
		<div class="flex flex-wrap gap-2">
			<Button size="sm" onclick={openPanel} disabled={!presentationState.advanced}>
				{text?.menu_open}
			</Button>
			<Button
				size="sm"
				variant="secondary"
				onclick={startScan}
				disabled={!presentationState.advanced}
			>
				{text?.menu_scan}
			</Button>
			<Button
				size="sm"
				variant="secondary"
				onclick={() => vpb.toggleWorkspace()}
				disabled={!presentationState.advanced}
			>
				{text?.open_workspace}
			</Button>
		</div>
	{/snippet}
</ServiceDevtoolShell>
