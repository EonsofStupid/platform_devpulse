<!--
  @file src/lib/sys/debug/vpb/shell/frame.svelte
  @layer vpb

  VPB main frame container, the root of the Visual Page Builder.
  Renders Builder and Inspector components based on active tab, the V icon
  when minimized (from VPBPanel, deleted in ac05e977), the scan overlay and the
  floating element inspector over the running app, and the full-window builder
  (`Vpb.svelte`), which shares its document.

  The root layout mounts this for the Advanced display.
  Ctrl+Shift+B opens and closes the full-window builder.

  @since 1.0.0
-->
<script lang="ts">
import { Tabs, TabsContent } from "@devpulse/coldlight/components/tabs";
import { onDestroy, untrack } from "svelte";
import Builder from "../components/builder/Builder.svelte";
import Inspector from "../components/inspector/Inspector.svelte";
import ScanOverlay from "../components/inspector/ScanOverlay.svelte";
import { scan } from "../components/inspector/state.svelte.js";
import VPBInspector from "../components/inspector/VpbInspector.svelte";
import VPBIcon from "../components/VpbIcon.svelte";
import VPBToolbar from "../components/VpbToolbar.svelte";
import { loadAutoSave } from "../persistence/local-storage.js";
import { vpb } from "../state/vpb.svelte.js";
import { vpbDocument } from "../state/vpb-document.svelte.js";
import { vpbVisual } from "../state/vpb-visual.svelte.js";
import "../components/styles/index.css";
import VpbTabs from "./tabs.svelte";
import Toolbar from "./toolbar.svelte";
import Topbar from "./topbar.svelte";

// The full-window builder loads the first time it is asked for: it brings the graph view.
const workspace = $derived(vpb.workspaceOpen ? import("../Vpb.svelte") : null);

// The Inspector's fields need the token manifest and the last saved document.
$effect(() => {
	if (vpb.isOpen && vpb.mode !== "minimized") {
		untrack(() => {
			void vpbVisual.init();
			if (vpbDocument.dirty || vpbDocument.document.root.length > 0) return;
			const saved = loadAutoSave();
			if (saved) vpbDocument.load(saved);
		});
	}
});

function onKeydown(e: KeyboardEvent) {
	if (e.ctrlKey && e.shiftKey && e.key === "B") {
		e.preventDefault();
		vpb.toggleWorkspace();
	}
}

// Leaving the Advanced display unmounts this; nothing keeps scanning.
onDestroy(() => {
	vpb.workspaceOpen = false;
	vpb.stopScan();
	scan.reset();
});
</script>

<svelte:window onkeydown={onKeydown} />

{#if vpb.isOpen}
	{#if vpb.mode === "minimized"}
		<VPBIcon />
	{:else}
		<div
			class="fixed flex flex-col overflow-hidden"
			data-kind="vpb"
			data-slot="root"
			data-mode={vpb.mode}
			data-dragging={vpb.isDragging}
			data-state={vpb.scanActive ? "scanning" : "idle"}
			style:width="{vpb.size.width}px"
			style:height="{vpb.size.height}px"
			style:left={vpb.mode === "floating" ? `${vpb.position.x}px` : undefined}
			style:top={vpb.mode === "floating" ? `${vpb.position.y}px` : undefined}
		>
			<Tabs
				class="flex flex-col flex-1 min-h-0"
				value={vpb.activeTab}
				onValueChange={(value) => vpb.setTab(value === "builder" ? "builder" : "inspector")}
			>
				<!-- Header Zone (Draggable) -->
				<div class="vpb-panel__header flex flex-col">
					<Topbar />
					<VpbTabs />
				</div>

				<!-- Scan controls -->
				<div class="vpb-panel__toolbar">
					<VPBToolbar />
				</div>

				<!-- Content Zone -->
				<div class="vpb-panel__content flex-1 overflow-hidden relative">
					<TabsContent class="h-full" value="inspector">
						<Inspector />
					</TabsContent>
					<TabsContent class="h-full" value="builder">
						<Builder />
					</TabsContent>
				</div>
			</Tabs>

			<!-- Footer Zone -->
			<Toolbar />
		</div>
	{/if}
{/if}

<ScanOverlay />
<VPBInspector />

{#if workspace}
	{#await workspace then { default: Workspace }}
		<Workspace bind:open={vpb.workspaceOpen} />
	{/await}
{/if}
