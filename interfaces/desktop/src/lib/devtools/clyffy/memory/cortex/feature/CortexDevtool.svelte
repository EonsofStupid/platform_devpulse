<!--
	@file CortexDevtool.svelte
	@module @devpulse/devtools/clyffy/memory/cortex
	@window DevTools (Ctrl+Shift+Q)

	Layman terminology: "Knowledge Engine". The reasoning pipeline is
	not yet shipped — this page is intentionally honest about that
	rather than showing disabled buttons or "TODO" stubs. Status lists
	the planned surfaces; the other 4 tabs each describe what they
	will hold when the corresponding kernel command lands.
-->
<script lang="ts">
import { Brain, GitBranch, Search, Zap } from "lucide-svelte";
import { Text } from "$lib/design/components/text/index.js";
import { type HealthBadge, ServiceDevtoolShell } from "$lib/devtools/index.js";

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

	{#snippet config()}
		<Text size="sm" color="muted">
			Reasoning-pipeline configuration (memory budget, ranking
			thresholds, council membership) lands here once the
			<code>cortex_save_config</code> kernel command ships. For now the
			SSOT is <code>config/platform/cortex/cortex.toml</code> — read-only
			until the editable surface is wired.
		</Text>
	{/snippet}

	{#snippet logs()}
		<Text size="sm" color="muted">
			Cortex logs will tail the <code>devtools.cortex</code> scoped log
			target once the reasoning runtime emits structured events. Until
			then there's nothing to surface here that wouldn't be a
			placeholder.
		</Text>
	{/snippet}

	{#snippet actions()}
		<Text size="sm" color="muted">
			Reasoning verbs (priming working memory, triggering a council
			deliberation, replaying a recent rumination) plug in here as the
			kernel commands land. The verb shape is locked in
			<code>project_cortex_surfaces.md</code>.
		</Text>
	{/snippet}

	{#snippet debug()}
		<Text size="sm" color="muted">
			Debug probes for the reasoning pipeline (working-memory dump,
			council vote trace, rumination budget snapshot) land alongside
			Actions when the kernel commands ship.
		</Text>
	{/snippet}
</ServiceDevtoolShell>
