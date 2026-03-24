<!--
	@component Chat Input
	@kind chat-input
	@layer block
	@category interactive
	@description Chat message input with send and voice buttons
	@container false
	@compound true
	@blockCategory form
	@defaultStyle text-field-default
	@styleIds text-field-default
	@requiredAxes backgroundColor, border, borderRadius
	@slots root:all
-->
<script lang="ts">
import { Send, Mic } from "lucide-svelte";
import Button from "$lib/design/components/button/Button.svelte";
import TextField from "$lib/design/components/text-field/TextField.svelte";
import { cn } from "$lib/design/utils/cn.js";
import type { ChatInputProps } from "./types.js";

let {
	placeholder = "Type a message...",
	onSend,
	onVoice,
	voiceActive = false,
	disabled = false,
	class: className,
}: ChatInputProps = $props();

let inputValue = $state("");

function handleSend(): void {
	if (!inputValue.trim() || disabled) return;
	onSend?.(inputValue.trim());
	inputValue = "";
}

function handleKeydown(e: KeyboardEvent): void {
	if (e.key === "Enter" && !e.shiftKey) {
		e.preventDefault();
		handleSend();
	}
}
</script>

<div
	data-kind="chat-input"
	data-slot="root"
	class={cn("flex items-center gap-2 px-3 py-2", className)}
>
	<TextField
		value={inputValue}
		oninput={(e) => { inputValue = e.currentTarget.value; }}
		{placeholder}
		{disabled}
		onkeydown={handleKeydown}
		class="flex-1"
	/>
	<Button
		intent="primary"
		size="sm"
		{disabled}
		onclick={handleSend}
		aria-label="Send message"
	>
		<Send size={16} />
	</Button>
	{#if onVoice}
		<Button
			intent={voiceActive ? "danger" : "ghost"}
			size="sm"
			onclick={onVoice}
			aria-label={voiceActive ? "Stop voice" : "Start voice"}
		>
			<Mic size={16} />
		</Button>
	{/if}
</div>
