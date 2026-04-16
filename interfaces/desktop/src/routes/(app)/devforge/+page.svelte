<!--
  @file DevForge Dashboard
  @route /devforge
  @domain devforge
  Hub: Build Pipeline, CI/CD, Environments, Node CLI, Packages
-->
<script lang="ts">
import { invoke } from "@tauri-apps/api/core";
import { GitBranch, Hammer, Package, Play, Server, Terminal } from "lucide-svelte";
import { Widget } from "$lib/design/blocks/widgets/index.js";
import { Badge } from "$lib/design/components/badge/index.js";
import { Button } from "$lib/design/components/button/index.js";
import { Text } from "$lib/design/components/text/index.js";
import { cn } from "$lib/design/utils/cn.js";
import { hstack } from "$lib/design/utils/hstack/index.js";
import { stack } from "$lib/design/utils/stack/index.js";

/**
 * Tracks the in-flight state of the "Open DevForge" button. `idle` is the
 * default, `opening` is during the Tauri command round-trip, `error` holds
 * the stringified failure. The backend command is idempotent — if the
 * DevForge window already exists, it focuses it instead of spawning a
 * second one.
 */
let openState: { kind: "idle" } | { kind: "opening" } | { kind: "error"; msg: string } = $state({
	kind: "idle",
});

async function openDevForgeWindow() {
	openState = { kind: "opening" };
	try {
		await invoke("open_devforge_window");
		openState = { kind: "idle" };
	} catch (err) {
		openState = { kind: "error", msg: String(err) };
	}
}
</script>

<div class="grid grid-cols-12 gap-4" data-page="devforge-dashboard">
	<!-- Row 0: Dedicated DevForge window launcher -->
	<div class="col-span-12">
		<Widget
			title="DevForge IDE"
			icon={Server}
			surface="glass-deep"
			depth="z2"
			bevel="soft"
			glow="teal"
			frame="accent-teal"
			radius="lg"
		>
			<div class={hstack({ justify: "between", align: "center", gap: "4" })}>
				<div class={stack({ gap: "1" })}>
					<Text weight="semibold">Open the full VS Code IDE in a dedicated window</Text>
					<Text size="sm" color="muted">
						Launches the bundled DevForge REH client/server as its own Tauri window.
						Extensions, settings, and user data persist under .userdata/devforge/.
					</Text>
					{#if openState.kind === "error"}
						<Text size="sm" color="negative">DevForge window failed to open: {openState.msg}</Text>
					{/if}
				</div>
				<Button
					preset="primary"
					size="md"
					onclick={openDevForgeWindow}
					disabled={openState.kind === "opening"}
				>
					<Play size={16} />
					{openState.kind === "opening" ? "Opening…" : "Open DevForge"}
				</Button>
			</div>
		</Widget>
	</div>

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
			<div class={stack({ gap: "2" })}>
				<div class={hstack({ justify: "between" })}>
					<Text color="secondary">Pipelines</Text>
					<Text>0 active</Text>
				</div>
				<div class={hstack({ justify: "between" })}>
					<Text color="secondary">Last Deploy</Text>
					<Text color="muted">Never</Text>
				</div>
				<div class={hstack({ justify: "between" })}>
					<Text color="secondary">Success Rate</Text>
					<Text color="muted">--</Text>
				</div>
			</div>
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
				<div class={cn(stack({ gap: "2" }), "rounded-lg border border-border-subtle p-3")}>
					<div class={hstack({ justify: "between", align: "center" })}>
						<Text weight="semibold" size="sm">Development</Text>
						<Badge variant="positive" size="sm">Local</Badge>
					</div>
					<Text size="xs" color="muted">localhost:1420</Text>
				</div>
				<div class={cn(stack({ gap: "2" }), "rounded-lg border border-border-subtle p-3")}>
					<div class={hstack({ justify: "between", align: "center" })}>
						<Text weight="semibold" size="sm">Staging</Text>
						<Badge variant="neutral" size="sm">Not Configured</Badge>
					</div>
					<Text size="xs" color="muted">--</Text>
				</div>
				<div class={cn(stack({ gap: "2" }), "rounded-lg border border-border-subtle p-3")}>
					<div class={hstack({ justify: "between", align: "center" })}>
						<Text weight="semibold" size="sm">Production</Text>
						<Badge variant="neutral" size="sm">Not Configured</Badge>
					</div>
					<Text size="xs" color="muted">--</Text>
				</div>
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
			<div class={stack({ gap: "2" })}>
				<div class={hstack({ justify: "between" })}>
					<Text color="secondary">Node Version</Text>
					<Text size="sm">--</Text>
				</div>
				<div class={hstack({ justify: "between" })}>
					<Text color="secondary">pnpm Version</Text>
					<Text size="sm">--</Text>
				</div>
				<div class={hstack({ justify: "between" })}>
					<Text color="secondary">Scripts</Text>
					<Text size="sm">0 registered</Text>
				</div>
			</div>
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
			<Text as="p" size="sm" color="muted">
				Package dependencies, version tracking, and update management.
			</Text>
		</Widget>
	</div>
</div>
