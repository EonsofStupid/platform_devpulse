<!--
	@file VPB — Visual Page Builder Root Shell
	@layer vpb
	@package @devpulse/sys

	Three-panel advanced overlay: palette (left), canvas (center), properties (right).
-->
<script lang="ts">
import { untrack } from "svelte";
import VpbCanvas from "./panels/VpbCanvas.svelte";
import VpbConnectionBadge from "./panels/VpbConnectionBadge.svelte";
import VpbPalette from "./panels/VpbPalette.svelte";
import VpbProperties from "./panels/VpbProperties.svelte";
import VpbToolbar from "./panels/VpbToolbar.svelte";
import { loadAutoSave } from "./persistence/local-storage.js";
import { vpbConnection } from "./state/vpb-connection.svelte.js";
import { vpbDocument } from "./state/vpb-document.svelte.js";
import { vpbVisual } from "./state/vpb-visual.svelte.js";
import "./vpb.css";

let { open = $bindable(false) }: { open?: boolean } = $props();
let viewMode = $state<"preview" | "graph">("preview");

$effect(() => {
	if (open) {
		vpbConnection.init();
		// Untracked: the options landing must not re-run this and reload the autosave.
		void untrack(() => vpbVisual.init());
		const saved = loadAutoSave();
		if (saved) {
			try {
				vpbDocument.load(saved);
			} catch {
				// Schema drift — start fresh
			}
		}
	}
});
</script>

{#if open}
	<div class="vpb-shell">
		<VpbToolbar bind:open bind:viewMode />
		<VpbConnectionBadge />
		<div class="vpb-layout">
			<aside class="vpb-panel vpb-panel--palette">
				<VpbPalette />
			</aside>
			<main class="vpb-panel vpb-panel--canvas">
				<VpbCanvas {viewMode} />
			</main>
			<aside class="vpb-panel vpb-panel--properties">
				<VpbProperties />
			</aside>
		</div>
	</div>
{/if}

<style>
	.vpb-shell {
		position: fixed;
		inset: 0;
		z-index: 9999;
		display: flex;
		flex-direction: column;
		background: var(--vpb-bg);
		backdrop-filter: blur(20px);
		color: var(--text-primary, #e0e0e0);
		font-family: var(--font-sans, system-ui, sans-serif);
		font-size: 13px;
	}
	.vpb-layout {
		display: grid;
		grid-template-columns: 260px 1fr 300px;
		flex: 1;
		overflow: hidden;
	}
	.vpb-panel {
		overflow-y: auto;
		border-right: 1px solid var(--vpb-btn-hover);
	}
	.vpb-panel--properties {
		border-right: none;
		border-left: 1px solid var(--vpb-btn-hover);
	}
	.vpb-panel--canvas {
		border-right: none;
	}
</style>
