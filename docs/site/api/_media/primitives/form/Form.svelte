<script lang="ts">
	import type { FormProps } from "./types.js";
	import { cn, stripStyleProp } from "../types.js";

	let { children, class: className, ...rest }: FormProps = $props();

	if (import.meta.env.DEV) stripStyleProp(rest as Record<string, unknown>, "Form");
</script>

<form data-kind="form" data-slot="root" class={cn(className)} {...rest}>
	{@render children?.()}
</form>
