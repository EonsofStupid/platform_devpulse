<!--
  @file Clyffy Dashboard
  @route /clyffy
  @domain clyffy
  Hub: Orchestrator, Minion Fleet, Knowledge Base (RAG/CAG/HyDE), Inference Cache (KV), Context Window
  NOTE: IP-sensitive labels gated behind flags.DEV_MODE
-->
<script lang="ts">
import { BookOpenCheck, Brain, Database, Layers, Users } from "lucide-svelte";
import { Widget } from "$lib/design/blocks/widgets/index.js";
import { Badge } from "$lib/design/components/badge/index.js";
import { Text } from "$lib/design/components/text/index.js";
import { cn } from "$lib/design/utils/cn.js";
import { hstack } from "$lib/design/utils/hstack/index.js";
import { stack } from "$lib/design/utils/stack/index.js";
import { DEV_MODE } from "$lib/sys/generated/terminology.js";
</script>

<div class="grid grid-cols-12 gap-4" data-page="clyffy-dashboard">
	<!-- Row 1: Orchestrator + Minion Fleet -->
	<div class="col-span-4">
		<Widget
			title="Orchestrator"
			icon={Brain}
			surface="glass-deep"
			depth="z2"
			bevel="soft"
			glow="purple"
			frame="accent-purple"
			radius="lg"
		>
			<div class={stack({ gap: "2" })}>
				<div class={hstack({ justify: "between" })}>
					<Text color="secondary">Status</Text>
					<Badge variant="neutral" size="sm">Standby</Badge>
				</div>
				<div class={hstack({ justify: "between" })}>
					<Text color="secondary">Active Tasks</Text>
					<Text>0</Text>
				</div>
				<div class={hstack({ justify: "between" })}>
					<Text color="secondary">Queue Depth</Text>
					<Text>0</Text>
				</div>
				{#if DEV_MODE}
					<div class={hstack({ justify: "between" })}>
						<Text size="xs" color="muted">Engine</Text>
						<Text size="xs" color="muted">Clyffy Kernel</Text>
					</div>
				{/if}
			</div>
		</Widget>
	</div>

	<div class="col-span-8">
		<Widget
			title="Minion Fleet"
			icon={Users}
			surface="glass-deep"
			depth="z2"
			bevel="subtle"
			glow="teal"
			frame="soft"
			radius="lg"
			tabs={[
				{ id: "active", label: "Active" },
				{ id: "idle", label: "Idle" },
				{ id: "history", label: "History" },
			]}
			activeTab="active"
		>
			<div class={stack({ gap: "2" })}>
				<div class={hstack({ justify: "between" })}>
					<Text color="secondary">Active Minions</Text>
					<Text>0</Text>
				</div>
				<div class={hstack({ justify: "between" })}>
					<Text color="secondary">Total Spawned</Text>
					<Text>0</Text>
				</div>
				<div class={hstack({ justify: "between" })}>
					<Text color="secondary">Avg Completion</Text>
					<Text color="muted">--</Text>
				</div>
			</div>
		</Widget>
	</div>

	<!-- Row 2: Knowledge Base -->
	<div class="col-span-12">
		<Widget
			title="Knowledge Base"
			icon={BookOpenCheck}
			surface="glass-deep"
			depth="z2"
			bevel="soft"
			glow="teal"
			frame="accent-teal"
			radius="lg"
			tabs={[
				{ id: "rag", label: "RAG" },
				{ id: "cag", label: "CAG" },
				{ id: "hyde", label: "HyDE" },
			]}
			activeTab="rag"
		>
			<div class="grid grid-cols-3 gap-4">
				<div class={cn(stack({ gap: "2" }), "rounded-lg border border-border-subtle p-3")}>
					<Text weight="semibold" size="sm">RAG Pipeline</Text>
					<div class={hstack({ justify: "between" })}>
						<Text size="xs" color="secondary">Documents</Text>
						<Text size="xs">0</Text>
					</div>
					<div class={hstack({ justify: "between" })}>
						<Text size="xs" color="secondary">Embeddings</Text>
						<Text size="xs" color="muted">--</Text>
					</div>
				</div>
				<div class={cn(stack({ gap: "2" }), "rounded-lg border border-border-subtle p-3")}>
					<Text weight="semibold" size="sm">CAG Pipeline</Text>
					<div class={hstack({ justify: "between" })}>
						<Text size="xs" color="secondary">Cache Entries</Text>
						<Text size="xs">0</Text>
					</div>
					<div class={hstack({ justify: "between" })}>
						<Text size="xs" color="secondary">Hit Rate</Text>
						<Text size="xs" color="muted">--</Text>
					</div>
				</div>
				<div class={cn(stack({ gap: "2" }), "rounded-lg border border-border-subtle p-3")}>
					<Text weight="semibold" size="sm">HyDE Generator</Text>
					<div class={hstack({ justify: "between" })}>
						<Text size="xs" color="secondary">Hypotheticals</Text>
						<Text size="xs">0</Text>
					</div>
					<div class={hstack({ justify: "between" })}>
						<Text size="xs" color="secondary">Accuracy</Text>
						<Text size="xs" color="muted">--</Text>
					</div>
				</div>
			</div>
		</Widget>
	</div>

	<!-- Row 3: Inference Cache + Context Window -->
	<div class="col-span-6">
		<Widget
			title="Inference Cache"
			icon={Database}
			surface="glass-deep"
			depth="z1"
			bevel="subtle"
			frame="soft"
			radius="lg"
		>
			<div class={stack({ gap: "2" })}>
				<div class={hstack({ justify: "between" })}>
					<Text color="secondary">KV Cache</Text>
					<Badge variant="neutral" size="sm">Empty</Badge>
				</div>
				<div class={hstack({ justify: "between" })}>
					<Text color="secondary">Entries</Text>
					<Text>0</Text>
				</div>
				<div class={hstack({ justify: "between" })}>
					<Text color="secondary">Hit Rate</Text>
					<Text color="muted">--</Text>
				</div>
				{#if DEV_MODE}
					<div class={hstack({ justify: "between" })}>
						<Text size="xs" color="muted">Backend</Text>
						<Text size="xs" color="muted">Moka (in-memory)</Text>
					</div>
				{/if}
			</div>
		</Widget>
	</div>

	<div class="col-span-6">
		<Widget
			title="Context Window"
			icon={Layers}
			surface="glass-deep"
			depth="z1"
			bevel="subtle"
			frame="soft"
			radius="lg"
		>
			<div class={stack({ gap: "2" })}>
				<div class={hstack({ justify: "between" })}>
					<Text color="secondary">Window Size</Text>
					<Text color="muted">--</Text>
				</div>
				<div class={hstack({ justify: "between" })}>
					<Text color="secondary">Tokens Used</Text>
					<Text>0</Text>
				</div>
				<div class={hstack({ justify: "between" })}>
					<Text color="secondary">Compression</Text>
					<Text color="muted">--</Text>
				</div>
			</div>
		</Widget>
	</div>
</div>
