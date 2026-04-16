<!--
	@file /devtools/rro — RRO (Qdrant) + Encoder devtool
	@route /devtools/rro
	@window DevTools (Ctrl+Shift+Z)

	Vector store and dense encoder administration.
	Collection health, embedding stats, search test bench, index config.
-->
<script lang="ts">
import { Compass, HeartPulse, Search, Shapes } from "lucide-svelte";
import { Text } from "$lib/design/components/text/index.js";
import { stack } from "$lib/design/utils/stack/index.js";
</script>

<div class="flex flex-col h-full overflow-y-auto p-4">
	<div class={stack({ gap: "4" })}>
		<header class={stack({ gap: "1" })}>
			<div class="flex items-center gap-2">
				<Compass size={18} class="text-[var(--color-teal-400)]" />
				<Text size="lg" weight="semibold">RRO / Vector Store</Text>
			</div>
			<Text size="xs" color="muted">
				Embedded vector search (Qdrant). Dense encoder (nomic-embed). Two-tier retrieval pipeline.
			</Text>
		</header>

		<section class="grid grid-cols-1 md:grid-cols-2 gap-3">
			<div class="flex items-start gap-3 p-3 rounded-lg border border-dashed border-[var(--border-subtle)]">
				<HeartPulse size={16} class="text-[var(--color-teal-400)]" />
				<div class={stack({ gap: "1" })}>
					<Text size="sm" weight="semibold">Collection health</Text>
					<Text size="xs" color="muted">
						Storage path, collection count, vector dimensions, index status.
					</Text>
					<Text size="xs" color="muted">Not wired yet.</Text>
				</div>
			</div>

			<div class="flex items-start gap-3 p-3 rounded-lg border border-dashed border-[var(--border-subtle)]">
				<Shapes size={16} class="text-[var(--color-teal-400)]" />
				<div class={stack({ gap: "1" })}>
					<Text size="sm" weight="semibold">Encoder status</Text>
					<Text size="xs" color="muted">
						Active embedding model (rag.embedder slot), dimensions, throughput, queue depth.
					</Text>
					<Text size="xs" color="muted">Not wired yet.</Text>
				</div>
			</div>

			<div class="flex items-start gap-3 p-3 rounded-lg border border-dashed border-[var(--border-subtle)]">
				<Search size={16} class="text-[var(--color-teal-400)]" />
				<div class={stack({ gap: "1" })}>
					<Text size="sm" weight="semibold">Search test bench</Text>
					<Text size="xs" color="muted">
						Query the vector store directly. View similarity scores, retrieved chunks, reranking.
					</Text>
					<Text size="xs" color="muted">Not wired yet.</Text>
				</div>
			</div>
		</section>
	</div>
</div>
