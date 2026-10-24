<!--
	@component ColorField.ErrorMessage
	@kind color-field
	@slot errorMessage
	@layer components

	Only renders when invalid. Registers itself in context for aria-errormessage.
-->
<script lang="ts">
import { cn } from "#coldlight/utils/cn.js";
import { getColorFieldContext } from "./context.js";
import type { ColorFieldErrorMessageProps } from "./types.js";

let { children, class: className, ...rest }: ColorFieldErrorMessageProps = $props();
const ctx = getColorFieldContext();

// Register that this slot exists — Input uses this for aria-errormessage
ctx.registerError();
</script>

{#if ctx.isInvalid}
	<p
		id={ctx.ids.errorMessage}
		role="alert"
		data-kind="color-field"
		data-slot="error-message"
		class={cn(className)}
		{...rest}
	>
		{#if children}
			{@render children()}
		{:else if ctx.validationError}
			{ctx.validationError}
		{/if}
	</p>
{/if}
