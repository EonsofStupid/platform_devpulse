<!--
  @file src/lib/sys/debug/vpb/components/inspector/VpbInspector.svelte
  @name VpbInspector.svelte
  @module @devpulse/sys/debug/vpb/components/VPBInspector
  @layer lib

  @description
  Independent Floating Inspector Window.
  Appears on scan selection. Draggable and dismissible.

  @dependencies
  - vpb-inspector.css
  - state.svelte.ts (scan)
  - logic/element-parser.ts
-->
<script lang="ts">
import { Button } from "@devpulse/coldlight/components/button";
import { Check, Copy, ScanSearch, X } from "lucide-svelte";
import { toast } from "svelte-sonner";
import { copyState, fill } from "#lib/sys/copy/index.js";
import { formatForAI, type ParsedElement, parseElement } from "./logic/element-parser.js";
import { scan } from "./state.svelte.js";

const text = $derived(copyState.catalog?.vpb);

// Draggable Position State - Initialize with last click or default
let position = $state(
	scan.clickPosition.x > 0 ? scan.clickPosition : { x: window.innerWidth - 340, y: 100 },
);

// Update position if new click happens while open (optional, but good for re-clicking)
$effect(() => {
	if (scan.inspectorOpen && scan.clickPosition.x > 0) {
		// Basic bounds check to prevent off-screen
		const safeX = Math.min(scan.clickPosition.x + 20, window.innerWidth - 320);
		const safeY = Math.min(scan.clickPosition.y + 20, window.innerHeight - 400);
		position = { x: safeX, y: safeY };
	}
});

let isDragging = $state(false);
let dragOffset = $state({ x: 0, y: 0 });

let copiedField = $state<string | null>(null);

// Derived info
const info = $derived<ParsedElement | null>(
	scan.selectedElement ? parseElement(scan.selectedElement) : null,
);

// Drag Handlers
function onDragStart(e: MouseEvent) {
	isDragging = true;
	dragOffset = {
		x: e.clientX - position.x,
		y: e.clientY - position.y,
	};
}

function onDragMove(e: MouseEvent) {
	if (!isDragging) return;
	position = {
		x: e.clientX - dragOffset.x,
		y: e.clientY - dragOffset.y,
	};
}

function onDragEnd() {
	isDragging = false;
}

// Actions
async function copyToClipboard(value: string, field: string) {
	try {
		await navigator.clipboard.writeText(value);
		copiedField = field;
		toast.success(fill(text?.toast_copied ?? "", { field }));
		setTimeout(() => {
			copiedField = null;
		}, 2000);
	} catch {
		toast.error(text?.toast_copy_failed ?? "");
	}
}

async function copyAll() {
	if (!info) return;
	await copyToClipboard(formatForAI(info), "all");
}

function close() {
	scan.closeInspector();
}
</script>

<svelte:window onmousemove={onDragMove} onmouseup={onDragEnd} />

{#if scan.inspectorOpen && info}
	<div
		class="vpb-inspector"
		data-kind="vpb"
		data-slot="inspector"
		style:left="{position.x}px"
		style:top="{position.y}px"
	>
		<!-- Header (Drag Handle) -->
		<div
			class="vpb-inspector__header"
			onmousedown={onDragStart}
			role="presentation"
			aria-label={text?.drag_inspector}
		>
			<h3 class="vpb-inspector__title">
				<ScanSearch size={16} />
				{text?.element_title}
			</h3>
			<Button
				variant="ghost"
				size="sm"
				class="vpb-tabs__control vpb-tabs__control--close"
				onclick={close}
				aria-label={text?.close_inspector}
			>
				<X size={14} />
			</Button>
		</div>

		<!-- Tag -->
		<div class="vpb-inspector__row">
			<span class="vpb-inspector__label">{text?.row_tag}</span>
			<span class="vpb-inspector__value">&lt;{info.tagName}&gt;</span>
		</div>

		<!-- ID -->
		{#if info.id}
			{@const id = info.id}
			<div class="vpb-inspector__row">
				<span class="vpb-inspector__label">{text?.row_id}</span>
				<span class="vpb-inspector__value">#{id}</span>
				<Button
					variant="ghost"
					size="sm"
					class="vpb-copy-btn"
					data-copied={copiedField === "id"}
					onclick={() => copyToClipboard(id, "id")}
					title={text?.copy_id}
					aria-label={text?.copy_id}
				>
					{#if copiedField === "id"}<Check size={14} />{:else}<Copy size={14} />{/if}
				</Button>
			</div>
		{/if}

		<!-- Classes -->
		{#if info.classList.length > 0}
			{@const classes = info.classList}
			<div class="vpb-inspector__row">
				<span class="vpb-inspector__label">{text?.row_classes}</span>
				<span class="vpb-inspector__value">.{classes.join(" .")}</span>
				<Button
					variant="ghost"
					size="sm"
					class="vpb-copy-btn"
					data-copied={copiedField === "classes"}
					onclick={() => copyToClipboard(classes.join(" "), "classes")}
					title={text?.copy_classes}
					aria-label={text?.copy_classes}
				>
					{#if copiedField === "classes"}<Check size={14} />{:else}<Copy size={14} />{/if}
				</Button>
			</div>
		{/if}

		<!-- Source File -->
		{#if info.sourceFile}
			<div class="vpb-inspector__row">
				<span class="vpb-inspector__label">{text?.row_file}</span>
				<span class="vpb-inspector__value vpb-inspector__value--file">{info.sourceFile}</span>
			</div>
		{/if}

		<!-- Copy All Button -->
		<Button
			variant="secondary"
			size="sm"
			class="vpb-copy-all"
			data-copied={copiedField === "all"}
			onclick={copyAll}
		>
			{text?.copy_all}
		</Button>
	</div>
{/if}
