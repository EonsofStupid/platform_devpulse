<!--
  @file src/lib/sys/debug/vpb/components/inspector/Inspector.svelte
  @description VPB Inspector - Block prop editing UI

  Uses dp-surface + data-* attributes for styling.
  Consumes taxonomy/contracts for prop validation.
  Uses tokens/types for dropdown options.

  @since 1.0.0
-->
<script lang="ts">
import { getKindDefinition } from "$lib/design/taxonomy/vpb";
import {
	AccentTokens,
	BevelTokens,
	BlurTokens,
	GlassVariantTokens,
	GlowTokens,
	PaddingTokens,
	RadiusTokens,
	SurfaceTokens,
	TokenArrays,
} from "$lib/design/tokens/types";
import { vpb } from "../../state/vpb.svelte";
import { getPaletteItem, getRecipesForPaletteItem } from "../builder/palette";

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

// Get available recipes for selected block
let availableRecipes = $derived(() => {
	const block = vpb.selectedBlock;
	if (!block) return [];
	const paletteItem = getPaletteItem(block.kind);
	if (!paletteItem) return [];
	return getRecipesForPaletteItem(paletteItem);
});

// Update a nested prop
function updateProp(path: string, value: unknown) {
	if (!vpb.selection.blockId) return;

	const block = vpb.selectedBlock;
	if (!block) return;

	// Parse path and create nested update
	const parts = path.split(".");
	const newProps = { ...(block.props as Record<string, unknown>) };

	let current: Record<string, unknown> = newProps;
	for (let i = 0; i < parts.length - 1; i++) {
		const key = parts[i];
		if (typeof current[key] !== "object" || current[key] === null) {
			current[key] = {};
		}
		current[key] = { ...(current[key] as Record<string, unknown>) };
		current = current[key] as Record<string, unknown>;
	}
	current[parts[parts.length - 1]] = value;

	vpb.updateProps(vpb.selection.blockId, newProps);
}

// Get nested prop value
function getProp(path: string): unknown {
	const block = vpb.selectedBlock;
	if (!block) return undefined;

	const parts = path.split(".");
	let current: unknown = block.props;
	for (const part of parts) {
		if (typeof current !== "object" || current === null) return undefined;
		current = (current as Record<string, unknown>)[part];
	}
	return current;
}

// Delete selected block
function deleteBlock() {
	if (vpb.selection.blockId) {
		vpb.removeBlock(vpb.selection.blockId);
	}
}

// Copy selected block
function copyBlock() {
	if (vpb.selection.blockId) {
		vpb.copy(vpb.selection.blockId);
	}
}
</script>

