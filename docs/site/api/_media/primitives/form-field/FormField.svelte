<script lang="ts">
	import type { FormFieldProps } from "./types.js";
	import { cn, stripStyleProp } from "../types.js";

	let { children, class: className, ...rest }: FormFieldProps = $props();

	if (import.meta.env.DEV) stripStyleProp(rest as Record<string, unknown>, "FormField");
</script>

<div data-kind="form-field" data-slot="root" class={cn(className)} {...rest}>
	{@render children?.()}
</div>
