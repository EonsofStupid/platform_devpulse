/**
 * @file utils/ariaAnnounce.ts
 * @package @devpulse/coldlight
 *
 * Announce a message to screen readers via a live region.
 * Creates an off-screen aria-live region, inserts text, removes after delay.
 */
let liveRegion: HTMLElement | null = null;

function ensureLiveRegion(): HTMLElement {
	if (liveRegion && document.body.contains(liveRegion)) return liveRegion;
	liveRegion = document.createElement("div");
	liveRegion.setAttribute("aria-live", "polite");
	liveRegion.setAttribute("aria-atomic", "true");
	liveRegion.style.cssText =
		"position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border-width:0";
	document.body.appendChild(liveRegion);
	return liveRegion;
}

export function ariaAnnounce(message: string, priority: "polite" | "assertive" = "polite"): void {
	const region = ensureLiveRegion();
	region.setAttribute("aria-live", priority);
	region.textContent = "";
	// Force reflow so screen readers detect the change
	void region.offsetHeight;
	region.textContent = message;
}
