<script lang="ts">
	/**
	 * ImageEditor - Canvas-based image annotation tool
	 * Features: Draw, arrows, rectangles, text, crop
	 */
	import { onMount } from 'svelte';

	interface Props {
		imageData: string; // base64 PNG
		width: number;
		height: number;
		onSave: (editedBase64: string) => void;
		onCancel: () => void;
	}

	let { imageData, width, height, onSave, onCancel }: Props = $props();

	type Tool = 'draw' | 'arrow' | 'rect' | 'circle' | 'text' | 'crop';

	let canvas: HTMLCanvasElement;
	let ctx: CanvasRenderingContext2D;
	let baseImage: HTMLImageElement;

	// Tool state
	let currentTool = $state<Tool>('draw');
	let strokeColor = $state('#ef4444'); // Red
	let strokeWidth = $state(3);
	let textInput = $state('');

	// Drawing state
	let isDrawing = $state(false);
	let startX = $state(0);
	let startY = $state(0);
	let currentX = $state(0);
	let currentY = $state(0);

	// History for undo
	let history = $state<ImageData[]>([]);
	let historyIndex = $state(-1);

	onMount(() => {
		ctx = canvas.getContext('2d')!;

		// Load the base image
		baseImage = new Image();
		baseImage.onload = () => {
			canvas.width = width;
			canvas.height = height;
			ctx.drawImage(baseImage, 0, 0, width, height);
			saveHistory();
		};
		baseImage.src = `data:image/png;base64,${imageData}`;
	});

	function saveHistory() {
		// Truncate future history if we're not at the end
		if (historyIndex < history.length - 1) {
			history = history.slice(0, historyIndex + 1);
		}
		const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
		history = [...history, imgData];
		historyIndex = history.length - 1;
	}

	function undo() {
		if (historyIndex > 0) {
			historyIndex--;
			ctx.putImageData(history[historyIndex], 0, 0);
		}
	}

	function redo() {
		if (historyIndex < history.length - 1) {
			historyIndex++;
			ctx.putImageData(history[historyIndex], 0, 0);
		}
	}

	function getMousePos(e: MouseEvent): { x: number; y: number } {
		const rect = canvas.getBoundingClientRect();
		const scaleX = canvas.width / rect.width;
		const scaleY = canvas.height / rect.height;
		return {
			x: (e.clientX - rect.left) * scaleX,
			y: (e.clientY - rect.top) * scaleY
		};
	}

	function handleMouseDown(e: MouseEvent) {
		const pos = getMousePos(e);
		startX = pos.x;
		startY = pos.y;
		currentX = pos.x;
		currentY = pos.y;
		isDrawing = true;

		if (currentTool === 'draw') {
			ctx.beginPath();
			ctx.moveTo(startX, startY);
			ctx.strokeStyle = strokeColor;
			ctx.lineWidth = strokeWidth;
			ctx.lineCap = 'round';
			ctx.lineJoin = 'round';
		}
	}

	function handleMouseMove(e: MouseEvent) {
		if (!isDrawing) return;

		const pos = getMousePos(e);
		currentX = pos.x;
		currentY = pos.y;

		if (currentTool === 'draw') {
			ctx.lineTo(currentX, currentY);
			ctx.stroke();
		}
	}

	function handleMouseUp(e: MouseEvent) {
		if (!isDrawing) return;
		isDrawing = false;

		const pos = getMousePos(e);
		currentX = pos.x;
		currentY = pos.y;

		ctx.strokeStyle = strokeColor;
		ctx.lineWidth = strokeWidth;
		ctx.fillStyle = strokeColor;

		switch (currentTool) {
			case 'draw':
				// Path already drawn during move
				break;

			case 'arrow':
				drawArrow(startX, startY, currentX, currentY);
				break;

			case 'rect':
				ctx.strokeRect(
					Math.min(startX, currentX),
					Math.min(startY, currentY),
					Math.abs(currentX - startX),
					Math.abs(currentY - startY)
				);
				break;

			case 'circle':
				const radiusX = Math.abs(currentX - startX) / 2;
				const radiusY = Math.abs(currentY - startY) / 2;
				const centerX = Math.min(startX, currentX) + radiusX;
				const centerY = Math.min(startY, currentY) + radiusY;
				ctx.beginPath();
				ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, Math.PI * 2);
				ctx.stroke();
				break;

			case 'text':
				if (textInput.trim()) {
					ctx.font = `${strokeWidth * 6}px sans-serif`;
					ctx.fillText(textInput, currentX, currentY);
				}
				break;
		}

		saveHistory();
	}

	function drawArrow(fromX: number, fromY: number, toX: number, toY: number) {
		const headLen = strokeWidth * 5;
		const dx = toX - fromX;
		const dy = toY - fromY;
		const angle = Math.atan2(dy, dx);

		// Line
		ctx.beginPath();
		ctx.moveTo(fromX, fromY);
		ctx.lineTo(toX, toY);
		ctx.stroke();

		// Arrowhead
		ctx.beginPath();
		ctx.moveTo(toX, toY);
		ctx.lineTo(toX - headLen * Math.cos(angle - Math.PI / 6), toY - headLen * Math.sin(angle - Math.PI / 6));
		ctx.lineTo(toX - headLen * Math.cos(angle + Math.PI / 6), toY - headLen * Math.sin(angle + Math.PI / 6));
		ctx.closePath();
		ctx.fill();
	}

	function handleSave() {
		const editedData = canvas.toDataURL('image/png').split(',')[1];
		onSave(editedData);
	}

	function clear() {
		if (baseImage) {
			ctx.drawImage(baseImage, 0, 0, width, height);
			saveHistory();
		}
	}

	const tools: { id: Tool; icon: string; label: string }[] = [
		{ id: 'draw', icon: '✏️', label: 'Draw' },
		{ id: 'arrow', icon: '➡️', label: 'Arrow' },
		{ id: 'rect', icon: '⬜', label: 'Rectangle' },
		{ id: 'circle', icon: '⭕', label: 'Circle' },
		{ id: 'text', icon: '🔤', label: 'Text' }
	];

	const colors = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899', '#ffffff', '#000000'];
