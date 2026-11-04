<!--
	@file GovernanceDevtool.svelte
	@module @devpulse/devtools/clyffy/governance

	Agent-policy devtool — the unified surface for what the agent is
	allowed to emit. Three layers visible in one shell:

	  • llguidance — constrained-decoding enforcement (kernel module
	    `cortex/llguidance/`, target `llguidance`).
	  • AG-UI — bi-directional event wire between agent + user app.
	  • A2UI — generative-UI payload schema the agent emits inside that
	    wire (Card / Button / TextField / DateTimeInput / …).

	# Phase 1 (this commit)
	Layout + real log feed only. Wire panel, Grammar Builder, and the
	live grammar-state surface land in subsequent phases when their
	kernel surfaces are wired (cortex `agui/` schema + Tauri commands
	for `GrammarHandle::status()` and the AG-UI event tap).
-->
<script lang="ts">
import { Text } from "@devpulse/coldlight/components/text";
import { type HealthBadge, ScopedLogPanel, ServiceDevtoolShell } from "#lib/devtools/index.js";

const badge: HealthBadge = {
	state: "unknown",
	label: "State surface pending",
};
</script>

<ServiceDevtoolShell
	health={badge}
>
	{#snippet status()}
		<div class="space-y-2">
			<Text size="sm" preset="flat">
				Live grammar state command not yet exposed. Real activity is in
				the Logs tab (tracing target <code>llguidance</code>).
			</Text>
		</div>
	{/snippet}

	{#snippet config()}
		<div class="space-y-2">
			<Text size="sm" preset="flat">
				Constrained decoding is configured under
				<code>[grammar]</code> in <code>platform.toml</code>. Fields:
				<code>enabled</code>, <code>critical</code>, <code>kind</code>
				(default <code>llguidance</code>). Edit the TOML and restart
				the platform to flip enforcement on.
			</Text>
		</div>
	{/snippet}

	{#snippet logs()}
		<ScopedLogPanel target="llguidance" />
	{/snippet}

	{#snippet actions()}
		<div class="space-y-2">
			<Text size="sm" preset="flat">
				No runtime actions yet — grammar reload, test-prompt, and
				violation clearing land with the kernel state surface.
			</Text>
		</div>
	{/snippet}

	{#snippet debug()}
		<div class="space-y-3">
			<div
				class="p-3 rounded-lg"
				style="background: var(--surface-raised); border: 1px solid var(--border-subtle);"
			>
				<Text size="sm" weight="semibold" class="block mb-2">Module map</Text>
				<div class="text-xs space-y-1">
					<div class="flex justify-between">
						<span style="color: var(--text-secondary)">Kernel module</span>
						<span class="font-mono">cortex::llguidance</span>
					</div>
					<div class="flex justify-between">
						<span style="color: var(--text-secondary)">Config struct</span>
						<span class="font-mono">GrammarConfig</span>
					</div>
					<div class="flex justify-between">
						<span style="color: var(--text-secondary)">Handle struct</span>
						<span class="font-mono">GrammarHandle</span>
					</div>
					<div class="flex justify-between">
						<span style="color: var(--text-secondary)">System table</span>
						<span class="font-mono">grammar_service (turso)</span>
					</div>
					<div class="flex justify-between">
						<span style="color: var(--text-secondary)">Tracing target</span>
						<span class="font-mono">llguidance</span>
					</div>
					<div class="flex justify-between">
						<span style="color: var(--text-secondary)">AG-UI bus</span>
						<span class="font-mono">cortex::agui (pending)</span>
					</div>
					<div class="flex justify-between">
						<span style="color: var(--text-secondary)">A2UI schema</span>
						<span class="font-mono">cortex::agui::schema (pending)</span>
					</div>
				</div>
			</div>
		</div>
	{/snippet}
</ServiceDevtoolShell>
