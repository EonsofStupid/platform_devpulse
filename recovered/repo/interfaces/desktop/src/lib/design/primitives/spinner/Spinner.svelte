<script lang="ts">
	import type { SpinnerProps } from "./types.js";
	import { cn, stripStyleProp } from "../types.js";

	let { class: className, ...rest }: SpinnerProps = $props();

	$effect(() => { if (import.meta.env.DEV) stripStyleProp(rest as Record<string, unknown>, "Spinner"); });
</script>

<div data-kind="spinner" data-slot="root" class={cn(className)} {...rest}></div>
