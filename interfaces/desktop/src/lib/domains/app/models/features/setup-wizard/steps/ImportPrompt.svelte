<!--
  @file ImportPrompt.svelte
  @module @devpulse/domains/app/models/features/setup-wizard/steps/ImportPrompt

  Modal overlay for import mode selection: copy (portable) or symlink (saves space).
  NOTE: Until Sprint 5 modifies Rust command, import always copies to models/chat/.
-->
<script lang="ts">
import { Copy, Link, X } from "lucide-svelte";
import { Text } from "$lib/design/components/text/index.js";
import { box } from "$lib/design/utils/box/index.js";
import { cn } from "$lib/design/utils/cn.js";
import { hstack } from "$lib/design/utils/hstack/index.js";
import { stack } from "$lib/design/utils/stack/index.js";
import { friendlySlotLabel } from "../../../types/models.types.js";
import { slotToSubdir } from "../import-router.js";
import type { ImportMode } from "../wizard.types.js";

interface Props {
	targetSlot: string;
	onClose: () => void;
	onComplete: (filename: string) => void;
}

let { targetSlot, onClose, onComplete }: Props = $props();

let importMode = $state<ImportMode>("copy");
let importing = $state(false);
let error = $state<string | null>(null);

async function handleImport(): Promise<void> {
	importing = true;
	error = null;
	try {
		// TODO(Sprint-5): Pass targetSlot + importMode to backend
		// Current backend hardcodes to models/chat/ — Sprint 5 fixes this
		const { importLocalModel } = await import("../../../services/download.service.js");
		const filename = await importLocalModel();
		onComplete(filename);
	} catch (e) {
		error = e instanceof Error ? e.message : String(e);
	} finally {
		importing = false;
	}
}
</script>

<!-- Overlay backdrop -->
<div
	class="fixed inset-0 z-50 flex items-center justify-center"
	style="background: var(--overlay-backdrop);"
	role="dialog"
	aria-label="Import model"
>
	<div
		class={cn(stack({ gap: "6" }), "w-full max-w-lg rounded-xl p-6 border")}
		style="background: var(--surface-elevated); border-color: var(--border-subtle);"
	>
		<!-- Header -->
		<div class={hstack({ gap: "4", align: "center", justify: "between" })}>
			<Text size="lg" weight="bold" color="primary">Import Model</Text>
			<button
				class="rounded p-1 transition-colors"
				style="color: var(--text-muted);"
				onclick={onClose}
				aria-label="Close import dialog"
			>
				<X size={18} />
			</button>
		</div>

		<!-- Target info -->
		<div class={stack({ gap: "2" })}>
			<Text size="sm" color="secondary">
				Importing for: <strong>{friendlySlotLabel(targetSlot)}</strong>
			</Text>
			<Text size="xs" color="muted">
				Target: ~/.devpulse/models/{slotToSubdir(targetSlot)}/
			</Text>
		</div>

		<!-- Mode selection -->
		<div class={stack({ gap: "4" })}>
			<!-- Copy option -->
			<label
				class={cn("flex gap-3 rounded-lg p-4 cursor-pointer border transition-colors",
					importMode === "copy" ? "border-[var(--accent-teal-main)]" : "")}
				style="background: var(--surface-base); border-color: {importMode === 'copy' ? 'var(--accent-teal-main)' : 'var(--border-subtle)'};"
			>
				<input
					type="radio"
					name="import-mode"
					value="copy"
					checked={importMode === "copy"}
					onchange={() => (importMode = "copy")}
					class="sr-only"
				/>
				<Copy size={16} class="shrink-0 mt-0.5" style="color: var(--text-secondary);" />
				<div class={stack({ gap: "1" })}>
					<Text size="sm" weight="bold" color="primary">Copy to DevPulse</Text>
					<Text size="xs" color="muted">
						Portable — model travels with your DevPulse install.
						Uses additional disk space.
					</Text>
				</div>
			</label>

			<!-- Symlink option -->
			<label
				class={cn("flex gap-3 rounded-lg p-4 cursor-pointer border transition-colors",
					importMode === "symlink" ? "border-[var(--accent-teal-main)]" : "")}
				style="background: var(--surface-base); border-color: {importMode === 'symlink' ? 'var(--accent-teal-main)' : 'var(--border-subtle)'};"
			>
				<input
					type="radio"
					name="import-mode"
					value="symlink"
					checked={importMode === "symlink"}
					onchange={() => (importMode = "symlink")}
					class="sr-only"
				/>
				<Link size={16} class="shrink-0 mt-0.5" style="color: var(--text-secondary);" />
				<div class={stack({ gap: "1" })}>
					<Text size="sm" weight="bold" color="primary">Create Symlink</Text>
					<Text size="xs" color="muted">
						No additional disk space. NOT portable — breaks if source file moves.
						Use this if you also run Ollama, LM Studio, or other tools sharing the same model files.
					</Text>
				</div>
			</label>
		</div>

		<!-- Error display — raw -->
		{#if error}
			<div
				class={cn(box({ paddingX: "12", paddingY: "8" }), "rounded-md")}
				style="background: var(--signal-error); color: var(--text-primary);"
			>
				<Text size="xs" color="primary">{error}</Text>
			</div>
		{/if}

		<!-- Actions -->
		<div class={hstack({ gap: "3", justify: "end" })}>
			<button
				class="rounded-lg px-4 py-2 text-sm transition-colors"
				style="color: var(--text-muted);"
				onclick={onClose}
			>
				Cancel
			</button>
			<button
				class="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-bold transition-all disabled:opacity-40"
				style="background: var(--accent-teal-main); color: var(--surface-base);"
				onclick={handleImport}
				disabled={importing}
			>
				{importing ? "Importing..." : "Import"}
			</button>
		</div>
	</div>
</div>
