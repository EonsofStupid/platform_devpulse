<!--
	@component ButtonShard
	@kind button
	@layer primitives (Shard)

	The Button Shard — semantic HTML skeleton.
	Zero styling. Zero ARIA. Just structure + data attributes.
	ARIA comes from createButton() hook.
	Styling comes from recipes + useColdLight().
-->
<script lang="ts">
	import type { Snippet } from "svelte";
	import type { HTMLButtonAttributes } from "svelte/elements";

	interface Props extends HTMLButtonAttributes {
		children?: Snippet;
	}

	let {
		children,
		class: className,
		...rest
	}: Props = $props();
</script>

<button
	data-kind="button"
	data-slot="root"
	class={className}
	{...rest}
>
	{@render children?.()}
</button>
