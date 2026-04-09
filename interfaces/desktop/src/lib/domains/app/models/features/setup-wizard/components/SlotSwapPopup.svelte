<!--
  @file SlotSwapPopup.svelte
  Commandment #6: Popups are decision forks.
  2-4 options max. Each shows: friendly name, size, fits? (green/red).
  Bottom: "Browse all models" link. Closes on selection.
-->
<script lang="ts">
import { Check, ChevronRight, X } from "lucide-svelte";
import type { ModelInfo } from "$lib/sys/generated/bindings.js";
import { hardwareState } from "../../../runes/hardware.runes.svelte.js";
import { modelsState } from "../../../runes/models.runes.svelte.js";
import { formatMb } from "../../../types/models.types.js";
import { friendlyName, getSlotLabel, ROLE_COLORS } from "../wizard.types.js";

interface Props {
	slotId: string;
	onSelect: (modelId: string) => void;
	onBrowseAll: () => void;
	onClose: () => void;
}
let { slotId, onSelect, onBrowseAll, onClose }: Props = $props();

const label = $derived(getSlotLabel(slotId));
const roleColor = $derived(label ? ROLE_COLORS[label.role] : null);
const slot = $derived(modelsState.slots.find((s) => s.id === slotId));

/** Get compatible models, sorted by VRAM (smallest first). Max 4. */
const options = $derived.by((): Array<ModelInfo & { fits: boolean; recommended: boolean }> => {
	const cap = slot?.capability ?? "";
	const compatible = modelsState.modelsForCapability(cap);
	const sorted = [...compatible].sort((a, b) => a.vram_estimate_mb - b.vram_estimate_mb);
	const vramFree = hardwareState.vramFreeMb ?? 0;

	// Mark recommended (smallest that fits) and fit status
	let recommendedFound = false;
	return sorted.slice(0, 4).map((m) => {
		const fits = m.vram_estimate_mb <= vramFree || !hardwareState.hasGpu;
		const recommended = fits && !recommendedFound;
		if (recommended) recommendedFound = true;
		return { ...m, fits, recommended };
	});
});

