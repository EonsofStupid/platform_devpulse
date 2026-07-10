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
import { Mic, Send } from "lucide-svelte";
import { Button } from "$lib/design/components/button/index.js";
import { TextField } from "$lib/design/components/text-field/index.js";
import { cssVarString, renderForge } from "$lib/design/renderforge/index.js";
import { cn } from "$lib/design/utils/cn.js";
import type { ChatFooterProps } from "./types.js";

let {
	onSend,
	onVoice,
	voiceActive = false,
	disabled = false,
	value: externalValue,
	onValueChange: externalOnValueChange,
	onInput,
	style,
	class: className,
	...rest
}: ChatFooterProps = $props();

// Uncontrolled fallback — only consulted when the parent did NOT supply
// `value` / `onValueChange`. Controlled-mode parents (e.g. ChatComposer
// with the suggestion surface) keep the source of truth themselves so
// the dropdown can inject accepted suggestions back into the input.
let internalValue = $state("");
const isControlled = $derived(externalValue !== undefined);
const currentValue = $derived(isControlled ? (externalValue ?? "") : internalValue);

function updateValue(next: string) {
	if (isControlled) {
		externalOnValueChange?.(next);
	} else {
		internalValue = next;
	}
	onInput?.(next);
}

function handleSend() {
	const trimmed = currentValue.trim();
	if (trimmed.length === 0) return;
	onSend?.(trimmed);
	updateValue("");
}

function handleKeydown(event: KeyboardEvent) {
	if (event.key === "Enter" && !event.shiftKey) {
		event.preventDefault();
		handleSend();
	}
}

// Mirrors the topbar's documented @defaults (same translucent dark band)
// until the pipeline emits the per-kind @styleIds layer.
const m = $derived(renderForge({ kind: "chat-footer", preset: "glass-deep" }));
</script>

<div
	role="form"
	aria-label="Send message"
	{...m.dataAttrs}
	data-slot="chat-footer"
	style={cssVarString(m.cssVars)}
	class={cn("flex items-center gap-3 px-4 py-3 min-h-16", className)}
	{...rest}
>
	<TextField
		placeholder="Type a message..."
		value={currentValue}
		onValueChange={updateValue}
		{disabled}
		onkeydown={handleKeydown}
		class="flex-1"
	/>
	<Button preset="primary" size="sm" onclick={handleSend} {disabled}>
		<Send size={16} />
	</Button>
	{#if onVoice}
		<Button
			preset={voiceActive ? "primary" : "ghost"}
			size="sm"
			aria-pressed={voiceActive}
			onclick={onVoice}
			{disabled}
		>
			<Mic size={16} />
		</Button>
	{/if}
</div>
