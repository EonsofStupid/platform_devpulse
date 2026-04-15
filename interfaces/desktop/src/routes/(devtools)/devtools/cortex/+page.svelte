<!--
	@file /devtools/cortex — Reasoning system devtool
	@route /devtools/cortex
	@window DevTools (Ctrl+Shift+Z)

	Layman terminology: "knowledge engine". Kernel-internal name is
	intentionally NOT rendered in user copy — this page's route slug
	is the sole exception (for developer muscle memory) and is gated
	behind the devtools window.

	Authoring surface for the reasoning pipeline — prompt builder
	(COSTAR+), memory lookup thresholds, cached retrieval behavior,
	rumination budgets, council deliberation config.

	SCAFFOLD — filled in progressively.
-->
<script lang="ts">
import { Brain, GitBranch, Search, Zap } from "lucide-svelte";
import { Text } from "$lib/design/components/text/index.js";
import { stack } from "$lib/design/utils/stack/index.js";
</script>

<div class="flex flex-col h-full overflow-y-auto p-4">
	<div class={stack({ gap: "4" })}>
		<header class={stack({ gap: "1" })}>
			<div class="flex items-center gap-2">
				<Brain size={18} class="text-[var(--color-teal-400)]" />
				<Text size="lg" weight="semibold">Knowledge Engine</Text>
			</div>
			<Text size="xs" color="muted">
				Reasoning pipeline configuration. Prompt builder, memory lookup, cached retrieval, rumination budgets, councils.
			</Text>
		</header>

		<section class="grid grid-cols-1 md:grid-cols-2 gap-3">
			<div class="flex items-start gap-3 p-3 rounded-lg border border-dashed border-[var(--border-subtle)]">
				<Search size={16} class="text-[var(--color-teal-400)]" />
				<div class={stack({ gap: "1" })}>
					<Text size="sm" weight="semibold">Memory lookup</Text>
					<Text size="xs" color="muted">
						How many past interactions to surface per query. Smart ranking thresholds.
					</Text>
					<Text size="xs" color="muted">Not wired yet.</Text>
				</div>
			</div>

			<div class="flex items-start gap-3 p-3 rounded-lg border border-dashed border-[var(--border-subtle)]">
				<Zap size={16} class="text-[var(--color-teal-400)]" />
				<div class={stack({ gap: "1" })}>
					<Text size="sm" weight="semibold">Cached retrieval</Text>
					<Text size="xs" color="muted">
						Context that's pre-warmed in the model's working memory before a question arrives.
					</Text>
					<Text size="xs" color="muted">Not wired yet.</Text>
				</div>
			</div>

			<div class="flex items-start gap-3 p-3 rounded-lg border border-dashed border-[var(--border-subtle)]">
				<Brain size={16} class="text-[var(--color-teal-400)]" />
				<div class={stack({ gap: "1" })}>
					<Text size="sm" weight="semibold">Rumination budget</Text>
					<Text size="xs" color="muted">
						Background thinking budget per query. Time + token cap for deeper reasoning.
					</Text>
					<Text size="xs" color="muted">Not wired yet.</Text>
				</div>
			</div>

			<div class="flex items-start gap-3 p-3 rounded-lg border border-dashed border-[var(--border-subtle)]">
				<GitBranch size={16} class="text-[var(--color-teal-400)]" />
				<div class={stack({ gap: "1" })}>
					<Text size="sm" weight="semibold">Councils</Text>
					<Text size="xs" color="muted">
						Multi-model deliberation configuration. Validation, perspective, and debate councils.
					</Text>
					<Text size="xs" color="muted">Not wired yet.</Text>
				</div>
			</div>
		</section>
	</div>
</div>
