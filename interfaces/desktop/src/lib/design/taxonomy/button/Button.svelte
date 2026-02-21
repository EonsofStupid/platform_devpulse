<script lang="ts">
	/**
	 * @file taxonomy/button/Button.svelte
	 * @package @devpulse/coldlight
	 *
	 * ColdLight Button Primitive — structurally complete, ARIA-owned by ColdLight.
	 *
	 * UNSTYLED by design. The `class` prop receives recipe-generated class strings
	 * from the component layer. This primitive owns:
	 *   - ARIA (role, aria-pressed, aria-disabled, aria-busy)
	 *   - data-kind / data-slot / data-state attributes
	 *   - Keyboard activation (Enter/Space — native to <button>)
	 *   - Focus management (native browser focus)
	 *
	 * ariaStateProvider: "coldlight"
	 * WAI-ARIA APG: https://www.w3.org/WAI/ARIA/apg/patterns/button/
	 */

	import type { ButtonProps } from "./types.js";

	let {
		disabled = false,
		loading = false,
		pressed,
		type = "button",
		"aria-label": ariaLabel,
		"aria-describedby": ariaDescribedby,
		onclick,
		class: className = "",
		children,
		...rest
	}: ButtonProps = $props();

	/**
	 * Derived data-state — single active state token at a time.
	 * Priority: disabled > loading > pressed > none.
	 */
	const state = $derived(
		disabled ? "disabled" : loading ? "loading" : pressed === true ? "pressed" : undefined,
	);
</script>

<button
	{type}
	{disabled}
	aria-label={ariaLabel}
	aria-describedby={ariaDescribedby}
	aria-pressed={pressed}
	aria-busy={loading || undefined}
	aria-disabled={disabled || undefined}
	data-kind="button"
	data-slot="root"
	data-state={state}
	class={className}
	{onclick}
	{...rest}
>
	{@render children?.()}
</button>
