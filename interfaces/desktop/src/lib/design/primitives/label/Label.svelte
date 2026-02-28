<script lang="ts">
	import type { LabelProps } from "./types.js";
	import { cn, stripStyleProp } from "../types.js";

	let { children, class: className, ...rest }: LabelProps = $props();

	$effect(() => { if (import.meta.env.DEV) stripStyleProp(rest as Record<string, unknown>, "Label"); });
</script>

<label data-kind="label" data-slot="root" class={cn(className)} {...rest}>
	{@render children?.()}
</label>
