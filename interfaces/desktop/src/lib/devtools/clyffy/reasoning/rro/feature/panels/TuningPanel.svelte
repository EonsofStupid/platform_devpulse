<!--
	@component TuningPanel
	@kind sys.rro.feature
	@layer feature
	@description Presets + per-field sliders driven by param meta from Rust.
-->
<script lang="ts">
import { Badge } from "@devpulse/coldlight/components/badge";
import { Button } from "@devpulse/coldlight/components/button";
import { Callout } from "@devpulse/coldlight/components/callout";
import { Card } from "@devpulse/coldlight/components/card";
import { Slider } from "@devpulse/coldlight/components/slider";
import { Text } from "@devpulse/coldlight/components/text";
import { Settings2 } from "lucide-svelte";
import { rroState } from "$lib/sys/data-access/rro/rro.state.svelte.js";
import { CapabilityHeader, ErrorCallout } from "../../ui/index.js";
import { formatField } from "../../util/rro.format.js";
import { RRO_STATE_NARRATIONS } from "../../util/rro.narrations.js";
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
			<Settings2 size={14} class="text-[var(--accent-service-main)]" />
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
			<Callout variant="info" preset="flat">
				<Text size="xs">{line}</Text>
			</Callout>
		{/each}
	</div>
</Card>

<!-- Depth is now in the State tab (real, live control) -->
<Callout variant="tip" preset="flat">
	<Text size="xs">
		Looking for deliberation depth (shallow / normal / deep)? It's on the State tab now — it's
		a live control, not a preset.
	</Text>
</Callout>
