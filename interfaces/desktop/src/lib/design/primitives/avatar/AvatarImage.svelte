<!--
	@component AvatarImage
	@description Structural shell for avatar image (self-closing).
	Contract: kind="avatar", slot="image", ariaStateProvider="coldlight"
-->
<script lang="ts">
import { cn, stripStyleProp } from "../types.js";
import type { AvatarImageProps } from "./types.js";

let { class: className, ...rest }: AvatarImageProps = $props();

if (import.meta.env?.DEV) stripStyleProp(rest as Record<string, unknown>, "AvatarImage");
</script>

<img
	{...rest}
	data-kind="avatar"
	data-slot="image"
	class={cn(className)}
/>
