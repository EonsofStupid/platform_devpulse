/**
 * @file Glow Track — Cursor-Following Glow Svelte Action
 * @layer effects/actions
 * @package @devpulse/coldlight
 *
 * Svelte 5 action that creates a cursor-following radial gradient glow.
 * The glow follows mouse position within the element bounds.
 *
 * Uses CSS custom properties (--_glow-x, --_glow-y) so the actual
 * visual is pure CSS — this action only tracks cursor position.
 *
 * Usage:
 *   <div use:glowTrack={{ color: "var(--color-teal-500)", opacity: 0.3, radius: "60%" }}>
 *     Element with cursor-following glow
 *   </div>
 */

export interface GlowTrackParams {
	/** CSS color for the glow. @default "var(--color-teal-500)" */
	color?: string;
	/** Glow opacity (0-1). @default 0.3 */
	opacity?: number;
	/** Glow radius (CSS value). @default "60%" */
	radius?: string;
}

export function glowTrack(
	node: HTMLElement,
	params: GlowTrackParams = {},
) {
	const {
		color = "var(--color-teal-500)",
		opacity = 0.3,
		radius = "60%",
	} = params;

	// Respect reduced motion
	const prefersReduced = globalThis.matchMedia?.(
		"(prefers-reduced-motion: reduce)",
	).matches;

	if (prefersReduced) {
		return { destroy() {} };
	}

	// Ensure relative positioning for gradient overlay
	const computed = getComputedStyle(node);
	if (computed.position === "static") {
		node.style.position = "relative";
	}
	node.style.overflow = "hidden";

	// Create glow overlay element
	const overlay = document.createElement("div");
	overlay.setAttribute("aria-hidden", "true");
	overlay.style.cssText = `
		position: absolute;
		inset: 0;
		pointer-events: none;
		opacity: 0;
		transition: opacity 0.15s ease-out;
		background: radial-gradient(circle ${radius} at var(--_glow-x, 50%) var(--_glow-y, 50%), ${color}, transparent);
		z-index: 0;
	`;
	node.appendChild(overlay);

	function handleMouseMove(e: MouseEvent) {
		const rect = node.getBoundingClientRect();
		const x = ((e.clientX - rect.left) / rect.width) * 100;
		const y = ((e.clientY - rect.top) / rect.height) * 100;
		overlay.style.setProperty("--_glow-x", `${x}%`);
		overlay.style.setProperty("--_glow-y", `${y}%`);
	}

	function handleMouseEnter() {
		overlay.style.opacity = String(opacity);
	}

	function handleMouseLeave() {
		overlay.style.opacity = "0";
	}

	node.addEventListener("mousemove", handleMouseMove);
	node.addEventListener("mouseenter", handleMouseEnter);
	node.addEventListener("mouseleave", handleMouseLeave);

	return {
		destroy() {
			node.removeEventListener("mousemove", handleMouseMove);
			node.removeEventListener("mouseenter", handleMouseEnter);
			node.removeEventListener("mouseleave", handleMouseLeave);
			overlay.remove();
		},
	};
}
