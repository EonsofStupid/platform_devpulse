<!--
	@component Toggle
	@kind toggle
	@layer components

	ARIA + state only. MeltUI transport-driven. ZERO visual.
	Transport owns ARIA semantics (aria-pressed).
	Reference: WAI-ARIA APG Button Pattern (Toggle)
-->
<script lang="ts">
	import type { ToggleComponentProps } from "./types.js";
	import { createToggleTransport } from "$lib/design/api/adapters/meltui/_internal/toggle/index.js";

	let {
		pressed = false,
		onPressedChange,
		disabled = false,
		children,
		class: className,
		// Rest spread
		...rest
	}: ToggleComponentProps = $props();

	const transport = createToggleTransport({
		get disabled() { return disabled; },
		get value() { return pressed; },
	});

	$effect(() => {
		transport.states.pressed = pressed;
	});

	$effect(() => {
		if (transport.states.pressed !== pressed) {
			onPressedChange?.(transport.states.pressed);
		}
	});
</script>

<button
	{...transport.slots.trigger}
	{...rest}
	class={className}
	data-kind="toggle"
	data-slot="trigger"
	data-state={pressed ? "on" : "off"}
	{disabled}
	onclick={() => {
		if (!disabled) {
			const next = !pressed;
			transport.states.pressed = next;
			onPressedChange?.(next);
		}
	}}
>
	{@render children?.()}
</button>
