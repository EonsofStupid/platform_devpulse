<!--
	@file DevtoolBentoGrid
	@domain platform/_shared

	Bento-style fluid grid layout for devtool tab bodies. Lays out
	children in a responsive CSS grid (1 → 2 → N columns at sm/lg
	breakpoints) with ColdLight space tokens for the gap. No Card
	wrapping — caller composes the children. Pair with `DevtoolBentoTile`
	for the dark-glassmorphism (`Card preset="glass"`) tile look, or use
	any shipped primitive (`Stat`, `EmptyState`, `Card`, `Callout`)
	directly as children.

	# Usage

	```svelte
	<DevtoolBentoGrid columns={4}>
		<Stat label="Tools served" value={toolCount} accent="purple" glow />
		<Stat label="Latency" value={latency} unit="ms" accent="teal" />
		<Stat label="Throughput" value={qps} unit="/s" accent="ember" />
		<Stat label="Errors" value={errCount} accent="ember" />
	</DevtoolBentoGrid>

	<DevtoolBentoGrid columns={3}>
		<DevtoolBentoTile span={2}>
			<SparkLine ... />
		</DevtoolBentoTile>
		<DevtoolBentoTile>
			<RadialGauge ... />
		</DevtoolBentoTile>
	</DevtoolBentoGrid>
	```
-->
<script lang="ts">
import type { Snippet } from "svelte";

type Columns = 2 | 3 | 4;

interface Props {
	columns?: Columns;
	children: Snippet;
	class?: string;
}

let { columns = 3, children, class: className }: Props = $props();

const COL_CLASS: Record<Columns, string> = {
	2: "grid-cols-1 sm:grid-cols-2",
	3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
	4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
};
</script>

<div
	class={`grid ${COL_CLASS[columns]} gap-[var(--space-3)] sm:gap-[var(--space-4)] ${className ?? ""}`}
>
	{@render children()}
</div>
