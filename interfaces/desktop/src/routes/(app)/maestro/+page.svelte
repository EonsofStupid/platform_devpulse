<!--
  @file Maestro Dashboard
  @route /maestro
  @domain maestro
  Hub: Orchestrator, Minion Fleet, Knowledge Base (RAG/CAG/HyDE), Inference Cache (KV), Context Window
  NOTE: IP-sensitive labels gated behind flags.DEV_MODE
-->
<script lang="ts">
	import { Stack, HStack, Text, Badge } from "$lib/design/index.js";
	import { Widget } from "$lib/design/blocks/widgets/index.js";
	import { DEV_MODE } from "$lib/sys/generated/terminology.js";
	import {
		Brain,
		Users,
		BookOpenCheck,
		Database,
		Layers,
	} from "lucide-svelte";
</script>

<div class="grid grid-cols-12 gap-4" data-page="maestro-dashboard">
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
			<Stack gap="2">
				<HStack justify="between">
					<Text color="secondary">Status</Text>
					<Badge intent="default" size="sm">Standby</Badge>
				</HStack>
				<HStack justify="between">
					<Text color="secondary">Active Tasks</Text>
					<Text>0</Text>
				</HStack>
				<HStack justify="between">
					<Text color="secondary">Queue Depth</Text>
					<Text>0</Text>
				</HStack>
				{#if DEV_MODE}
					<HStack justify="between">
						<Text size="xs" color="muted">Engine</Text>
						<Text size="xs" color="muted">Maestro Kernel</Text>
					</HStack>
				{/if}
			</Stack>
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
			<Stack gap="2">
				<HStack justify="between">
					<Text color="secondary">Active Minions</Text>
					<Text>0</Text>
				</HStack>
				<HStack justify="between">
					<Text color="secondary">Total Spawned</Text>
					<Text>0</Text>
				</HStack>
				<HStack justify="between">
					<Text color="secondary">Avg Completion</Text>
					<Text color="muted">--</Text>
				</HStack>
			</Stack>
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
				<Stack gap="2" class="rounded-lg border border-border-subtle p-3">
					<Text weight="semibold" size="sm">RAG Pipeline</Text>
					<HStack justify="between">
						<Text size="xs" color="secondary">Documents</Text>
						<Text size="xs">0</Text>
					</HStack>
					<HStack justify="between">
						<Text size="xs" color="secondary">Embeddings</Text>
						<Text size="xs" color="muted">--</Text>
					</HStack>
				</Stack>
				<Stack gap="2" class="rounded-lg border border-border-subtle p-3">
					<Text weight="semibold" size="sm">CAG Pipeline</Text>
					<HStack justify="between">
						<Text size="xs" color="secondary">Cache Entries</Text>
						<Text size="xs">0</Text>
					</HStack>
					<HStack justify="between">
						<Text size="xs" color="secondary">Hit Rate</Text>
						<Text size="xs" color="muted">--</Text>
					</HStack>
				</Stack>
				<Stack gap="2" class="rounded-lg border border-border-subtle p-3">
					<Text weight="semibold" size="sm">HyDE Generator</Text>
					<HStack justify="between">
						<Text size="xs" color="secondary">Hypotheticals</Text>
						<Text size="xs">0</Text>
					</HStack>
					<HStack justify="between">
						<Text size="xs" color="secondary">Accuracy</Text>
						<Text size="xs" color="muted">--</Text>
					</HStack>
				</Stack>
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
			<Stack gap="2">
				<HStack justify="between">
					<Text color="secondary">KV Cache</Text>
					<Badge intent="default" size="sm">Empty</Badge>
				</HStack>
				<HStack justify="between">
					<Text color="secondary">Entries</Text>
					<Text>0</Text>
				</HStack>
				<HStack justify="between">
					<Text color="secondary">Hit Rate</Text>
					<Text color="muted">--</Text>
				</HStack>
				{#if DEV_MODE}
					<HStack justify="between">
						<Text size="xs" color="muted">Backend</Text>
						<Text size="xs" color="muted">Moka (in-memory)</Text>
					</HStack>
				{/if}
			</Stack>
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
			<Stack gap="2">
				<HStack justify="between">
					<Text color="secondary">Window Size</Text>
					<Text color="muted">--</Text>
				</HStack>
				<HStack justify="between">
					<Text color="secondary">Tokens Used</Text>
					<Text>0</Text>
				</HStack>
				<HStack justify="between">
					<Text color="secondary">Compression</Text>
					<Text color="muted">--</Text>
				</HStack>
			</Stack>
		</Widget>
	</div>
</div>
