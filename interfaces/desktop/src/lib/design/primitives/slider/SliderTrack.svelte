<!--
	@component SliderTrack
	@description Structural shell for slider track.
	Contract: kind="slider", slot="track", ariaStateProvider="meltui"
-->
<script lang="ts">
import { cn, stripStyleProp } from "../types.js";
import type { SliderTrackProps } from "./types.js";

let { children, class: className, ...rest }: SliderTrackProps = $props();

if (import.meta.env?.DEV) stripStyleProp(rest as Record<string, unknown>, "SliderTrack");
</script>

<div
	{...rest}
	data-kind="slider"
	data-slot="track"
	class={cn(className)}
>
	{@render children?.()}
</div>
