<!--
	@component TuningPanel
	@kind sys.rro.feature
	@layer feature
	@description Presets + per-field sliders driven by param meta from Rust.
-->
<script lang="ts">
import { Settings2 } from "lucide-svelte";
import { Badge } from "$lib/design/components/badge/index.js";
import { Button } from "$lib/design/components/button/index.js";
import { Callout } from "$lib/design/components/callout/index.js";
import { Card } from "$lib/design/components/card/index.js";
import { Slider } from "$lib/design/components/slider/index.js";
import { Text } from "$lib/design/components/text/index.js";
import { rroState } from "../../data-access/rro.state.svelte.js";
import { CapabilityHeader, ErrorCallout } from "../../ui/index.js";
import { formatField } from "../../util/rro.format.js";
import { RRO_DEPTH_NARRATIONS, RRO_STATE_NARRATIONS } from "../../util/rro.narrations.js";
import { RRO_PRESETS } from "../../util/rro.presets.js";

function fieldValue(field: string): number {
	if (!rroState.config) return 0;
	return (rroState.config as unknown as Record<string, number>)[field];
}
</script>

<ErrorCallout prefix="Tuning error" message={rroState.configError} />

<Card preset="glass">
	<div class="p-3 space-y-3">
		{#snippet icon()}
			<Settings2 size={14} class="text-[var(--color-teal-400)]" />
		{/snippet}
		{#snippet actions()}
			{#if rroState.config?.preset === "custom"}
				<Badge variant="notice" size="sm" fillStyle="subtle">Custom</Badge>
			{/if}
		{/snippet}
		<CapabilityHeader
			title="Quick presets"
			subtitle="Start with a preset, or adjust the sliders below for fine control."
			{icon}
			{actions}
		/>

		<div class="grid grid-cols-2 gap-2">
			{#each RRO_PRESETS as p}
				<Button
					preset={rroState.config?.preset === p.name ? "primary" : "secondary"}
					size="sm"
					onclick={() => rroState.applyPreset(p.name)}
				>
					<div class="text-left w-full">
						<div class="font-medium">{p.label}</div>
						<div class="text-xs opacity-80">{p.description}</div>
					</div>
				</Button>
			{/each}
		</div>
	</div>
</Card>

{#if rroState.paramMeta.length > 0 && rroState.config}
	<Card preset="glass">
		<div class="p-3 space-y-4">
			<Text size="sm" weight="semibold">Fine-tune</Text>
			{#each rroState.paramMeta as param}
				<div class="space-y-2">
					<div class="flex items-start justify-between gap-3">
						<div class="flex-1">
							<Text size="sm" weight="medium">{param.label}</Text>
							<Text size="xs" preset="flat">{param.description}</Text>
						</div>
						<Badge variant="accent" size="sm" fillStyle="outline">
							{formatField(param.field, fieldValue(param.field))}
						</Badge>
					</div>
					<Slider
						min={param.min}
						max={param.max}
						step={param.step}
						value={fieldValue(param.field)}
						onValueChange={(v) => rroState.updateField(param.field, v)}
					/>
				</div>
			{/each}
		</div>
	</Card>
{/if}

<!-- Educational narration from signals catalog -->
<Card preset="flat">
	<div class="p-3 space-y-2">
		<Text size="sm" weight="semibold">Why this matters</Text>
		{#each RRO_STATE_NARRATIONS.ruminating.learning ?? [] as line}
			<Callout variant="tip" preset="flat">
				<Text size="xs">{line}</Text>
			</Callout>
		{/each}
		{#each RRO_STATE_NARRATIONS.gathering.learning ?? [] as line}
			<Callout variant="tip" preset="flat">
				<Text size="xs">{line}</Text>
			</Callout>
		{/each}
	</div>
</Card>

<!-- Depth presets — narrated, live control lands with kernel rumination loop -->
<Card preset="flat">
	<div class="p-3 space-y-2">
		<div class="flex items-center gap-2">
			<Text size="sm" weight="semibold">Deliberation depth</Text>
			<Badge variant="neutral" size="sm" fillStyle="outline">Lands with kernel</Badge>
		</div>
		<div class="space-y-1.5">
			{#each ["shallow", "normal", "deep"] as depth}
				{@const n = RRO_DEPTH_NARRATIONS[depth]}
				<div class="flex items-center justify-between gap-2">
					<div class="flex-1">
						<Text size="sm" weight="medium">{depth}</Text>
						<Text size="xs" preset="flat">{n.layman[0]}</Text>
					</div>
					{#if n.learning}
						<Text size="xs" preset="flat">{n.learning[0]}</Text>
					{/if}
				</div>
			{/each}
		</div>
	</div>
</Card>
