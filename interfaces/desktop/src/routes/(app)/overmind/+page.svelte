<!--
  @file OverMind Dashboard
  @route /overmind
  @domain overmind
  Hub: Playground, Experiments, Sandbox, Training, Learning
-->
<script lang="ts">
	import { Grid } from "$lib/design/components/grid/index.js";
	import { Stack } from "$lib/design/components/stack/index.js";
	import { HStack } from "$lib/design/components/hstack/index.js";
	import { Text } from "$lib/design/components/text/index.js";
	import { Badge } from "$lib/design/components/badge/index.js";
	import { Widget } from "$lib/design/blocks/widgets/index.js";
	import {
		FlaskConical,
		TestTube2,
		Box,
		GraduationCap,
		BookOpen,
		Activity,
	} from "lucide-svelte";
</script>

<div class="grid grid-cols-12 gap-4" data-page="overmind-dashboard">
	<!-- Row 1: Status + Playground -->
	<div class="col-span-4">
		<Widget
			title="System Status"
			icon={Activity}
			surface="glass-deep"
			depth="z2"
			bevel="subtle"
			glow="teal"
			frame="accent-teal"
			radius="lg"
		>
			<Stack gap="2">
				<HStack justify="between">
					<Text color="secondary">Engine</Text>
					<Badge intent="success" size="sm">Online</Badge>
				</HStack>
				<HStack justify="between">
					<Text color="secondary">Signal Router</Text>
					<Badge intent="success" size="sm">Active</Badge>
				</HStack>
				<HStack justify="between">
					<Text color="secondary">Database</Text>
					<Badge intent="default" size="sm">Not Connected</Badge>
				</HStack>
			</Stack>
		</Widget>
	</div>

	<div class="col-span-8">
		<Widget
			title="Playground"
			icon={FlaskConical}
			surface="glass-deep"
			depth="z2"
			bevel="soft"
			glow="purple"
			frame="soft"
			radius="lg"
			tabs={[
				{ id: "editor", label: "Editor" },
				{ id: "output", label: "Output" },
				{ id: "logs", label: "Logs" },
			]}
			activeTab="editor"
		>
			<Text as="p" size="sm" color="muted">Interactive code playground for testing prompts, chains, and agent behavior.</Text>
		</Widget>
	</div>

	<!-- Row 2: Experiments + Sandbox -->
	<div class="col-span-6">
		<Widget
			title="Experiments"
			icon={TestTube2}
			surface="glass-deep"
			depth="z1"
			bevel="subtle"
			frame="soft"
			radius="lg"
			tabs={[
				{ id: "active", label: "Active" },
				{ id: "completed", label: "Completed" },
			]}
			activeTab="active"
		>
			<Text as="p" size="sm" color="muted">Track A/B tests, prompt variations, and model comparisons.</Text>
		</Widget>
	</div>

	<div class="col-span-6">
		<Widget
			title="Sandbox"
			icon={Box}
			surface="glass-deep"
			depth="z1"
			bevel="subtle"
			frame="soft"
			radius="lg"
		>
			<Text as="p" size="sm" color="muted">Isolated environment for safe experimentation without affecting production data.</Text>
		</Widget>
	</div>

	<!-- Row 3: Training + Learning -->
	<div class="col-span-6">
		<Widget
			title="Training"
			icon={GraduationCap}
			surface="glass-deep"
			depth="z1"
			bevel="subtle"
			frame="soft"
			radius="lg"
		>
			<Stack gap="2">
				<HStack justify="between">
					<Text color="secondary">Fine-tuning Jobs</Text>
					<Text>0 active</Text>
				</HStack>
				<HStack justify="between">
					<Text color="secondary">Dataset Size</Text>
					<Text color="muted">--</Text>
				</HStack>
				<HStack justify="between">
					<Text color="secondary">Last Run</Text>
					<Text color="muted">Never</Text>
				</HStack>
			</Stack>
		</Widget>
	</div>

	<div class="col-span-6">
		<Widget
			title="Learning"
			icon={BookOpen}
			surface="glass-deep"
			depth="z1"
			bevel="subtle"
			frame="soft"
			radius="lg"
		>
			<Stack gap="2">
				<HStack justify="between">
					<Text color="secondary">Knowledge Items</Text>
					<Text>0</Text>
				</HStack>
				<HStack justify="between">
					<Text color="secondary">Retention Score</Text>
					<Text color="muted">--</Text>
				</HStack>
				<HStack justify="between">
					<Text color="secondary">Last Updated</Text>
					<Text color="muted">--</Text>
				</HStack>
			</Stack>
		</Widget>
	</div>
</div>
