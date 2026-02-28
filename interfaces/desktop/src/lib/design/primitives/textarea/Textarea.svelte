<script lang="ts">
	import type { TextareaProps } from "./types.js";
	import { cn, stripStyleProp } from "../types.js";

	let { class: className, ...rest }: TextareaProps = $props();

	$effect(() => { if (import.meta.env.DEV) stripStyleProp(rest as Record<string, unknown>, "Textarea"); });
</script>

<textarea data-kind="textarea" data-slot="root" class={cn(className)} {...rest}></textarea>
