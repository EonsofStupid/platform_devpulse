<!--
	@file Clyffy Dashboard
	@route /clyffy
	@domain clyffy

	Single dashboard for everything Clyffy. Layman-safe view on top
	(presence orb, activity text, capability browser). Below it, the
	Advanced orchestration panels — Orchestrator, Minion Fleet,
	Knowledge Base, Inference Cache, Context Window — render only when
	advanced display is selected. No separate `/maestro` route: Clyffy is the one
	persona, the one dashboard.
-->
<script lang="ts">
import { Widget } from "@devpulse/coldlight/blocks/widgets";
import { Badge } from "@devpulse/coldlight/components/badge";
import { Text } from "@devpulse/coldlight/components/text";
import { cn, hstack, stack } from "@devpulse/coldlight/utils";
import { BookOpenCheck, Brain, Database, Layers, Users } from "lucide-svelte";
import { presentationState } from "#lib/domains/app/devpulse/index.js";
import { MinionGrid } from "#lib/domains/app/minions/index.js";
import { ClyffyStatusOrb, clyffyStatus, ToolsBrowser } from "#lib/domains/clyffy/index.js";

const activity = $derived(clyffyStatus.activity);
</script>

<div class="grid grid-cols-12 gap-4" data-page="clyffy-dashboard">
	<!-- ── Layman-safe: always visible ────────────────────────── -->
	<div class="col-span-12 lg:col-span-5">
		<Widget
			title="Clyffy"
			surface="glass" variant="deep"
			depth="z2"
			bevel="subtle"
			glow="teal"
			frame="accent-teal"
			radius="lg"
		>
			<div class={`${stack({ gap: "4" })} items-center text-center`}>
				<ClyffyStatusOrb size="lg" label />
				{#if activity.text.length > 0}
					<Text size="sm" color="muted">{activity.text}</Text>
				{/if}
			</div>
		</Widget>
	</div>

	<div class="col-span-12 lg:col-span-7">
		<Widget
			title="What I can do"
			surface="glass" variant="deep"
			depth="z1"
			bevel="subtle"
			frame="soft"
			radius="lg"
		>
			<ToolsBrowser />
		</Widget>
	</div>

	{#if presentationState.advanced}
		<div class="col-span-12"><Text size="sm" color="muted">Orchestrator, cache and context measurements are not connected to live telemetry yet.</Text></div>
		<!-- ── Advanced: Orchestrator + Minion Fleet ───────────────────── -->
		<div class="col-span-4">
			<Widget
				title="Orchestrator"
				icon={Brain}
				surface="glass" variant="deep"
				depth="z2"
				bevel="soft"
				glow="purple"
				frame="accent-purple"
				radius="lg"
			>
				<div class={stack({ gap: "2" })}>
					<div class={hstack({ justify: "between" })}>
						<Text color="secondary">Status</Text>
						<Badge variant="neutral" size="sm">Unavailable</Badge>
					</div>
					<div class={hstack({ justify: "between" })}>
						<Text color="secondary">Active Tasks</Text>
						<Text color="muted">Unavailable</Text>
					</div>
					<div class={hstack({ justify: "between" })}>
						<Text color="secondary">Queue Depth</Text>
						<Text color="muted">Unavailable</Text>
					</div>
					<div class={hstack({ justify: "between" })}>
						<Text size="xs" color="muted">Engine</Text>
						<Text size="xs" color="muted">Clyffy Kernel</Text>
					</div>
				</div>
			</Widget>
		</div>

		<div class="col-span-8">
			<Widget
				title="Minion Fleet"
				icon={Users}
				surface="glass" variant="deep"
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
				<MinionGrid />
			</Widget>
		</div>

		<!-- ── DEV: Knowledge Base ────────────────────────────────── -->
		<div class="col-span-12">
			<Widget
				title="Knowledge Base"
				icon={BookOpenCheck}
				surface="glass" variant="deep"
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
							<Text size="xs" color="muted">--</Text>
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
							<Text size="xs" color="muted">--</Text>
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
							<Text size="xs" color="muted">--</Text>
						</div>
						<div class={hstack({ justify: "between" })}>
							<Text size="xs" color="secondary">Accuracy</Text>
							<Text size="xs" color="muted">--</Text>
						</div>
					</div>
				</div>
			</Widget>
		</div>

		<!-- ── DEV: Inference Cache + Context Window ──────────────── -->
		<div class="col-span-6">
			<Widget
				title="Inference Cache"
				icon={Database}
				surface="glass" variant="deep"
				depth="z1"
				bevel="subtle"
				frame="soft"
				radius="lg"
			>
				<div class={stack({ gap: "2" })}>
					<div class={hstack({ justify: "between" })}>
						<Text color="secondary">KV Cache</Text>
						<Badge variant="neutral" size="sm">Unavailable</Badge>
					</div>
					<div class={hstack({ justify: "between" })}>
						<Text color="secondary">Entries</Text>
						<Text color="muted">Unavailable</Text>
					</div>
					<div class={hstack({ justify: "between" })}>
						<Text color="secondary">Hit Rate</Text>
						<Text color="muted">--</Text>
					</div>
					<div class={hstack({ justify: "between" })}>
						<Text size="xs" color="muted">Backend</Text>
						<Text size="xs" color="muted">Moka (in-memory)</Text>
					</div>
				</div>
			</Widget>
		</div>

		<div class="col-span-6">
			<Widget
				title="Context Window"
				icon={Layers}
				surface="glass" variant="deep"
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
						<Text color="muted">Unavailable</Text>
					</div>
					<div class={hstack({ justify: "between" })}>
						<Text color="secondary">Compression</Text>
						<Text color="muted">--</Text>
					</div>
				</div>
			</Widget>
		</div>
	{/if}
</div>
