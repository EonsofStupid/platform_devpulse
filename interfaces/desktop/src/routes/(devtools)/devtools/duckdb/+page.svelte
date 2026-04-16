<!--
	@file /devtools/duckdb — DuckDB devtool
	@route /devtools/duckdb
	@window DevTools (Ctrl+Shift+Z)

	Analytics engine administration.
	Telemetry spans, lane baselines, OLAP queries, OTLP export status.
-->
<script lang="ts">
import { BarChart3, Database, HeartPulse, Terminal } from "lucide-svelte";
import { Text } from "$lib/design/components/text/index.js";
import { stack } from "$lib/design/utils/stack/index.js";
</script>

<div class="flex flex-col h-full overflow-y-auto p-4">
	<div class={stack({ gap: "4" })}>
		<header class={stack({ gap: "1" })}>
			<div class="flex items-center gap-2">
				<BarChart3 size={18} class="text-[var(--color-purple-400)]" />
				<Text size="lg" weight="semibold">DuckDB</Text>
			</div>
			<Text size="xs" color="muted">
				Analytics engine. Telemetry spans, lane traces, OLAP queries.
			</Text>
		</header>

		<section class="grid grid-cols-1 md:grid-cols-2 gap-3">
			<div class="flex items-start gap-3 p-3 rounded-lg border border-dashed border-[var(--border-subtle)]">
				<HeartPulse size={16} class="text-[var(--color-purple-400)]" />
				<div class={stack({ gap: "1" })}>
					<Text size="sm" weight="semibold">Connection health</Text>
					<Text size="xs" color="muted">
						File size, table count, last write timestamp, memory usage.
					</Text>
					<Text size="xs" color="muted">Not wired yet.</Text>
				</div>
			</div>

			<div class="flex items-start gap-3 p-3 rounded-lg border border-dashed border-[var(--border-subtle)]">
				<BarChart3 size={16} class="text-[var(--color-purple-400)]" />
				<div class={stack({ gap: "1" })}>
					<Text size="sm" weight="semibold">Span explorer</Text>
					<Text size="xs" color="muted">
						Browse telemetry spans by trace ID. Flame graph view of boot + inference.
					</Text>
					<Text size="xs" color="muted">Not wired yet.</Text>
				</div>
			</div>

			<div class="flex items-start gap-3 p-3 rounded-lg border border-dashed border-[var(--border-subtle)]">
				<Terminal size={16} class="text-[var(--color-purple-400)]" />
				<div class={stack({ gap: "1" })}>
					<Text size="sm" weight="semibold">Query console</Text>
					<Text size="xs" color="muted">
						Execute raw SQL against analytics.duckdb. OTLP JSONL import/export.
					</Text>
					<Text size="xs" color="muted">Not wired yet.</Text>
				</div>
			</div>
		</section>
	</div>
</div>