<div class="flex flex-col h-full overflow-hidden">
    <!-- Header -->
    <div class="flex items-center gap-2 px-3 py-2 border-b border-white/5">
        <div class="w-2 h-2 rounded-full bg-teal-400"></div>
        <h3 class="text-xs font-bold text-secondary uppercase tracking-wider flex-1">
            Inspector
        </h3>
    </div>

    <!-- Content -->
    <div class="flex-1 overflow-auto">
        {#if vpb.selectedBlock}
            {@const block = vpb.selectedBlock}
            {@const kindDef = getKindDefinition(block.kind)}

            <!-- Block Info -->
            <div class="p-3 border-b border-white/5">
                <div class="flex items-center gap-2 mb-2">
                    <span class="text-xs font-bold text-secondary">{block.kind}</span>
                    <span class="text-[10px] text-muted font-mono">{block.id.slice(0, 12)}...</span>
                </div>
                <p class="text-[10px] text-muted">{kindDef.description}</p>
            </div>

            <!-- Recipe Selection -->
            <div class="p-3 border-b border-white/5">
                <button
                    class="w-full flex items-center gap-2 text-xs font-medium text-secondary mb-2"
                    onclick={() => toggleSection("recipe")}
                >
                    <span class="text-muted transition-transform" class:rotate-90={!collapsedSections.has("recipe")}>▶</span>
                    <span>Recipe</span>
                </button>
                {#if !collapsedSections.has("recipe")}
                    <select
                        class="dp-surface w-full px-2 py-1.5 text-xs rounded"
                        data-surface="matte"
                        value={block.recipe}
                        onchange={(e) => vpb.updateRecipe(block.id, e.currentTarget.value)}
                    >
                        {#each availableRecipes() as recipe}
                            <option value={recipe.id}>{recipe.id}</option>
                        {/each}
                        {#if !availableRecipes().some(r => r.id === block.recipe)}
                            <option value={block.recipe}>{block.recipe} (custom)</option>
                        {/if}
                    </select>
                {/if}
            </div>

            <!-- Color Props -->
            <div class="p-3 border-b border-white/5">
                <button
                    class="w-full flex items-center gap-2 text-xs font-medium text-secondary mb-2"
                    onclick={() => toggleSection("color")}
                >
                    <span class="text-muted transition-transform" class:rotate-90={!collapsedSections.has("color")}>▶</span>
                    <span>Color</span>
                </button>
                {#if !collapsedSections.has("color")}
                    <div class="space-y-2">
                        <!-- Color Mode -->
                        <div class="flex items-center gap-2">
                            <label class="text-[10px] text-muted w-16">Mode</label>
                            <select
                                class="dp-surface flex-1 px-2 py-1 text-xs rounded"
                                data-surface="matte"
                                value={getProp("color.mode") ?? "mono"}
                                onchange={(e) => updateProp("color.mode", e.currentTarget.value)}
                            >
                                <option value="mono">Mono</option>
                                <option value="duo">Duo</option>
                            </select>
                        </div>
                        <!-- Accent A -->
                        <div class="flex items-center gap-2">
                            <label class="text-[10px] text-muted w-16">Accent A</label>
                            <select
                                class="dp-surface flex-1 px-2 py-1 text-xs rounded"
                                data-surface="matte"
                                value={getProp("color.a") ?? "teal"}
                                onchange={(e) => updateProp("color.a", e.currentTarget.value)}
                            >
                                {#each AccentTokens as accent}
                                    <option value={accent}>{accent}</option>
                                {/each}
                            </select>
                        </div>
                        <!-- Accent B (if duo) -->
                        {#if getProp("color.mode") === "duo"}
                            <div class="flex items-center gap-2">
                                <label class="text-[10px] text-muted w-16">Accent B</label>
                                <select
                                    class="dp-surface flex-1 px-2 py-1 text-xs rounded"
                                    data-surface="matte"
                                    value={getProp("color.b") ?? "purple"}
                                    onchange={(e) => updateProp("color.b", e.currentTarget.value)}
                                >
                                    {#each AccentTokens as accent}
                                        <option value={accent}>{accent}</option>
                                    {/each}
                                </select>
                            </div>
                        {/if}
                    </div>
                {/if}
            </div>

            <!-- Surface Props -->
            <div class="p-3 border-b border-white/5">
                <button
                    class="w-full flex items-center gap-2 text-xs font-medium text-secondary mb-2"
                    onclick={() => toggleSection("surface")}
                >
                    <span class="text-muted transition-transform" class:rotate-90={!collapsedSections.has("surface")}>▶</span>
                    <span>Surface</span>
                </button>
                {#if !collapsedSections.has("surface")}
                    <div class="space-y-2">
                        <!-- Finish -->
                        <div class="flex items-center gap-2">
                            <label class="text-[10px] text-muted w-16">Finish</label>
                            <select
                                class="dp-surface flex-1 px-2 py-1 text-xs rounded"
                                data-surface="matte"
                                value={getProp("surface.finish") ?? "glass"}
                                onchange={(e) => updateProp("surface.finish", e.currentTarget.value)}
                            >
                                {#each SurfaceTokens as surface}
                                    <option value={surface}>{surface}</option>
                                {/each}
                            </select>
                        </div>
                        <!-- Clarity -->
                        <div class="flex items-center gap-2">
                            <label class="text-[10px] text-muted w-16">Clarity</label>
                            <select
                                class="dp-surface flex-1 px-2 py-1 text-xs rounded"
                                data-surface="matte"
                                value={getProp("surface.clarity") ?? "deep"}
                                onchange={(e) => updateProp("surface.clarity", e.currentTarget.value)}
                            >
                                {#each GlassVariantTokens as variant}
                                    <option value={variant}>{variant}</option>
                                {/each}
                            </select>
                        </div>
                    </div>
                {/if}
            </div>

            <!-- Frame Props -->
            <div class="p-3 border-b border-white/5">
                <button
                    class="w-full flex items-center gap-2 text-xs font-medium text-secondary mb-2"
                    onclick={() => toggleSection("frame")}
                >
                    <span class="text-muted transition-transform" class:rotate-90={!collapsedSections.has("frame")}>▶</span>
                    <span>Frame</span>
                </button>
                {#if !collapsedSections.has("frame")}
                    <div class="space-y-2">
                        <!-- Glow -->
                        <div class="flex items-center gap-2">
                            <label class="text-[10px] text-muted w-16">Glow</label>
                            <select
                                class="dp-surface flex-1 px-2 py-1 text-xs rounded"
                                data-surface="matte"
                                value={getProp("frame.glow") ?? "off"}
                                onchange={(e) => updateProp("frame.glow", e.currentTarget.value)}
                            >
                                {#each GlowTokens as glow}
                                    <option value={glow}>{glow}</option>
                                {/each}
                            </select>
                        </div>
                    </div>
                {/if}
            </div>

            <!-- Depth Props -->
            <div class="p-3 border-b border-white/5">
                <button
                    class="w-full flex items-center gap-2 text-xs font-medium text-secondary mb-2"
                    onclick={() => toggleSection("depth")}
                >
                    <span class="text-muted transition-transform" class:rotate-90={!collapsedSections.has("depth")}>▶</span>
                    <span>Depth</span>
                </button>
                {#if !collapsedSections.has("depth")}
                    <div class="space-y-2">
                        <!-- Intent -->
                        <div class="flex items-center gap-2">
                            <label class="text-[10px] text-muted w-16">Intent</label>
                            <select
                                class="dp-surface flex-1 px-2 py-1 text-xs rounded"
                                data-surface="matte"
                                value={getProp("depth.intent") ?? "flat"}
                                onchange={(e) => updateProp("depth.intent", e.currentTarget.value)}
                            >
                                <option value="flat">Flat</option>
                                <option value="raised">Raised</option>
                                <option value="sunken">Sunken</option>
                                <option value="floating">Floating</option>
                            </select>
                        </div>
                        <!-- Bevel -->
                        <div class="flex items-center gap-2">
                            <label class="text-[10px] text-muted w-16">Bevel</label>
                            <select
                                class="dp-surface flex-1 px-2 py-1 text-xs rounded"
                                data-surface="matte"
                                value={getProp("depth.bevel.level") ?? "off"}
                                onchange={(e) => updateProp("depth.bevel.level", e.currentTarget.value)}
                            >
                                {#each BevelTokens as bevel}
                                    <option value={bevel}>{bevel}</option>
                                {/each}
                            </select>
                        </div>
                    </div>
                {/if}
            </div>

            <!-- Kind-specific Props (Panel) -->
            {#if block.kind === "panel" || block.kind === "card" || block.kind === "modal"}
                <div class="p-3 border-b border-white/5">
                    <button
                        class="w-full flex items-center gap-2 text-xs font-medium text-secondary mb-2"
                        onclick={() => toggleSection("panel")}
                    >
                        <span class="text-muted transition-transform" class:rotate-90={!collapsedSections.has("panel")}>▶</span>
                        <span>Panel</span>
                    </button>
                    {#if !collapsedSections.has("panel")}
                        <div class="space-y-2">
                            <!-- Padding -->
                            <div class="flex items-center gap-2">
                                <label class="text-[10px] text-muted w-16">Padding</label>
                                <select
                                    class="dp-surface flex-1 px-2 py-1 text-xs rounded"
                                    data-surface="matte"
                                    value={getProp("panel.padding") ?? "md"}
                                    onchange={(e) => updateProp("panel.padding", e.currentTarget.value)}
                                >
                                    {#each PaddingTokens as padding}
                                        <option value={padding}>{padding}</option>
                                    {/each}
                                </select>
                            </div>
                            <!-- Scrollable -->
                            <div class="flex items-center gap-2">
                                <label class="text-[10px] text-muted w-16">Scrollable</label>
                                <input
                                    type="checkbox"
                                    class="dp-toggle"
                                    checked={getProp("panel.scrollable") === true}
                                    onchange={(e) => updateProp("panel.scrollable", e.currentTarget.checked)}
                                />
                            </div>
                        </div>
                    {/if}
                </div>
            {/if}

            <!-- Slots -->
            {#if kindDef.slots.length > 0}
                <div class="p-3 border-b border-white/5">
                    <button
                        class="w-full flex items-center gap-2 text-xs font-medium text-secondary mb-2"
                        onclick={() => toggleSection("slots")}
                    >
                        <span class="text-muted transition-transform" class:rotate-90={!collapsedSections.has("slots")}>▶</span>
                        <span>Slots</span>
                    </button>
                    {#if !collapsedSections.has("slots")}
                        <div class="space-y-1">
                            {#each kindDef.slots as slotName}
                                {@const children = block.slots?.[slotName] ?? []}
                                <div class="dp-surface flex items-center gap-2 px-2 py-1.5 rounded text-xs" data-surface="matte" data-variant="subtle">
                                    <span class="text-muted">{slotName}</span>
                                    <span class="flex-1"></span>
                                    <span class="text-[10px] text-muted">{children.length} items</span>
                                </div>
                            {/each}
                        </div>
                    {/if}
                </div>
            {/if}

        {:else}
            <!-- No selection -->
            <div class="p-4 text-center">
                <div class="text-muted text-xs mb-2">No block selected</div>
                <p class="text-[10px] text-muted">
                    Select a block from the tree or add one from the Builder palette.
                </p>
            </div>
        {/if}
    </div>

    <!-- Footer Actions -->
    {#if vpb.selectedBlock}
        <div class="flex items-center gap-1 px-3 py-2 border-t border-white/5">
            <button
                class="dp-surface flex-1 px-2 py-1 text-xs rounded"
                data-surface="matte"
                data-variant="subtle"
                onclick={copyBlock}
            >
                Copy
            </button>
            <button
                class="dp-surface flex-1 px-2 py-1 text-xs rounded text-red-400"
                data-surface="matte"
                data-variant="subtle"
                onclick={deleteBlock}
            >
                Delete
            </button>
        </div>
    {/if}
</div>
