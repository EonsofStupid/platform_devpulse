<!--
  @file Voice Lab
  @route /voice-lab
  @domain voice

  TTS/STT configuration devtool window.
  Rendered in a separate Tauri child window via open_window(VoiceLab).
  Configure voices, test microphone, manage voice profiles.
-->
<script lang="ts">
import { invoke } from "@tauri-apps/api/core";
import { X } from "lucide-svelte";
import { Button } from "$lib/design/components/button/index.js";
import { Tabs } from "$lib/design/components/tabs/index.js";
import Text from "$lib/design/components/text/Text.svelte";
import { VoiceLabPanel } from "$lib/domains/app/voice/index.js";

function handleClose(): void {
	invoke("close_window", { label: "voice-lab" });
}
</script>

<div class="flex flex-col h-full">
	<header
		class="flex items-center justify-between h-10 px-4 border-b border-[var(--border-subtle)]"
		data-tauri-drag-region
	>
		<Text size="sm" weight="semibold" preset="default">VOICE LAB</Text>
		<Button preset="ghost" size="sm" onclick={handleClose}>
			<X size={14} />
		</Button>
	</header>

	<main class="flex-1 overflow-y-auto">
		<VoiceLabPanel />
	</main>
</div>
