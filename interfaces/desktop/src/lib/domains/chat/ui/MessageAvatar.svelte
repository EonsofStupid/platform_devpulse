<!--
  @component MessageAvatar — role rim (layout utilities only)
-->
<script lang="ts">
import { cn } from "$lib/design/utils/cn.js";

interface Props {
	variant: "user" | "ai" | "system";
	class?: string;
}

let { variant, class: className }: Props = $props();

const ring =
	variant === "user"
		? "ring-[var(--accent-teal-main)]"
		: variant === "system"
			? "ring-[var(--accent-ember-main)]"
			: "ring-[var(--accent-purple-main)]";
</script>

<div
	class={cn("size-8 shrink-0 rounded-full ring-2 ring-offset-2 ring-offset-transparent", ring, className)}
	aria-hidden="true"
></div>
