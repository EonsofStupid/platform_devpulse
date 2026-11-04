<!--
  @file src/lib/sys/debug/vpb/components/inspector/Inspector.svelte
  @description VPB Inspector - Block prop editing UI

  ColdLight molecules + token vars for styling.
  The sections are the old contract's groups; their fields are today's eight
  visual axes, whose options come from ColdLight's token manifest. A block
  node has no colour or panel props now (ColdLight's `ComponentSurfaceProps`),
  so those two sections say so instead of editing props nothing reads.

  @since 1.0.0
-->
<script lang="ts">
import { Button } from "@devpulse/coldlight/components/button";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
} from "@devpulse/coldlight/components/select";
import { toast } from "svelte-sonner";
import { copyState, fill } from "$lib/sys/copy/index.js";
import { type AxisKey, VPB_AXES, type VpbProps } from "../../registry/vpb-axes.js";
import { getKindSlots } from "../../registry/vpb-kinds.js";
import { recipesForKind } from "../../registry/vpb-recipes.js";
import { vpbDocument } from "../../state/vpb-document.svelte.js";
import { vpbVisual } from "../../state/vpb-visual.svelte.js";
import { kindLabel } from "../builder/palette.js";

const text = $derived(copyState.catalog?.vpb);
const sectionLabels = $derived({
	surface: text?.section_surface,
	frame: text?.section_frame,
	depth: text?.section_depth,
	motion: text?.section_motion,
});

// Which axes each section edits
const AXIS_SECTIONS: ReadonlyArray<{
	id: "surface" | "frame" | "depth" | "motion";
	axes: readonly AxisKey[];
}> = [
	{ id: "surface", axes: ["surface"] },
	{ id: "frame", axes: ["frame", "glow", "radius"] },
	{ id: "depth", axes: ["depth", "bevel"] },
	{ id: "motion", axes: ["motion", "transition"] },
];

// Local state for collapsed sections
let collapsedSections = $state<Set<string>>(new Set());

// Toggle section collapse
function toggleSection(id: string) {
	if (collapsedSections.has(id)) {
		collapsedSections.delete(id);
	} else {
		collapsedSections.add(id);
	}
	collapsedSections = new Set(collapsedSections);
}

const block = $derived(vpbDocument.selectedNode);
const props = $derived((block?.props ?? {}) as VpbProps);

// Get available recipes for selected block
const availableRecipes = $derived(block ? recipesForKind(block.kind) : []);

function axisLabel(key: AxisKey): string {
	return VPB_AXES.find((axis) => axis.key === key)?.label ?? key;
}

// Update one visual prop
function updateProp(key: AxisKey, value: string) {
	if (!block) return;
	vpbDocument.updateNodeProps(block.id, { ...props, [key]: value });
}

// Delete selected block, or every selected block
function deleteBlock() {
	if (!block) return;
	vpbDocument.removeNodes(
		vpbDocument.multiSelect.length > 1 ? vpbDocument.multiSelect : [block.id],
	);
}

// Copy selected block
function copyBlock() {
	if (block) vpbDocument.copy(block.id);
}

// Cut selected block
function cutBlock() {
	if (block) vpbDocument.cut(block.id);
}

// Paste into the selected slot, the selected block's first slot, or the root
function pasteBlock() {
	const copied = vpbDocument.clipboard.block;
	if (!copied) return;
	const slot = vpbDocument.selectedSlot ?? (block ? getKindSlots(block.kind)[0] : undefined);
	const parent = block && slot ? block : null;
	if (vpbDocument.paste(parent?.id ?? null, slot ?? "root")) return;
	toast.warning(
		fill(text?.refused ?? "", {
			kind: copied.kind,
			slot: slot ?? "",
			parent: parent?.kind ?? "",
		}),
	);
}
</script>

