<!--
	@file /devtools/cortex — Knowledge Engine devtool
	@route /devtools/cortex
	@window DevTools (Ctrl+Shift+Q)

	Layman terminology: "Knowledge Engine". The reasoning pipeline is
	not yet shipped — this page is intentionally honest about that
	rather than showing disabled buttons or "TODO" stubs. Status lists
	the planned surfaces; everything else stays hidden until the
	services land.
-->
<script lang="ts">
import { Brain, GitBranch, Search, Zap } from "lucide-svelte";
import { Text } from "$lib/design/components/text/index.js";
import { type HealthBadge, ServiceDevtoolShell } from "$lib/domains/platform/_shared/index.js";

const badge: HealthBadge = {
	state: "stopped",
	label: "Planned — not yet shipped",
};

const plannedSurfaces = [
	{
		title: "Memory lookup",
		blurb: "How many past interactions to surface per query, plus smart ranking thresholds.",
		icon: Search,
	},
	{
		title: "Cached retrieval",
		blurb: "Context pre-warmed in the model's working memory before a question arrives.",
		icon: Zap,
	},
	{
		title: "Rumination budget",
		blurb: "Background thinking budget per query — time + token cap for deeper reasoning.",
		icon: Brain,
	},
	{
		title: "Councils",
		blurb: "Multi-model deliberation config. Validation, perspective, and debate councils.",
		icon: GitBranch,
	},
] as const;
</script>

<ServiceDevtoolShell
	title="Knowledge Engine"
	description="Reasoning pipeline — prompt builder, memory, councils"
	icon={Brain}
	axis="capabilities"
	accent="purple"
	health={badge}
>
	{#snippet status()}
		<div class="space-y-3">
			<Text size="sm" color="muted">
				The reasoning pipeline is planned but not yet shipped. When it lands,
				the following surfaces will each become their own tab — today the
				page exists so the route slug is stable.
			</Text>

			<div class="grid grid-cols-1 md:grid-cols-2 gap-3">
				{#each plannedSurfaces as surface}
					<div
						class="flex items-start gap-3 p-3 rounded-lg border border-dashed border-[var(--border-subtle)]"
					>
						<surface.icon size={16} style="color: var(--accent-service-main)" />
						<div class="space-y-1">
							<Text size="sm" weight="semibold">{surface.title}</Text>
							<Text size="xs" color="muted">{surface.blurb}</Text>
						</div>
					</div>
				{/each}
			</div>
		</div>
	{/snippet}
</ServiceDevtoolShell>
