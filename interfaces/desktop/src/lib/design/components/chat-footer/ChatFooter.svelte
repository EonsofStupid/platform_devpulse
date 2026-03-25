<!--
	@component Chat Footer
	@kind chat-footer
	@layer component
	@category interactive
	@description Input area with send and voice controls for the chat frame
	@container false
	@compound false
	@blockCategory form
	@defaultStyle chat-footer-default
	@styleIds chat-footer-default, chat-footer-stark, chat-footer-glass, chat-footer-flat, chat-footer-matte
	@requiredAxes backgroundColor, border, color, opacity
	@slots root:all
	@defaults {
		"background-color": "oklch(0.0901 0.017 224.61 / 0.6)",
		"color": "oklch(0.9319 0.015 224)",
		"border-color": "oklch(0.5106 0.0979 173.17 / 0.15)",
		"border-width": "0.0625rem 0 0 0"
	}
-->
<script lang="ts">
import { StyleMacro } from "$lib/design/styles/index.js";
import { cn } from "$lib/design/utils/cn.js";
import { TextField } from "$lib/design/components/text-field/index.js";
import { Button } from "$lib/design/components/button/index.js";
import { Send, Mic } from "lucide-svelte";
import type { ChatFooterProps } from "./types.js";

let {
	onSend,
	onVoice,
	voiceActive = false,
	disabled = false,
	style,
	class: className,
	...rest
}: ChatFooterProps = $props();

let inputValue = $state("");

const styleId = $derived(`chat-footer-${style ?? "default"}`);

function handleSend() {
	const trimmed = inputValue.trim();
	if (trimmed.length === 0) return;
	onSend?.(trimmed);
	inputValue = "";
}

function handleKeydown(event: KeyboardEvent) {
	if (event.key === "Enter" && !event.shiftKey) {
		event.preventDefault();
		handleSend();
	}
}
</script>

<StyleMacro kind="chat-footer" style={styleId}>
	<div
		role="form"
		aria-label="Send message"
		data-kind="chat-footer"
		data-slot="chat-footer"
		class={cn("flex items-center gap-2", className)}
		{...rest}
	>
		<TextField
			placeholder="Type a message..."
			value={inputValue}
			onValueChange={(v) => (inputValue = v)}
			{disabled}
			onkeydown={handleKeydown}
			class="flex-1"
		/>
		<Button intent="primary" size="sm" onclick={handleSend} {disabled}>
			<Send size={16} />
		</Button>
		{#if onVoice}
			<Button
				intent={voiceActive ? "primary" : "ghost"}
				size="sm"
				aria-pressed={voiceActive}
				onclick={onVoice}
				{disabled}
			>
				<Mic size={16} />
			</Button>
		{/if}
	</div>
</StyleMacro>
