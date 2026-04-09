/**
 * useAvatar — ColdLight avatar primitive hook.
 *
 * Manages image load state (idle → loading → loaded | error).
 * When image fails or is absent, fallback is shown after `fallbackDelay` ms
 * to prevent layout flash on slow connections.
 *
 * WAI-ARIA: role="img" on root, aria-label = alt text.
 * Image is aria-hidden (visual only). Fallback is aria-hidden.
 *
 * @example
 * ```svelte
 * <script>
 *   import { useAvatar } from '$lib/design/coldlight';
 *   const avatar = useAvatar({ src: '/user.jpg', alt: 'Jane Doe', size: 'md' });
 * </script>
 * <span {...avatar.root}>
 *   {#if avatar.showFallback}
 *     <span {...avatar.fallback}>JD</span>
 *   {:else}
 *     <img {...avatar.image} />
 *   {/if}
 * </span>
 * ```
 */

import { avatarAnatomy } from "./avatar.anatomy.js";
import type { AvatarImageStatus, UseAvatarProps, UseAvatarReturn } from "./avatar.types.js";

export function useAvatar(props: UseAvatarProps = {}): UseAvatarReturn {
	const size = props.size ?? "md";
	const delay = props.fallbackDelay ?? 600;

	// ── State ────────────────────────────────────────────────────
	let status = $state<AvatarImageStatus>(props.src ? "loading" : "idle");
	let fallbackVisible = $state(!props.src);
	let fallbackTimer: ReturnType<typeof setTimeout> | null = null;

	function showFallbackAfterDelay(): void {
		if (fallbackTimer !== null) clearTimeout(fallbackTimer);
		fallbackTimer = setTimeout(() => {
			fallbackVisible = true;
		}, delay);
	}

	function handleLoad(): void {
		if (fallbackTimer !== null) {
			clearTimeout(fallbackTimer);
			fallbackTimer = null;
		}
		status = "loaded";
		fallbackVisible = false;
	}

	function handleError(): void {
		status = "error";
		showFallbackAfterDelay();
	}

	// If src changes to falsy, show fallback immediately
	const showFallback = $derived(!props.src || fallbackVisible);

	// ── Slot attributes ──────────────────────────────────────────
	const root = $derived({
		...avatarAnatomy.attrs.root,
		role: "img" as const,
		"aria-label": props.alt ?? "Avatar",
		"data-size": size,
		"data-status": status,
	});

	const image = $derived({
		...avatarAnatomy.attrs.image,
		src: props.src,
		alt: "",
		"aria-hidden": "true" as const,
		onload: handleLoad,
		onerror: handleError,
	});

	const fallback = $derived({
		...avatarAnatomy.attrs.fallback,
		"aria-hidden": "true" as const,
	});

	// ── Public API ───────────────────────────────────────────────
	return {
		get status() {
			return status;
		},
		get showFallback() {
			return showFallback;
		},
		get root() {
			return root;
		},
		get image() {
			return image;
		},
		get fallback() {
			return fallback;
		},
	};
}
