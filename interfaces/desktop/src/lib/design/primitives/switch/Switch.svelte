<script lang="ts">
	import type { SwitchRootProps } from "./types.js";
	import { cn, stripStyleProp } from "../types.js";

	let { children, class: className, ...rest }: SwitchRootProps = $props();

	$effect(() => { if (import.meta.env.DEV) stripStyleProp(rest as Record<string, unknown>, "Switch"); });
</script>

<button type="button" data-kind="switch" data-slot="root" class={cn(className)} {...rest}>
	{@render children?.()}
</button>
