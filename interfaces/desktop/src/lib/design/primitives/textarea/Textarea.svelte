<!--
	@component Textarea
	@description Structural shell for textarea primitive. Text content model, no Snippet children.
	Contract: kind="textarea", slot="root", ariaStateProvider="coldlight"
-->
<script lang="ts">
import { cn, stripStyleProp } from "../types.js";
import type { TextareaProps } from "./types.js";

let { class: className, ...rest }: TextareaProps = $props();

if (import.meta.env?.DEV) stripStyleProp(rest as Record<string, unknown>, "Textarea");
</script>

<textarea
	{...rest}
	data-kind="textarea"
	data-slot="root"
	class={cn(className)}
></textarea>