</script>

<div class="editor-modal">
	<div class="editor-container">
		<header class="editor-header">
			<h3>Edit Screenshot</h3>
			<div class="header-actions">
				<button class="icon-btn" onclick={undo} disabled={historyIndex <= 0} title="Undo">
					↩️
				</button>
				<button class="icon-btn" onclick={redo} disabled={historyIndex >= history.length - 1} title="Redo">
					↪️
				</button>
				<button class="icon-btn" onclick={clear} title="Clear Annotations">
					🗑️
				</button>
			</div>
		</header>

		<div class="editor-toolbar">
			<div class="tool-group">
				{#each tools as tool (tool.id)}
					<button
						class="tool-btn"
						class:active={currentTool === tool.id}
						onclick={() => (currentTool = tool.id)}
						title={tool.label}
					>
						{tool.icon}
					</button>
				{/each}
			</div>

			<div class="separator"></div>

			<div class="color-picker">
				{#each colors as color (color)}
					<button
						class="color-btn"
						class:active={strokeColor === color}
						style="background: {color};"
						onclick={() => (strokeColor = color)}
						title={color}
					></button>
				{/each}
			</div>

			<div class="separator"></div>

			<div class="stroke-control">
				<label>
					Size:
					<input type="range" min="1" max="10" bind:value={strokeWidth} />
					<span>{strokeWidth}px</span>
				</label>
			</div>

			{#if currentTool === 'text'}
				<div class="separator"></div>
				<div class="text-input">
					<input type="text" bind:value={textInput} placeholder="Enter text..." />
				</div>
			{/if}
		</div>

		<div class="canvas-wrapper">
			<canvas
				bind:this={canvas}
				onmousedown={handleMouseDown}
				onmousemove={handleMouseMove}
				onmouseup={handleMouseUp}
				onmouseleave={() => (isDrawing = false)}
			></canvas>
		</div>

		<footer class="editor-footer">
			<button class="btn cancel" onclick={onCancel}>Cancel</button>
			<button class="btn save" onclick={handleSave}>Save Changes</button>
		</footer>
	</div>
</div>

<style>
	.editor-modal {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.9);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 2000;
		padding: 1rem;
	}

	.editor-container {
		background: #1a1a2e;
		border-radius: 1rem;
		display: flex;
		flex-direction: column;
		max-width: 95vw;
		max-height: 95vh;
		overflow: hidden;
	}

	.editor-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 1rem 1.5rem;
		border-bottom: 1px solid rgba(255, 255, 255, 0.1);
	}

	.editor-header h3 {
		margin: 0;
		font-size: 1rem;
	}

	.header-actions {
		display: flex;
		gap: 0.5rem;
	}

	.icon-btn {
		width: 2rem;
		height: 2rem;
		display: flex;
		align-items: center;
		justify-content: center;
		background: rgba(255, 255, 255, 0.1);
		border: none;
		border-radius: 0.375rem;
		cursor: pointer;
		font-size: 0.875rem;
	}

	.icon-btn:hover:not(:disabled) {
		background: rgba(255, 255, 255, 0.2);
	}

	.icon-btn:disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}

	.editor-toolbar {
		display: flex;
		align-items: center;
		gap: 1rem;
		padding: 0.75rem 1.5rem;
		background: rgba(0, 0, 0, 0.3);
		flex-wrap: wrap;
	}

	.tool-group {
		display: flex;
		gap: 0.25rem;
	}

	.tool-btn {
		width: 2.5rem;
		height: 2.5rem;
		display: flex;
		align-items: center;
		justify-content: center;
		background: rgba(255, 255, 255, 0.05);
		border: 1px solid transparent;
		border-radius: 0.5rem;
		cursor: pointer;
		font-size: 1.125rem;
		transition: all 0.15s;
	}

	.tool-btn:hover {
		background: rgba(255, 255, 255, 0.1);
	}

	.tool-btn.active {
		background: rgba(139, 92, 246, 0.3);
		border-color: rgba(139, 92, 246, 0.5);
	}

	.separator {
		width: 1px;
		height: 2rem;
		background: rgba(255, 255, 255, 0.2);
	}

	.color-picker {
		display: flex;
		gap: 0.25rem;
	}

	.color-btn {
		width: 1.5rem;
		height: 1.5rem;
		border: 2px solid transparent;
		border-radius: 50%;
		cursor: pointer;
		transition: transform 0.15s;
	}

	.color-btn:hover {
		transform: scale(1.15);
	}

	.color-btn.active {
		border-color: white;
		box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.3);
	}

	.stroke-control {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.75rem;
		color: rgba(255, 255, 255, 0.7);
	}

	.stroke-control label {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.stroke-control input[type='range'] {
		width: 80px;
		accent-color: #8b5cf6;
	}

	.text-input input {
		padding: 0.5rem 0.75rem;
		background: rgba(255, 255, 255, 0.1);
		border: 1px solid rgba(255, 255, 255, 0.2);
		border-radius: 0.375rem;
		color: white;
		font-size: 0.875rem;
		width: 150px;
	}

	.text-input input::placeholder {
		color: rgba(255, 255, 255, 0.4);
	}

	.canvas-wrapper {
		flex: 1;
		overflow: auto;
		padding: 1rem;
		display: flex;
		align-items: center;
		justify-content: center;
		background: #0a0a15;
	}

	canvas {
		max-width: 100%;
		max-height: 70vh;
		cursor: crosshair;
		box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
	}

	.editor-footer {
		display: flex;
		justify-content: flex-end;
		gap: 0.75rem;
		padding: 1rem 1.5rem;
		border-top: 1px solid rgba(255, 255, 255, 0.1);
	}

	.btn {
		padding: 0.625rem 1.5rem;
		border-radius: 0.5rem;
		font-size: 0.875rem;
		cursor: pointer;
		transition: all 0.15s;
	}

	.btn.cancel {
		background: rgba(255, 255, 255, 0.1);
		border: 1px solid rgba(255, 255, 255, 0.2);
		color: white;
	}

	.btn.cancel:hover {
		background: rgba(255, 255, 255, 0.15);
	}

	.btn.save {
		background: #8b5cf6;
		border: none;
		color: white;
	}

	.btn.save:hover {
		background: #7c3aed;
	}
</style>
