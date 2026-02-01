<!--
	@component AvatarFallback
	@description Structural shell for avatar fallback content.
	Contract: kind="avatar", slot="fallback", ariaStateProvider="coldlight"
-->
<script lang="ts">
	import { cn, stripStyleProp } from "../types.js";
	import type { AvatarFallbackProps } from "./types.js";

	let { children, class: className, ...rest }: AvatarFallbackProps = $props();

	if (import.meta.env?.DEV) stripStyleProp(rest as Record<string, unknown>, "AvatarFallback");
</script>

<span
	{...rest}
	data-kind="avatar"
	data-slot="fallback"
	class={cn(className)}
>
	{@render children?.()}
</span>
