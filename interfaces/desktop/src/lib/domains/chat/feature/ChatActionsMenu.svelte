<!--
  @feature ChatActionsMenu — delete / clear / export
-->
<script lang="ts">
import { Button } from "@devpulse/coldlight/components/button";
import { chatState } from "../data-access/chat.state.svelte.js";
import { sessionsState } from "../data-access/sessions.state.svelte.js";
import DeleteConfirmDialog from "./DeleteConfirmDialog.svelte";
import ExportDialog from "./ExportDialog.svelte";

let showClear = $state(false);
let showDelete = $state(false);
let showExport = $state(false);
let exportAll = $state(false);
</script>

<div class="flex items-center gap-1">
	<Button
		variant="ghost"
		size="sm"
		onclick={() => {
			exportAll = false;
			showExport = true;
		}}
	>
		Export
	</Button>
	<Button
		variant="ghost"
		size="sm"
		onclick={() => {
			exportAll = true;
			showExport = true;
		}}
	>
		Export all
	</Button>
	<Button variant="ghost" size="sm" onclick={() => (showDelete = true)}>Delete session</Button>
	<Button variant="danger" size="sm" onclick={() => (showClear = true)}>Clear all</Button>
</div>

<DeleteConfirmDialog
	open={showDelete}
	mode="delete-session"
	onClose={() => (showDelete = false)}
	onConfirm={async () => {
		const id = chatState.activeSessionId;
		if (!id) return;
		await sessionsState.delete(id);
		chatState.setActiveSession(null);
		await chatState.loadActive();
	}}
/>

<DeleteConfirmDialog
	open={showClear}
	mode="clear-all"
	onClose={() => (showClear = false)}
	onConfirm={async () => {
		await sessionsState.clearAll();
		chatState.setActiveSession(null);
		await chatState.loadActive();
	}}
/>

<ExportDialog
	open={showExport}
	sessionId={exportAll ? null : chatState.activeSessionId}
	onClose={() => (showExport = false)}
/>
