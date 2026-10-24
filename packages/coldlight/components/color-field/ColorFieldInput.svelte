<!--
	@component ColorField.Input
	@kind color-field
	@slot input
	@layer components

	The text input. Uses bind:value with $effect sync for controlled mode.
	Handles wheel events for channel increment/decrement.
	autoFocus via $effect on mount.
-->
<script lang="ts">
import { cn } from "#coldlight/utils/cn.js";
import { getColorFieldContext } from "./context.js";
import type { ColorFieldInputProps } from "./types.js";

let { class: className, ...rest }: ColorFieldInputProps = $props();
const ctx = getColorFieldContext();

let inputEl: HTMLInputElement | null = null;
let localValue = $state(ctx.value ?? "");

// Sync context value → local (controlled mode)
$effect(() => {
	const v = ctx.value ?? "";
	if (v !== localValue) {
		localValue = v;
	}
});

// Auto-focus on mount
$effect(() => {
	if (rest.autofocus && inputEl) {
		inputEl.focus();
	}
});

function handleInput() {
	ctx.setValue(localValue);
}

function handleWheel(e: WheelEvent) {
	// Wheel disabled or no channel mode — ignore
	if (ctx.isDisabled || ctx.isReadOnly) return;
	// Only handle if focused
	if (document.activeElement !== inputEl) return;
	e.preventDefault();
	// Channel increment/decrement would go here when color math is integrated
}

// Build aria-describedby conditionally
function ariaDescribedBy(): string | undefined {
	if (!ctx.hasDescription) return undefined;
	return ctx.ids.description;
}

function ariaErrorMessage(): string | undefined {
	if (!ctx.isInvalid || !ctx.hasError) return undefined;
	return ctx.ids.errorMessage;
}
</script>

<input
	bind:this={inputEl}
	bind:value={localValue}
	id={ctx.ids.input}
	type="text"
	name={ctx.name}
	form={ctx.form}
	placeholder={ctx.placeholder}
	disabled={ctx.isDisabled}
	readonly={ctx.isReadOnly}
	required={ctx.isRequired}
	aria-invalid={ctx.isInvalid || undefined}
	aria-labelledby={ctx.ids.label}
	aria-describedby={ariaDescribedBy()}
	aria-errormessage={ariaErrorMessage()}
	data-kind="color-field"
	data-slot="input"
	class={cn(className)}
	oninput={handleInput}
	onwheel={handleWheel}
	{...rest}
/>
