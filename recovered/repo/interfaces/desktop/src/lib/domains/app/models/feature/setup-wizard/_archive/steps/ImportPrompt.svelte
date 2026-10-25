<!--
  @file ImportPrompt.svelte
  Import mode selection overlay: copy or symlink. Slot picker.
  Colocated CSS. No renderForge.
-->
<script lang="ts">
import { Copy, FolderOpen, Link, X } from "lucide-svelte";

interface Props {
	open: boolean;
	filePath: string;
	slotId: string;
	onConfirm: (mode: "copy" | "symlink") => void;
	onCancel: () => void;
}
let { open, filePath, slotId, onConfirm, onCancel }: Props = $props();

let mode = $state<"copy" | "symlink">("copy");
const filename = $derived(filePath.split(/[\\/]/).pop() ?? filePath);
</script>

{#if open}
	<div class="backdrop" role="button" tabindex="0" aria-label="Close dialog"
		onclick={onCancel} onkeydown={(e) => { if (e.key === "Enter" || e.key === " ") onCancel(); }}>
		<div class="dialog" role="dialog" aria-modal="true" tabindex="-1"
			onclick={(e) => e.stopPropagation()}
			onkeydown={(e) => { if (e.key === "Escape") onCancel(); }}>
			<div class="dialog-header">
				<h3 class="dialog-title">Import Model</h3>
				<button class="btn-x" onclick={onCancel} aria-label="Close"><X size={18} /></button>
			</div>

			<p class="dialog-desc">
				Import <strong>{filename}</strong> for the <strong>{slotId}</strong> slot.
				Choose how to store it:
			</p>

			<div class="options">
				<label class="option" class:selected={mode === "copy"}>
					<input type="radio" name="import-mode" value="copy" bind:group={mode} />
					<Copy size={20} />
					<div>
						<span class="opt-label">Copy to models folder</span>
						<span class="opt-desc">Portable — file is duplicated. Uses more disk space but independent of original location.</span>
					</div>
				</label>

				<label class="option" class:selected={mode === "symlink"}>
					<input type="radio" name="import-mode" value="symlink" bind:group={mode} />
					<Link size={20} />
					<div>
						<span class="opt-label">Create link (symlink)</span>
						<span class="opt-desc">Saves space — points to original file. If you move or delete the original, the model breaks.</span>
					</div>
				</label>
			</div>

			<div class="dialog-actions">
				<button class="btn-outline" onclick={onCancel}>Cancel</button>
				<button class="btn-primary" onclick={() => onConfirm(mode)}>
					<FolderOpen size={14} /> Import as {mode === "copy" ? "Copy" : "Link"}
				</button>
			</div>
		</div>
	</div>
{/if}

<style>
	.backdrop { position:fixed;inset:0;z-index:50;display:flex;align-items:center;justify-content:center;background:oklch(0 0 0/0.6); }
	.dialog { width:100%;max-width:28rem;margin:1rem;padding:1.5rem;background:oklch(0.1 0.02 220);border:1px solid oklch(0.3 0.02 220/0.4);border-radius:0.75rem; }
	.dialog-header { display:flex;justify-content:space-between;align-items:center;margin-bottom:0.75rem; }
	.dialog-title { font-size:1.125rem;font-weight:700;color:oklch(0.93 0.015 224);margin:0; }
	.btn-x { background:none;border:none;color:oklch(0.5 0.02 220);cursor:pointer; }
	.dialog-desc { font-size:0.875rem;color:oklch(0.65 0.02 220);margin:0 0 1rem;line-height:1.5; }
	.dialog-desc strong { color:oklch(0.9 0.015 224); }

	.options { display:flex;flex-direction:column;gap:0.5rem;margin-bottom:1.25rem; }
	.option { display:flex;align-items:flex-start;gap:0.75rem;padding:0.875rem;border-radius:0.5rem;border:1px solid oklch(0.3 0.02 220/0.4);background:oklch(0.15 0.02 220/0.3);cursor:pointer;color:oklch(0.6 0.02 220); }
	.option.selected { border-color:oklch(0.65 0.17 185);background:oklch(0.15 0.03 185/0.2); }
	.option input { accent-color:oklch(0.65 0.17 185);margin-top:0.25rem; }
	.opt-label { display:block;font-size:0.875rem;font-weight:600;color:oklch(0.9 0.015 224); }
	.opt-desc { display:block;font-size:0.875rem;color:oklch(0.55 0.02 220);margin-top:0.25rem;line-height:1.4; }

	.dialog-actions { display:flex;justify-content:flex-end;gap:0.75rem; }
	.btn-primary { display:inline-flex;align-items:center;gap:0.375rem;padding:0.5rem 1rem;border-radius:0.5rem;border:none;background:oklch(0.65 0.17 185);color:oklch(0.12 0.02 220);font-size:0.875rem;font-weight:700;cursor:pointer; }
	.btn-outline { display:inline-flex;align-items:center;gap:0.375rem;padding:0.5rem 1rem;border-radius:0.5rem;border:1px solid oklch(0.3 0.03 220/0.5);background:transparent;color:oklch(0.75 0.02 220);font-size:0.875rem;cursor:pointer; }
</style>
