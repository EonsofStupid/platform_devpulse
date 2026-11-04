/**
 * @file src/lib/sys/debug/vpb/state/vpb.svelte.ts
 * @description VPB state management with Svelte 5 runes.
 *
 * The floating panel's own state: visibility, display mode, position, active
 * tab, and the scan. Three generations of this file are merged here (window
 * presence + docking + shell drag, modes + scan, tabs + size). Its fourth
 * concern, the block tree with its selection, clipboard and history, is
 * `vpb-document.svelte.ts`, which the full builder shares.
 *
 * @since 1.0.0
 */

import type { VPBSize, VPBTab } from "../types/vpb.js";
import type { VPBMode, XYPosition } from "../types.js";

class VPBStore {
	// ---- UI State ----

	/** Visibility of the Shell */
	isOpen = $state(true);

	/** Current display mode; the panel starts as the V icon. */
	mode = $state<VPBMode>("minimized");

	/** Active Tab */
	activeTab = $state<VPBTab>("inspector");

	/** Position for floating mode */
	position = $state<XYPosition>({ x: 20, y: 20 });

	/** The panel's size */
	size = $state<VPBSize>({ width: 380, height: 500 });

	/** Global Drag State (for Shell DnD) */
	isDragging = $state(false);

	/** Whether the full-window builder (`Vpb.svelte`) is open */
	workspaceOpen = $state(false);

	// ---- Scan State ----

	/** Scan mode active */
	scanActive = $state(false);

	/** Scan mode paused (can browse without overlay) */
	scanPaused = $state(false);

	// ===========================================
	// UI ACTIONS
	// ===========================================

	toggle(): void {
		this.isOpen = !this.isOpen;
	}

	open(): void {
		this.isOpen = true;
	}

	close(): void {
		this.isOpen = false;
	}

	setTab(tab: VPBTab): void {
		this.activeTab = tab;
	}

	// ─────────────────────────────────────────────────────────────
	// Mode Methods
	// ─────────────────────────────────────────────────────────────

	/** Switch to docked mode (bottom-right) */
	dock(): void {
		this.mode = "docked";
	}

	/** Switch to floating mode (draggable) */
	float(): void {
		this.mode = "floating";
	}

	/** Switch to minimized mode (V icon only) */
	minimize(): void {
		this.mode = "minimized";
	}

	/** Update floating position */
	setPosition(x: number, y: number): void {
		this.position = { x, y };
	}

	/** Open or close the full-window builder */
	toggleWorkspace(): void {
		this.workspaceOpen = !this.workspaceOpen;
	}

	// Drag Logic
	startDrag(e: MouseEvent): void {
		if (this.mode !== "floating") return;
		this.isDragging = true;

		const startX = e.clientX;
		const startY = e.clientY;
		const initialX = this.position.x;
		const initialY = this.position.y;

		const onMove = (evt: MouseEvent) => {
			const dx = evt.clientX - startX;
			const dy = evt.clientY - startY;
			this.position = { x: initialX + dx, y: initialY + dy };
		};

		const onUp = () => {
			this.isDragging = false;
			window.removeEventListener("mousemove", onMove);
			window.removeEventListener("mouseup", onUp);
		};

		window.addEventListener("mousemove", onMove);
		window.addEventListener("mouseup", onUp);
	}

	// ─────────────────────────────────────────────────────────────
	// Scan Methods
	// ─────────────────────────────────────────────────────────────

	/** Toggle scan mode on/off */
	toggleScan(): void {
		this.scanActive = !this.scanActive;
		if (this.scanActive) {
			this.scanPaused = false;
		}
	}

	/** Start scan mode */
	startScan(): void {
		this.scanActive = true;
		this.scanPaused = false;
		// Auto-switch to inspector when scanning starts
		this.activeTab = "inspector";
	}

	/** Stop scan mode (graceful) */
	stopScan(): void {
		this.scanActive = false;
		this.scanPaused = false;
	}

	/** Pause scan (overlay hidden, can browse) */
	pauseScan(): void {
		this.scanPaused = true;
	}

	/** Resume scan from pause */
	resumeScan(): void {
		this.scanPaused = false;
	}
}

// ===========================================
// SINGLETON EXPORT
// ===========================================

export const vpb = new VPBStore();
