<!--
  @feature ChatComposer — footer row + voice orb + type-time suggestions
-->
<script lang="ts">
import { Button } from "@devpulse/coldlight/components/button";
import { ChatFooter } from "@devpulse/coldlight/components/chat-footer";
import { Text } from "@devpulse/coldlight/components/text";
import { copyState } from "$lib/sys/copy/index.js";
import type { Suggestion } from "$lib/sys/generated/bindings.js";
import { agentsState } from "../data-access/agents.state.svelte.js";
import { chatState } from "../data-access/chat.state.svelte.js";
import { roomsState } from "../data-access/rooms.state.svelte.js";
import { suggestState } from "../data-access/suggest.state.svelte.js";
import SuggestionDropdown from "./SuggestionDropdown.svelte";
import VoiceOrb from "./VoiceOrb.svelte";

// Controlled-mode input value: ChatComposer holds the source of truth so
// the suggestion dropdown can inject an accepted suggestion back into
// the chat input. Without this, ChatFooter would own the value
// internally and the dropdown could not write to it.
let draft = $state("");

function handleInput(next: string): void {
	suggestState.queryDebounced(next);
}

function handleValueChange(next: string): void {
	draft = next;
}

function handleAccept(s: Suggestion): void {
	draft = s.text;
	suggestState.clear();
}

function handleSend(content: string): void {
	const trimmed = content.trim();
	if (trimmed.length === 0) return;
	void chatState.generateResponse(trimmed);
	void suggestState.record(trimmed);
	suggestState.clear();
}

function handleKeydown(e: KeyboardEvent): void {
	if (suggestState.suggestions.length === 0) return;
	if (e.key === "ArrowDown") {
		e.preventDefault();
		suggestState.move(1);
	} else if (e.key === "ArrowUp") {
		e.preventDefault();
		suggestState.move(-1);
	} else if (e.key === "Tab") {
		const current = suggestState.currentSuggestion();
		if (current) {
			e.preventDefault();
			handleAccept(current);
		}
	} else if (e.key === "Escape") {
		e.preventDefault();
		suggestState.clear();
	}
}
</script>

{#if copyState.catalog && chatState.readOnly}<Text size="xs">{copyState.catalog.chat.endpoints.read_only}</Text>{/if}
{#if copyState.catalog && chatState.canStopEndpoint}<Button size="sm" variant="secondary" onclick={() => void chatState.stopEndpoint()}>{copyState.catalog.chat.endpoints.stop}</Button>{/if}
<div
	role="presentation"
	onkeydowncapture={handleKeydown}
	class="flex items-stretch gap-2 border-t border-[var(--border-subtle)] pt-2"
>
	<div class="relative min-w-0 flex-1">
		<SuggestionDropdown onAccept={handleAccept} />
		<ChatFooter
			value={draft}
			onValueChange={handleValueChange}
			onInput={handleInput}
			onSend={handleSend}
			disabled={chatState.loading || !chatState.routingReady || chatState.readOnly || chatState.sending || chatState.isGenerating || !!agentsState.running(chatState.activeSessionId) || roomsState.answering(chatState.activeSessionId)}
		/>
	</div>
	<div class="flex items-center pr-2">
		<VoiceOrb />
	</div>
</div>
