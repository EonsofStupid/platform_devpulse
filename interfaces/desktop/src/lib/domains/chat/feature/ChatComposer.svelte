<!--
  @feature ChatComposer — footer row + voice orb
-->
<script lang="ts">
import { ChatFooter } from "$lib/design/components/chat-footer/index.js";
import { chatState } from "../data-access/chat.state.svelte.js";
import VoiceOrb from "./VoiceOrb.svelte";
</script>

<div class="flex items-stretch gap-2 border-t border-[var(--border-subtle)] pt-2">
	<div class="min-w-0 flex-1">
		<ChatFooter onSend={(c) => void chatState.generateResponse(c)} disabled={chatState.sending || chatState.isGenerating} />
	</div>
	<div class="flex items-center pr-2">
		<VoiceOrb />
	</div>
</div>
