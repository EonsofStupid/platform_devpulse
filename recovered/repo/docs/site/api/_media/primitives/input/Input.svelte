<script lang="ts">
	import type { InputProps } from "./types.js";
	import { cn, stripStyleProp } from "../types.js";

	let { class: className, ...rest }: InputProps = $props();

	if (import.meta.env.DEV) stripStyleProp(rest as Record<string, unknown>, "Input");
</script>

<input data-kind="input" data-slot="root" class={cn(className)} {...rest} />
