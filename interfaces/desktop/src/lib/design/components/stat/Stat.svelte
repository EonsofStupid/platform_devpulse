<!--
	@component Stat
	@kind stat
	@layer components

	ColdLight Stat — builder-driven ARIA + state. ZERO visual.
	Builder owns ALL ARIA, data attributes.
	Visual (recipe, ColdLight encoding) applied by ui/stat/.
-->
<script lang="ts">
	import type { StatComponentProps } from "./types.js";
	import { createStat } from "$lib/design/api/adapters/coldlight/_internal/stat/index.js";
	import StatRoot from "$lib/design/primitives/stat/Stat.svelte";

	let {
		children,
		class: className,
		...rest
	}: StatComponentProps = $props();

	const builder = createStat();
</script>

<StatRoot
	{...builder.root}
	{...rest}
	class={className}
>
	{@render children?.()}
</StatRoot>
