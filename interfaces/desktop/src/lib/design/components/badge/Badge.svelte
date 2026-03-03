<!--
	@component Badge
	@kind badge
	@layer components

	ColdLight Badge — builder-driven ARIA + state. ZERO visual.
	Builder owns ALL ARIA, data attributes.
	Visual (recipe, ColdLight encoding, intent) applied by ui/badge/.
-->
<script lang="ts">
	import type { BadgeComponentProps } from "./types.js";
	import { createBadge } from "$lib/design/api/adapters/coldlight/_internal/badge/index.js";
	import BadgeRoot from "$lib/design/primitives/badge/Badge.svelte";

	let {
		decorative = false,
		children,
		class: className,
		...rest
	}: BadgeComponentProps = $props();

	const builder = createBadge({
		decorative: () => decorative,
	});
</script>

<BadgeRoot
	{...builder.root}
	{...rest}
	class={className}
>
	{@render children?.()}
</BadgeRoot>
