/**
 * @file layouts/app/icon-glow.ts
 * @module @devpulse/layouts/app/icon-glow
 *
 * The icon buttons' mouse-tracked halo: keeps `--mx` and `--my` (layouts.icon-btn.halo)
 * at the pointer on whichever button it is over, for the shell's top bar and rail.
 */

export function iconGlow(region: HTMLElement): { destroy(): void } {
	function track(event: PointerEvent): void {
		if (!(event.target instanceof Element)) return;
		const button = event.target.closest<HTMLElement>('[data-kind="button"]');
		if (!button) return;
		const box = button.getBoundingClientRect();
		button.style.setProperty("--mx", `${((event.clientX - box.left) / box.width) * 100}%`);
		button.style.setProperty("--my", `${((event.clientY - box.top) / box.height) * 100}%`);
	}

	region.addEventListener("pointermove", track, { passive: true });
	return {
		destroy: () => region.removeEventListener("pointermove", track),
	};
}
