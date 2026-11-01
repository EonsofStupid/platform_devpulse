<script lang="ts">
	import type { LoadingOverlayProps } from "./types.js";
	import { cn, stripStyleProp } from "../types.js";

	let { children, class: className, ...rest }: LoadingOverlayProps = $props();

	if (import.meta.env.DEV) stripStyleProp(rest as Record<string, unknown>, "LoadingOverlay");
</script>

<div data-kind="loading-overlay" data-slot="root" class={cn(className)} {...rest}>
	{@render children?.()}
</div>
