<!--
  @file Model Loader
  @route /model-loader
  @domain models

  Model slot management window.
  Rendered in a separate Tauri child window via open_window(ModelLoader).
  Scan models, assign to slots, monitor VRAM.
-->
<script lang="ts">
import { invoke } from "@tauri-apps/api/core";
import { X } from "lucide-svelte";
import { Button } from "$lib/design/components/button/index.js";
import Card from "$lib/design/components/card/Card.svelte";
import Text from "$lib/design/components/text/Text.svelte";

function handleClose(): void {
	invoke("close_window", { label: "model-loader" });
}
</script>

<div class="flex flex-col h-full">
	<header
		class="flex items-center justify-between h-10 px-4 border-b border-[var(--border-subtle)]"
		data-tauri-drag-region
	>
		<Text size="sm" weight="semibold" preset="default">MODEL CONTROL</Text>
		<Button preset="ghost" size="sm" onclick={handleClose}>
			<X size={14} />
		</Button>
	</header>

	<main class="flex-1 overflow-y-auto p-4">
		<Card preset="neuro-elevated" class="p-6 flex flex-col items-center justify-center gap-4 h-full">
			<Text size="lg" weight="bold" preset="default">Model Slots</Text>
			<Text size="sm" preset="default">Scan, load, and manage AI models across inference slots.</Text>
			<Text size="xs" preset="default">First run: scan your models directory to get started.</Text>
		</Card>
	</main>
</div>
