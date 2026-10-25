/**
 * Shell Store - Layout state management
 * Controls sidebar width and collapse state
 *
 * Uses rem units for fluid CSS system
 * Constraints: 4rem (64px) collapsed, 14.375rem (230px) max
 */

// Constants in px for mouse calculations, converted to rem for CSS
const SIDEBAR_MIN_PX = 64;
const SIDEBAR_MAX_PX = 230;
const SIDEBAR_DEFAULT_PX = 230;
const COLLAPSE_THRESHOLD_PX = 80;

// Convert px to rem (assuming 16px base)
const pxToRem = (px: number) => px / 16;

class ShellStore {
	#collapsed = $state(false);
	#widthPx = $state(SIDEBAR_DEFAULT_PX);

	get collapsed() {
		return this.#collapsed;
	}

	/** Returns sidebar width in rem for CSS */
	get sidebarWidth() {
		const px = this.#collapsed ? SIDEBAR_MIN_PX : this.#widthPx;
		return pxToRem(px);
	}

	/** Returns sidebar width in px (for calculations) */
	get sidebarWidthPx() {
		return this.#collapsed ? SIDEBAR_MIN_PX : this.#widthPx;
	}

	toggleCollapse() {
		this.#collapsed = !this.#collapsed;
	}

	setSidebarWidth(px: number) {
		// Clamp to valid range
		this.#widthPx = Math.min(Math.max(px, SIDEBAR_MIN_PX), SIDEBAR_MAX_PX);
		// If dragged narrow enough, collapse
		if (px < COLLAPSE_THRESHOLD_PX) this.#collapsed = true;
		else this.#collapsed = false;
	}

	resetWidth() {
		this.#widthPx = SIDEBAR_DEFAULT_PX;
		this.#collapsed = false;
	}
}

export const shellStore = new ShellStore();
