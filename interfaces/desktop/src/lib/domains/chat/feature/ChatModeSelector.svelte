<!--
  @feature ChatModeSelector — vertical pill rail
-->
<script lang="ts">
import { chatState } from "../data-access/chat.state.svelte.js";
import { ModePill } from "../ui/index.js";
import type { ChatMode } from "../util/chat.types.js";

const modes: { id: ChatMode; label: string }[] = [
	{ id: "developer", label: "DEV" },
	{ id: "planning", label: "PLAN" },
	{ id: "image", label: "IMG" },
	{ id: "general", label: "GEN" },
];
</script>

<div class="flex flex-col gap-2 py-2" role="listbox" aria-label="Chat mode">
	{#each modes as m (m.id)}
		<ModePill
			mode={m.id}
			label={m.label}
			active={chatState.mode === m.id}
			onClick={() => chatState.setMode(m.id)}
		/>
	{/each}
</div>
