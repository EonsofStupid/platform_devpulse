/**
 * useLog — ColdLight log primitive hook.
 *
 * A named live region (role="log") whose lines arrive at the end. While it
 * follows, new lines keep it at the newest; scrolling away stops following,
 * and returning to the end resumes it. Following is controllable (`following`
 * / `defaultFollowing` / `onFollowingChange`).
 *
 * Call it once, with getters for anything that changes (`count`, `label`).
 * Parts: root, list, line, time, level, source, text (see `logAnatomy`).
 *
 * @example
 * ```svelte
 * <script>
 *   const log = useLog({ get count() { return lines.length; }, label: "Today's actions" });
 * </script>
 * <div {...log.root} use:log.attachRoot>
 *   <ol {...log.list}>{#each lines as line}<li {...logAnatomy.attrs.line}>…</li>{/each}</ol>
 * </div>
 * ```
 */

import { controllable } from "../../_internal/utils/controllable.svelte.js";
import { dataAttr } from "../../_internal/utils/data-attr.js";
import { logAnatomy } from "./log.anatomy.js";
import type { UseLogProps, UseLogReturn } from "./log.types.js";

/**
 * How close to the bottom still counts as "at the end": scroll positions are
 * fractional on scaled displays, so an exact comparison misses by a pixel.
 */
const END_TOLERANCE_PX = 2;

function atEnd(node: HTMLElement): boolean {
	return node.scrollHeight - node.scrollTop - node.clientHeight <= END_TOLERANCE_PX;
}

export function useLog(props: UseLogProps): UseLogReturn {
	const following = controllable({
		value: () => props.following,
		defaultValue: () => props.defaultFollowing ?? true,
		onChange: (next) => props.onFollowingChange?.(next),
	});

	const root = $derived({
		...logAnatomy.attrs.root,
		role: "log" as const,
		"aria-label": props.label,
		"aria-labelledby": props["aria-labelledby"],
		tabindex: 0 as const,
		"data-following": dataAttr(following.current),
	});

	const list = $derived({ ...logAnatomy.attrs.list });

	function attachRoot(node: HTMLElement): { destroy(): void } {
		const onScroll = (): void => following.set(atEnd(node));
		node.addEventListener("scroll", onScroll, { passive: true });

		// Effects run after the DOM holds the new lines, so the end is measurable.
		$effect(() => {
			void props.count;
			if (following.current) node.scrollTop = node.scrollHeight;
		});

		return {
			destroy() {
				node.removeEventListener("scroll", onScroll);
			},
		};
	}

	return {
		get following() {
			return following.current;
		},
		get root() {
			return root;
		},
		get list() {
			return list;
		},
		attachRoot,
	};
}