<div class="flex flex-col h-full overflow-hidden" data-slot="inspector-tab">
	<!-- Header -->
	<div class="vpb-section__heading flex items-center gap-2">
		<span class="vpb-section__dot" data-tone="inspector"></span>
		<h3 class="flex-1">{text?.inspector_heading}</h3>
	</div>

	<!-- Content -->
	<div class="flex-1 overflow-auto">
		{#if block}
			{@const kindCopy = text?.kinds?.[block.kind]}

			<!-- Block Info -->
			<div class="vpb-section">
				<div class="flex items-center gap-2">
					<span class="vpb-section__title">{kindCopy?.label ?? kindLabel(block.kind)}</span>
					<span class="vpb-section__meta">{block.id.slice(0, 12)}...</span>
				</div>
				{#if kindCopy}
					<p class="vpb-section__meta">{kindCopy.description}</p>
				{/if}
			</div>

			<!-- Recipe Selection -->
			{@render sectionHeader("recipe", text?.section_recipe)}
			{#if !collapsedSections.has("recipe")}
				<div class="vpb-section">
					<Select
						value={block.recipe}
						onValueChange={(value) => vpbDocument.updateNodeRecipe(block.id, value)}
						aria-label={text?.section_recipe}
					>
						<SelectTrigger class="w-full">
							{availableRecipes.find((r) => r.id === block.recipe)?.label ??
								fill(text?.custom_recipe ?? "", { recipe: block.recipe })}
						</SelectTrigger>
						<SelectContent>
							{#each availableRecipes as recipe (recipe.id)}
								<SelectItem value={recipe.id}>{recipe.label}</SelectItem>
							{/each}
						</SelectContent>
					</Select>
				</div>
			{/if}

			<!-- Color Props -->
			{@render sectionHeader("color", text?.section_color)}
			{#if !collapsedSections.has("color")}
				<p class="vpb-section vpb-section__meta">{text?.color_unavailable}</p>
			{/if}

			<!-- Surface, Frame, Depth and Motion Props -->
			{#each AXIS_SECTIONS as section (section.id)}
				{@render sectionHeader(section.id, sectionLabels[section.id])}
				{#if !collapsedSections.has(section.id)}
					<div class="vpb-section space-y-2">
						{#each section.axes as axis (axis)}
							{@const options = vpbVisual.context.options[axis]}
							<div class="flex items-center gap-2">
								<span class="vpb-section__label">{axisLabel(axis)}</span>
								<Select
									class="flex-1 min-w-0"
									value={props[axis] ?? ""}
									onValueChange={(value) => updateProp(axis, value)}
									disabled={options.length === 0}
									aria-label={axisLabel(axis)}
								>
									<SelectTrigger class="w-full">
										{props[axis] ?? text?.axis_default}
									</SelectTrigger>
									<SelectContent>
										{#each options as option (option.id)}
											<SelectItem value={option.id}>{option.id}</SelectItem>
										{/each}
									</SelectContent>
								</Select>
							</div>
						{/each}
					</div>
				{/if}
			{/each}

			<!-- Kind-specific Props (Panel) -->
			{#if block.kind === "panel" || block.kind === "card" || block.kind === "modal"}
				{@render sectionHeader("panel", text?.section_panel)}
				{#if !collapsedSections.has("panel")}
					<p class="vpb-section vpb-section__meta">{text?.panel_unavailable}</p>
				{/if}
			{/if}

			<!-- Slots -->
			{#if getKindSlots(block.kind).length > 0}
				{@render sectionHeader("slots", text?.section_slots)}
				{#if !collapsedSections.has("slots")}
					<div class="vpb-section space-y-1">
						{#each getKindSlots(block.kind) as slotName (slotName)}
							{@const children = block.slots?.[slotName] ?? []}
							<div class="vpb-tree__slot flex items-center gap-2">
								<span class="flex-1">{slotName}</span>
								<span class="vpb-section__meta">
									{fill(text?.slot_items ?? "", { count: children.length })}
								</span>
							</div>
						{/each}
					</div>
				{/if}
			{/if}
		{:else}
			<!-- No selection -->
			<div class="vpb-section text-center">
				<p class="vpb-section__title">{text?.no_block}</p>
				<p class="vpb-section__meta">{text?.no_block_body}</p>
				<p class="vpb-section__title mt-4">{text?.inspector_mode_title}</p>
				<p class="vpb-section__meta">{text?.inspector_mode_body}</p>
			</div>
		{/if}
	</div>

	<!-- Footer Actions -->
	{#if block || vpbDocument.clipboard.block}
		<div class="vpb-section__footer flex items-center gap-1">
			<Button variant="secondary" size="sm" class="flex-1" onclick={copyBlock} disabled={!block}>
				{text?.copy}
			</Button>
			<Button variant="secondary" size="sm" class="flex-1" onclick={cutBlock} disabled={!block}>
				{text?.cut}
			</Button>
			<Button
				variant="secondary"
				size="sm"
				class="flex-1"
				onclick={pasteBlock}
				disabled={!vpbDocument.clipboard.block}
			>
				{text?.paste}
			</Button>
			<Button variant="danger" size="sm" class="flex-1" onclick={deleteBlock} disabled={!block}>
				{text?.delete}
			</Button>
		</div>
	{/if}
</div>

{#snippet sectionHeader(id: string, label: string | undefined)}
	<button
		class="vpb-section__toggle flex items-center gap-2 w-full"
		data-state={collapsedSections.has(id) ? "collapsed" : "open"}
		onclick={() => toggleSection(id)}
	>
		<span class="vpb-section__chevron">▶</span>
		<span>{label}</span>
	</button>
{/snippet}
