<!--
	@component EmptyState
	@kind empty-state
	@layer components

	ColdLight EmptyState — builder-driven ARIA + state. ZERO visual.
	Builder owns ALL ARIA, keyboard, data attributes.
	Visual (recipe, ColdLight encoding) applied by ui/empty-state/.
-->
<script lang="ts">
	import type { EmptyStateComponentProps } from "./types.js";
	import { createEmptyState } from "$lib/design/api/adapters/coldlight/_internal/empty-state/index.js";
	import EmptyStateRoot from "$lib/design/primitives/empty-state/EmptyState.svelte";

	let {
		children,
		class: className,
		...rest
	}: EmptyStateComponentProps = $props();

	// Builder owns ARIA, keyboard, state
	const builder = createEmptyState();
</script>

<EmptyStateRoot {...builder.root} {...rest} class={className}>
	{@render children?.()}
</EmptyStateRoot>
