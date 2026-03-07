<!--
	@file VPB Toolbar — Top Bar Controls
	@layer vpb
-->
<script lang="ts">
	import { vpbDocument } from "../state/vpb-document.svelte.js";
	import { saveAutoSave, exportDocument, importDocument } from "../persistence/local-storage.js";
	import { downloadSvelte } from "../codegen/svelte-codegen.js";

	let {
		open = $bindable(true),
		viewMode = $bindable<"preview" | "graph">("preview"),
	}: {
		open?: boolean;
		viewMode?: "preview" | "graph";
	} = $props();
	let fileInput: HTMLInputElement;

	function handleSave() {
		saveAutoSave(vpbDocument.document);
	}

	function handleExport() {
		exportDocument(vpbDocument.document);
	}

	async function handleImport() {
		fileInput?.click();
	}

	async function onFileSelected(e: Event) {
		const input = e.target as HTMLInputElement;
		const file = input.files?.[0];
		if (!file) return;
		const doc = await importDocument(file);
		if (doc) vpbDocument.load(doc);
		input.value = "";
	}

	function handleNew() {
		vpbDocument.newDocument();
	}
</script>

<div class="vpb-toolbar">
	<div class="vpb-toolbar__left">
		<span class="vpb-toolbar__logo">VPB</span>
		<span class="vpb-toolbar__sep">|</span>
		<input
			class="vpb-toolbar__label"
			type="text"
			value={vpbDocument.document.label}
			oninput={(e) => { vpbDocument.document.label = (e.target as HTMLInputElement).value; }}
		/>
		{#if vpbDocument.dirty}
			<span class="vpb-toolbar__dirty" title="Unsaved changes">*</span>
		{/if}
	</div>

	<div class="vpb-toolbar__center">
		<button
			class="vpb-toolbar__btn"
			class:vpb-toolbar__btn--active={viewMode === "preview"}
			onclick={() => (viewMode = "preview")}
		>Preview</button>
		<button
			class="vpb-toolbar__btn"
			class:vpb-toolbar__btn--active={viewMode === "graph"}
			onclick={() => (viewMode = "graph")}
		>Graph</button>
	</div>

	<div class="vpb-toolbar__right">
		<button class="vpb-toolbar__btn" onclick={() => vpbDocument.undo()} disabled={!vpbDocument.canUndo} title="Undo">
			&#x21A9;
		</button>
		<button class="vpb-toolbar__btn" onclick={() => vpbDocument.redo()} disabled={!vpbDocument.canRedo} title="Redo">
			&#x21AA;
		</button>
		<span class="vpb-toolbar__sep">|</span>
		<button class="vpb-toolbar__btn" onclick={handleNew}>New</button>
		<button class="vpb-toolbar__btn" onclick={handleSave}>Save</button>
		<button class="vpb-toolbar__btn" onclick={handleExport}>Export</button>
		<button class="vpb-toolbar__btn" onclick={handleImport}>Import</button>
		<button class="vpb-toolbar__btn" onclick={() => downloadSvelte(vpbDocument.document.root)} title="Generate .svelte file">Codegen</button>
		<input bind:this={fileInput} type="file" accept=".json" hidden onchange={onFileSelected} />
		<span class="vpb-toolbar__sep">|</span>
		<button class="vpb-toolbar__btn vpb-toolbar__btn--close" onclick={() => (open = false)} title="Close VPB">
			&#x2715;
		</button>
	</div>
</div>

<style>
	.vpb-toolbar {
		display: flex;
		align-items: center;
		justify-content: space-between;
		height: 40px;
		padding: 0 12px;
		border-bottom: 1px solid var(--vpb-btn-hover);
		background: var(--vpb-panel-bg);
		flex-shrink: 0;
	}
	.vpb-toolbar__left, .vpb-toolbar__center, .vpb-toolbar__right {
		display: flex;
		align-items: center;
		gap: 6px;
	}
	.vpb-toolbar__logo {
		font-weight: 700;
		font-size: 14px;
		color: var(--vpb-tag-teal-color);
		letter-spacing: 0.05em;
	}
	.vpb-toolbar__sep {
		color: var(--vpb-border-faint);
		margin: 0 2px;
	}
	.vpb-toolbar__label {
		background: transparent;
		border: 1px solid transparent;
		color: inherit;
		font-size: 13px;
		padding: 2px 6px;
		border-radius: 4px;
		width: 180px;
	}
	.vpb-toolbar__label:focus {
		border-color: var(--vpb-accent-teal);
		outline: none;
	}
	.vpb-toolbar__dirty {
		color: var(--vpb-accent-ember);
		font-weight: 700;
	}
	.vpb-toolbar__btn {
		padding: 4px 10px;
		border: 1px solid var(--vpb-btn-border);
		border-radius: 4px;
		background: var(--vpb-btn-bg);
		color: inherit;
		font-size: 12px;
		cursor: pointer;
		transition: background 0.15s;
	}
	.vpb-toolbar__btn:hover:not(:disabled) {
		background: var(--vpb-btn-border);
	}
	.vpb-toolbar__btn:disabled {
		opacity: 0.3;
		cursor: not-allowed;
	}
	.vpb-toolbar__btn--active {
		background: var(--vpb-btn-active-bg);
		border-color: var(--vpb-btn-active-border);
	}
	.vpb-toolbar__btn--close {
		color: var(--vpb-accent-warning);
	}
</style>
