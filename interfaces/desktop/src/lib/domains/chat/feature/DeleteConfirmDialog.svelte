<!--
  @feature DeleteConfirmDialog — two-step destructive confirm
-->
<script lang="ts">
import { Button } from "$lib/design/components/button/index.js";
import Text from "$lib/design/components/text/Text.svelte";
import { TextField } from "$lib/design/components/text-field/index.js";

interface Props {
	open: boolean;
	mode: "delete-session" | "clear-all";
	onClose: () => void;
	onConfirm: () => void | Promise<void>;
}

let { open, mode, onClose, onConfirm }: Props = $props();

let step = $state<1 | 2>(1);
let phrase = $state("");

$effect(() => {
	if (!open) {
		step = 1;
		phrase = "";
	}
});

async function confirm() {
	if (step === 1) {
		step = 2;
		return;
	}
	if (mode === "clear-all" && phrase.trim().toUpperCase() !== "CLEAR") return;
	await onConfirm();
	onClose();
}
</script>

{#if open}
	<div class="fixed inset-0 z-[var(--chat-overlay-z,1001)] flex items-center justify-center bg-black/50 p-4" role="presentation">
		<div class="flex max-w-md flex-col gap-3 rounded-lg border border-[var(--accent-ember-main)] bg-[var(--surface-overlay)] p-4 shadow-[0_0_1rem_var(--accent-ember-glow)]">
			<Text size="sm" weight="semibold">
				{mode === "clear-all" ? "Clear all chat history?" : "Delete this session?"}
			</Text>
			{#if step === 2 && mode === "clear-all"}
				<Text size="xs" class="text-[var(--text-muted)]">Type CLEAR to confirm.</Text>
				<TextField value={phrase} onValueChange={(v) => (phrase = v)} placeholder="CLEAR" />
			{/if}
			<div class="flex justify-end gap-2">
				<Button preset="ghost" size="sm" onclick={onClose}>Cancel</Button>
				<Button preset="danger" size="sm" onclick={() => void confirm()}>
					{step === 1 ? "Continue" : "Confirm"}
				</Button>
			</div>
		</div>
	</div>
{/if}
