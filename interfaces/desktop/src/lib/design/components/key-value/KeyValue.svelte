<!--
	@component KeyValue
	@kind key-value
	@render html
	@category content
	@description Inline label:value pair. Used for metadata rows, uptime display, stats summaries.

	@example
	<KeyValue label="Uptime" value="3h 28m" />
	<KeyValue label="Latency" value="75µs" size="sm" />
-->
<script lang="ts">
import { cssVarString, resolveMacro } from "$lib/design/style-macro";
import { cn } from "$lib/design/utils/cn.js";
import type { KeyValueProps, KeyValueSize } from "./key-value.types.js";

const SIZE: Record<KeyValueSize, { label: string; value: string }> = {
	sm: { label: "text-xs", value: "text-xs font-semibold" },
	md: { label: "text-sm", value: "text-sm font-semibold" },
	lg: { label: "text-base", value: "text-base font-bold" },
};

let { label, value, size = "sm", class: className, ...rest }: KeyValueProps = $props();

const s = $derived(SIZE[size] ?? SIZE.sm);
</script>

<div
	data-kind="key-value"
	data-slot="root"
	class={cn("flex items-center justify-between", className)}
	{...rest}
>
	<span class={cn(s.label, "text-[var(--text-muted)]")}>{label}</span>
	<span class={cn(s.value, "text-[var(--text-primary)]")}>{value}</span>
</div>
