/**
 * Live region — screen reader announcements for dynamic changes.
 *
 * Used by: progress, toast, alert, loading-overlay, form validation.
 *
 * Creates aria-live regions in the DOM that screen readers monitor.
 * Two politeness levels:
 * - "polite" — waits for current speech to finish (default)
 * - "assertive" — interrupts current speech immediately
 */

import type { Politeness, LiveRegionReturn } from "./types.js";

let politeRegion: HTMLElement | null = null;
let assertiveRegion: HTMLElement | null = null;

function getOrCreateRegion(politeness: Politeness): HTMLElement {
	const existing = politeness === "polite" ? politeRegion : assertiveRegion;
	if (existing && existing.isConnected) return existing;

	const region = document.createElement("div");
	region.setAttribute("aria-live", politeness);
	region.setAttribute("aria-atomic", "true");
	region.setAttribute("role", politeness === "assertive" ? "alert" : "status");
	region.style.cssText =
		"position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0";
	document.body.appendChild(region);

	if (politeness === "polite") politeRegion = region;
	else assertiveRegion = region;

	return region;
}

/** Announce a message to screen readers. */
export function announce(message: string, politeness: Politeness = "polite"): void {
	const region = getOrCreateRegion(politeness);
	region.textContent = "";
	requestAnimationFrame(() => {
		region.textContent = message;
	});
}

/** Create a scoped live region hook. */
export function useLiveRegion(politeness: Politeness = "polite"): LiveRegionReturn {
	return {
		announce(message: string) {
			announce(message, politeness);
		},
	};
}
