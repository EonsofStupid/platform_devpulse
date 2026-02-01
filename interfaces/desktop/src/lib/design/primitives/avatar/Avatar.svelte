<!--
	@component Avatar
	@description Structural shell for avatar primitive (root container).
	Contract: kind="avatar", slot="root", ariaStateProvider="coldlight"
-->
<script lang="ts">
	import { cn, stripStyleProp } from "../types.js";
	import type { AvatarProps } from "./types.js";

	let { children, class: className, ...rest }: AvatarProps = $props();

	if (import.meta.env?.DEV) stripStyleProp(rest as Record<string, unknown>, "Avatar");
</script>

<span
	{...rest}
	data-kind="avatar"
	data-slot="root"
	class={cn(className)}
>
	{@render children?.()}
</span>