function handleSelect(modelId: string): void {
	onSelect(modelId);
	onClose();
}
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="popup-backdrop" onclick={onClose} onkeydown={(e) => e.key === "Escape" && onClose()}>
	<div class="popup" onclick={(e) => e.stopPropagation()} onkeydown={(e) => e.key === "Escape" && onClose()} role="dialog" aria-label="Change model for {label?.name ?? slotId}" tabindex="-1">
		<div class="popup-header" style="border-bottom-color: {roleColor?.accent ?? 'var(--wiz-border)'};">
			<h3 class="popup-title">Change {label?.name ?? slotId}</h3>
			<button class="btn-close" onclick={onClose} aria-label="Close"><X size={16} /></button>
		</div>

		{#if options.length === 0}
			<div class="popup-empty">
				<p>No compatible models found on disk.</p>
				<button class="btn-browse" onclick={() => { onBrowseAll(); onClose(); }}>
					Browse or download models <ChevronRight size={14} />
				</button>
			</div>
		{:else}
			<div class="popup-options">
				{#each options as opt (opt.id)}
					<button
						class="option-btn"
						class:recommended={opt.recommended}
						class:no-fit={!opt.fits}
						onclick={() => handleSelect(opt.id)}
					>
						<div class="opt-info">
							<span class="opt-name">
								{opt.filename.replace(/\.(gguf|safetensors|onnx|bin)$/i, "").replace(/-/g, " ")}
							</span>
							<span class="opt-meta">
								{formatMb(opt.size_mb)} · {formatMb(opt.vram_estimate_mb)} VRAM
								{#if opt.quant_level} · {opt.quant_level}{/if}
							</span>
						</div>
						<div class="opt-fit">
							{#if opt.recommended}
								<span class="fit-badge recommended"><Check size={10} /> Recommended</span>
							{:else if opt.fits}
								<span class="fit-badge fits">Fits</span>
							{:else}
								<span class="fit-badge no-fit">Too large</span>
							{/if}
						</div>
					</button>
				{/each}
			</div>

			<div class="popup-footer">
				<button class="btn-browse" onclick={() => { onBrowseAll(); onClose(); }}>
					Browse all models <ChevronRight size={14} />
				</button>
			</div>
		{/if}
	</div>
</div>

<style>
	.popup-backdrop {
		position: fixed; inset: 0; z-index: var(--wiz-z-modal);
		background: oklch(0 0 0 / 0.5); backdrop-filter: blur(4px);
		display: flex; align-items: center; justify-content: center;
		animation: fade-in 100ms ease-out;
	}
	@keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }

	.popup {
		width: 100%; max-width: 24rem; border-radius: var(--wiz-radius-xl);
		background: var(--wiz-overlay); border: 1px solid var(--wiz-border);
		box-shadow: var(--wiz-shadow-xl); overflow: hidden;
		animation: scale-in 150ms ease-out;
	}
	@keyframes scale-in { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }

	.popup-header {
		display: flex; align-items: center; justify-content: space-between;
		padding: 0.75rem 1rem; border-bottom: 2px solid var(--wiz-border);
	}
	.popup-title { font-size: var(--wiz-text-sm); font-weight: 700; color: var(--wiz-text); margin: 0; }
	.btn-close {
		display: inline-flex; padding: 0.25rem; border-radius: var(--wiz-radius-sm);
		border: none; background: transparent; color: var(--wiz-text-muted); cursor: pointer;
	}
	.btn-close:hover { color: var(--wiz-text); }

	.popup-empty {
		padding: 1.5rem 1rem; text-align: center;
		display: flex; flex-direction: column; align-items: center; gap: 0.75rem;
	}
	.popup-empty p { font-size: var(--wiz-text-sm); color: var(--wiz-text-muted); margin: 0; }

	.popup-options { display: flex; flex-direction: column; }

	.option-btn {
		display: flex; align-items: center; justify-content: space-between;
		padding: 0.75rem 1rem; border: none; background: transparent;
		border-bottom: 1px solid var(--wiz-void-800); cursor: pointer;
		transition: background var(--wiz-duration-fast); text-align: left;
	}
	.option-btn:hover { background: var(--wiz-card); }
	.option-btn:last-child { border-bottom: none; }
	.option-btn.recommended { background: var(--wiz-fill-cyan); }
	.option-btn.recommended:hover { background: var(--wiz-fill-cyan); }
	.option-btn.no-fit { opacity: 0.6; }

	.opt-info { display: flex; flex-direction: column; gap: 0.125rem; }
	.opt-name { font-size: var(--wiz-text-sm); font-weight: 600; color: var(--wiz-text); }
	.opt-meta { font-size: var(--wiz-text-xs); color: var(--wiz-text-muted); }

	.fit-badge {
		font-size: var(--wiz-text-xs); font-weight: 600;
		padding: 0.125rem 0.375rem; border-radius: var(--wiz-radius-full);
		display: inline-flex; align-items: center; gap: 0.125rem;
	}
	.fit-badge.recommended { color: var(--wiz-cyan); background: var(--wiz-fill-cyan); }
	.fit-badge.fits { color: var(--wiz-green); background: var(--wiz-fill-green); }
	.fit-badge.no-fit { color: var(--wiz-salmon); background: var(--wiz-fill-ember); }

	.popup-footer {
		padding: 0.75rem 1rem; border-top: 1px solid var(--wiz-border);
		display: flex; justify-content: center;
	}
	.btn-browse {
		display: inline-flex; align-items: center; gap: 0.25rem;
		border: none; background: transparent; color: var(--wiz-text-muted);
		font-size: var(--wiz-text-xs); cursor: pointer;
	}
	.btn-browse:hover { color: var(--wiz-cyan); }
</style>
