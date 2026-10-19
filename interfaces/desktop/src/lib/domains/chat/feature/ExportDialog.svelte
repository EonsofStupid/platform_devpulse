<!--
  @feature ExportDialog — format + path via IPC
-->
<script lang="ts">
import { Button } from "@devpulse/coldlight/components/button";
import { Text } from "@devpulse/coldlight/components/text";
import type { ExportFormat } from "$lib/sys/generated/bindings.js";
import * as exportService from "../data-access/export.service.js";

interface Props {
	open: boolean;
	sessionId: string | null;
	onClose: () => void;
}

let { open, sessionId, onClose }: Props = $props();

let format = $state<ExportFormat>("markdown");
let busy = $state(false);
let err = $state<string | null>(null);

async function runExport() {
	err = null;
	busy = true;
	try {
		const suggested = sessionId ? `chat-${sessionId}.${format}` : `chat-all.${format}`;
		if (sessionId) {
			await exportService.exportCurrentSessionToDisk(sessionId, format, suggested);
		} else {
			await exportService.exportAllToDisk(format, suggested);
		}
		onClose();
	} catch (e) {
		err = e instanceof Error ? e.message : String(e);
	} finally {
		busy = false;
	}
}
</script>

{#if open}
	<div class="fixed inset-0 z-[var(--chat-overlay-z,1001)] flex items-center justify-center bg-black/50 p-4">
		<div class="flex w-full max-w-md flex-col gap-3 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-overlay)] p-4">
			<Text size="sm" weight="semibold">Export chat</Text>
			<div class="flex gap-4 text-sm">
				<label class="flex items-center gap-2">
					<input type="radio" name="fmt" bind:group={format} value="markdown" />
					Markdown
				</label>
				<label class="flex items-center gap-2">
					<input type="radio" name="fmt" bind:group={format} value="json" />
					JSON
				</label>
			</div>
			{#if err}
				<Text size="xs" class="text-[var(--signal-error)]">{err}</Text>
			{/if}
			<div class="flex justify-end gap-2">
				<Button preset="ghost" size="sm" onclick={onClose} disabled={busy}>Cancel</Button>
				<Button preset="primary" size="sm" onclick={() => void runExport()} disabled={busy}>
					{busy ? "Exporting…" : "Choose file & export"}
				</Button>
			</div>
		</div>
	</div>
{/if}
