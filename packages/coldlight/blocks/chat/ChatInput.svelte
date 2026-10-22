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
import { Mic, Send } from "lucide-svelte";
import Button from "#coldlight/components/button/Button.svelte";
import TextField from "#coldlight/components/text-field/TextField.svelte";
import { cn } from "#coldlight/utils/cn.js";
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
		oninput={(e) => { inputValue = (e.currentTarget as HTMLInputElement).value; }}
		{placeholder}
		{disabled}
		onkeydown={handleKeydown}
		class="flex-1"
	/>
	<Button
		variant="primary"
		size="sm"
		{disabled}
		onclick={handleSend}
		aria-label="Send message"
	>
		<Send class="size-icon-sm" />
	</Button>
	{#if onVoice}
		<Button
			variant={voiceActive ? "danger" : "ghost"}
			size="sm"
			onclick={onVoice}
			aria-label={voiceActive ? "Stop voice" : "Start voice"}
		>
			<Mic class="size-icon-sm" />
		</Button>
	{/if}
</div>
