<!--
	@component DialogFocus.fixture
	@kind dialog
	@layer components

	Test fixture for Dialog.trap.test.ts — a real compound dialog with
	three focusable elements so the native showModal() trap and Tab-wrap
	behavior can be asserted in Chromium. Not a product component.
-->
<script lang="ts">
import Dialog from "./Dialog.svelte";
import DialogContent from "./DialogContent.svelte";
import DialogTitle from "./DialogTitle.svelte";
import DialogTrigger from "./DialogTrigger.svelte";
</script>

<Dialog>
	<DialogTrigger data-testid="trigger">Open dialog</DialogTrigger>
	<DialogContent data-testid="content">
		<DialogTitle>Trap proof</DialogTitle>
		<button data-testid="first" type="button">First</button>
		<input data-testid="middle" type="text" />
		<button data-testid="last" type="button">Last</button>
	</DialogContent>
</Dialog>
