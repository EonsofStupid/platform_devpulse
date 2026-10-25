<script lang="ts">
	/**
	 * RegionSelector - Full-screen overlay for selecting capture region
	 * User draws a rectangle by clicking and dragging
	 */

	interface Props {
		onSelect: (region: { x: number; y: number; width: number; height: number }) => void;
		onCancel: () => void;
	}

	let { onSelect, onCancel }: Props = $props();

	let isSelecting = $state(false);
	let startX = $state(0);
	let startY = $state(0);
	let currentX = $state(0);
	let currentY = $state(0);

	// Computed selection box
	let selectionBox = $derived(() => {
		const x = Math.min(startX, currentX);
		const y = Math.min(startY, currentY);
		const width = Math.abs(currentX - startX);
		const height = Math.abs(currentY - startY);
		return { x, y, width, height };
	});

	function handleMouseDown(e: MouseEvent) {
		isSelecting = true;
		startX = e.clientX;
		startY = e.clientY;
		currentX = e.clientX;
		currentY = e.clientY;
	}

	function handleMouseMove(e: MouseEvent) {
		if (!isSelecting) return;
		currentX = e.clientX;
		currentY = e.clientY;
	}

	function handleMouseUp(e: MouseEvent) {
		if (!isSelecting) return;
		isSelecting = false;

		const box = selectionBox();
		// Minimum selection size
		if (box.width >= 10 && box.height >= 10) {
			// Convert to screen coordinates (accounting for window position)
			// Note: In a real implementation, we'd need to get the window's screen position
			onSelect({
				x: Math.round(box.x),
				y: Math.round(box.y),
				width: Math.round(box.width),
				height: Math.round(box.height)
			});
		} else {
			onCancel();
		}
	}

	function handleKeyDown(e: KeyboardEvent) {
		if (e.key === 'Escape') {
			onCancel();
		}
	}
</script>

<svelte:window onkeydown={handleKeyDown} />

<div
	class="region-overlay"
	onmousedown={handleMouseDown}
	onmousemove={handleMouseMove}
	onmouseup={handleMouseUp}
	role="application"
	tabindex="0"
>
	<div class="instructions">
		<span>Click and drag to select region</span>
		<kbd>ESC</kbd>
		<span>to cancel</span>
	</div>

	{#if isSelecting || (selectionBox().width > 0 && selectionBox().height > 0)}
		{@const box = selectionBox()}
		<div
			class="selection-box"
			style="left: {box.x}px; top: {box.y}px; width: {box.width}px; height: {box.height}px;"
		>
			<div class="dimensions">
				{box.width} × {box.height}
			</div>
		</div>

		<!-- Mask regions (darken non-selected areas) -->
		<div class="mask mask-top" style="height: {box.y}px;"></div>
		<div
			class="mask mask-bottom"
			style="top: {box.y + box.height}px; height: calc(100% - {box.y + box.height}px);"
		></div>
		<div
			class="mask mask-left"
			style="top: {box.y}px; height: {box.height}px; width: {box.x}px;"
		></div>
		<div
			class="mask mask-right"
			style="top: {box.y}px; height: {box.height}px; left: {box.x + box.width}px; width: calc(100% - {box.x + box.width}px);"
		></div>
	{/if}

	<button class="cancel-btn" onclick={onCancel}>Cancel</button>
</div>

<style>
	.region-overlay {
		position: fixed;
		inset: 0;
		z-index: 9999;
		cursor: crosshair;
		background: rgba(0, 0, 0, 0.3);
	}

	.instructions {
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 1rem 1.5rem;
		background: rgba(0, 0, 0, 0.8);
		border-radius: 0.5rem;
		color: white;
		font-size: 0.875rem;
		pointer-events: none;
		z-index: 1;
	}

	.instructions kbd {
		padding: 0.25rem 0.5rem;
		background: rgba(255, 255, 255, 0.2);
		border-radius: 0.25rem;
		font-size: 0.75rem;
	}

	.selection-box {
		position: absolute;
		border: 2px solid #8b5cf6;
		background: transparent;
		box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.5);
		z-index: 10;
	}

	.dimensions {
		position: absolute;
		bottom: -28px;
		left: 50%;
		transform: translateX(-50%);
		padding: 0.25rem 0.5rem;
		background: #8b5cf6;
		border-radius: 0.25rem;
		font-size: 0.75rem;
		color: white;
		white-space: nowrap;
	}

	.mask {
		position: absolute;
		background: rgba(0, 0, 0, 0.5);
		pointer-events: none;
	}

	.mask-top {
		top: 0;
		left: 0;
		right: 0;
	}

	.mask-bottom {
		left: 0;
		right: 0;
	}

	.mask-left {
		left: 0;
	}

	.mask-right {
	}

	.cancel-btn {
		position: absolute;
		bottom: 2rem;
		left: 50%;
		transform: translateX(-50%);
		padding: 0.75rem 2rem;
		background: rgba(239, 68, 68, 0.9);
		border: none;
		border-radius: 0.5rem;
		color: white;
		font-size: 0.875rem;
		cursor: pointer;
		z-index: 20;
	}

	.cancel-btn:hover {
		background: rgba(239, 68, 68, 1);
	}
</style>
