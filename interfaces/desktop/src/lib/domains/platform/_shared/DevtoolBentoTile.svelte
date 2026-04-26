<!--
	@file DevtoolBentoTile
	@domain platform/_shared

	Single bento-grid tile — `Card preset="glass"` with optional column
	span. The dark-glassmorphism aesthetic (frosted backdrop blur, edge
	light) lets the per-devtool ambient backdrop show through softly.

	# Usage

	```svelte
	<DevtoolBentoGrid columns={3}>
		<DevtoolBentoTile>
			<Stat label="Latency" value={latency} unit="ms" accent="teal" />
		</DevtoolBentoTile>

		<DevtoolBentoTile span={2}>
			<SparkLine values={cpuHistory} accent="ember" />
		</DevtoolBentoTile>
	</DevtoolBentoGrid>
	```
-->
<script lang="ts">
import type { Snippet } from "svelte";
import { Card } from "$lib/design/components/card/index.js";

type Span = 1 | 2 | 3 | 4;

interface Props {
	span?: Span;
	children: Snippet;
	class?: string;
}

let { span = 1, children, class: className }: Props = $props();

const SPAN_CLASS: Record<Span, string> = {
	1: "",
	2: "sm:col-span-2",
	3: "sm:col-span-2 lg:col-span-3",
	4: "sm:col-span-2 lg:col-span-4",
};
</script>

<Card preset="glass" class={`p-[var(--space-3)] ${SPAN_CLASS[span]} ${className ?? ""}`}>
	{@render children()}
</Card>
