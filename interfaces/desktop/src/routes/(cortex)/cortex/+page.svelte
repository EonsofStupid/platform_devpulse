<!--
  @file Cortex Viewer
  @route /cortex
  @domain cortex

  Telemetry and devtools window.
  Rendered in a separate Tauri child window via open_window(CortexViewer).
  Shows network graph, model telemetry, session health.
-->
<script lang="ts">
import { invoke } from "@tauri-apps/api/core";
import { X } from "lucide-svelte";
import { Button } from "$lib/design/components/button/index.js";
import Card from "$lib/design/components/card/Card.svelte";
import Text from "$lib/design/components/text/Text.svelte";

function handleClose(): void {
	invoke("close_window", { label: "cortex-viewer" });
}
</script>

<div class="flex flex-col h-full">
	<header
		class="flex items-center justify-between h-10 px-4 border-b border-[var(--border-subtle)]"
		data-tauri-drag-region
	>
		<Text size="sm" weight="semibold" preset="default">CORTEX VIEWER</Text>
		<Button preset="ghost" size="sm" onclick={handleClose}>
			<X size={14} />
		</Button>
	</header>

	<main class="flex-1 overflow-y-auto p-4">
		<Card preset="glass-deep" class="p-6 flex flex-col items-center justify-center gap-4 h-full">
			<Text size="lg" weight="bold" preset="default">Cortex Network</Text>
			<Text size="sm" preset="default">Model telemetry, session health, and signal routing visualization.</Text>
			<Text size="xs" preset="default">Connect to the EventBridge to see live signals.</Text>
		</Card>
	</main>
</div>
