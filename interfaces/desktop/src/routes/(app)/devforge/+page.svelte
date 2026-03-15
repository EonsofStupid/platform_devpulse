<!--
  @file DevForge Dashboard
  @route /devforge
  @domain devforge
  Hub: Build Pipeline, CI/CD, Environments, Node CLI, Packages
-->
<script lang="ts">
	import { Stack } from "$lib/design/components/stack/index.js";
	import { HStack } from "$lib/design/components/hstack/index.js";
	import { Text } from "$lib/design/components/text/index.js";
	import { Badge } from "$lib/design/components/badge/index.js";
	import { Widget } from "$lib/design/blocks/widgets/index.js";
	import {
		Hammer,
		GitBranch,
		Server,
		Terminal,
		Package,
	} from "lucide-svelte";
</script>

<div class="grid grid-cols-12 gap-4" data-page="devforge-dashboard">
	<!-- Row 1: Build Pipeline + CI/CD -->
	<div class="col-span-8">
		<Widget
			title="Build Pipeline"
			icon={Hammer}
			surface="glass-deep"
			depth="z2"
			bevel="soft"
			glow="teal"
			frame="accent-teal"
			radius="lg"
			tabs={[
				{ id: "active", label: "Active" },
				{ id: "history", label: "History" },
				{ id: "artifacts", label: "Artifacts" },
			]}
			activeTab="active"
		>
			<Text as="p" size="sm" color="muted">Build jobs will appear here when CI/CD is configured.</Text>
		</Widget>
	</div>

	<div class="col-span-4">
		<Widget
			title="CI/CD"
			icon={GitBranch}
			surface="glass-deep"
			depth="z2"
			bevel="subtle"
			glow="purple"
			frame="soft"
			radius="lg"
		>
			<Stack gap="2">
				<HStack justify="between">
					<Text color="secondary">Pipelines</Text>
					<Text>0 active</Text>
				</HStack>
				<HStack justify="between">
					<Text color="secondary">Last Deploy</Text>
					<Text color="muted">Never</Text>
				</HStack>
				<HStack justify="between">
					<Text color="secondary">Success Rate</Text>
					<Text color="muted">--</Text>
				</HStack>
			</Stack>
		</Widget>
	</div>

	<!-- Row 2: Environments -->
	<div class="col-span-12">
		<Widget
			title="Environments"
			icon={Server}
			surface="glass-deep"
			depth="z1"
			bevel="subtle"
			frame="soft"
			radius="lg"
		>
			<div class="grid grid-cols-3 gap-4">
				<Stack gap="2" class="rounded-lg border border-border-subtle p-3">
					<HStack justify="between" align="center">
						<Text weight="semibold" size="sm">Development</Text>
						<Badge intent="success" size="sm">Local</Badge>
					</HStack>
					<Text size="xs" color="muted">localhost:1420</Text>
				</Stack>
				<Stack gap="2" class="rounded-lg border border-border-subtle p-3">
					<HStack justify="between" align="center">
						<Text weight="semibold" size="sm">Staging</Text>
						<Badge intent="default" size="sm">Not Configured</Badge>
					</HStack>
					<Text size="xs" color="muted">--</Text>
				</Stack>
				<Stack gap="2" class="rounded-lg border border-border-subtle p-3">
					<HStack justify="between" align="center">
						<Text weight="semibold" size="sm">Production</Text>
						<Badge intent="default" size="sm">Not Configured</Badge>
					</HStack>
					<Text size="xs" color="muted">--</Text>
				</Stack>
			</div>
		</Widget>
	</div>

	<!-- Row 3: Node CLI + Packages -->
	<div class="col-span-6">
		<Widget
			title="Node CLI"
			icon={Terminal}
			surface="glass-deep"
			depth="z1"
			bevel="subtle"
			frame="soft"
			radius="lg"
		>
			<Stack gap="2">
				<HStack justify="between">
					<Text color="secondary">Node Version</Text>
					<Text size="sm">--</Text>
				</HStack>
				<HStack justify="between">
					<Text color="secondary">pnpm Version</Text>
					<Text size="sm">--</Text>
				</HStack>
				<HStack justify="between">
					<Text color="secondary">Scripts</Text>
					<Text size="sm">0 registered</Text>
				</HStack>
			</Stack>
		</Widget>
	</div>

	<div class="col-span-6">
		<Widget
			title="Packages"
			icon={Package}
			surface="glass-deep"
			depth="z1"
			bevel="subtle"
			frame="soft"
			radius="lg"
			tabs={[
				{ id: "deps", label: "Dependencies" },
				{ id: "outdated", label: "Outdated" },
			]}
			activeTab="deps"
		>
			<Text as="p" size="sm" color="muted">Package dependencies, version tracking, and update management.</Text>
		</Widget>
	</div>
</div>
