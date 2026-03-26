/**
 * useHeading — ColdLight heading primitive hook.
 *
 * Provides data attributes for VPB to identify and correctly author headings.
 * Level (1-6) determines which <h1>-<h6> the component renders.
 * VPB reads data-level to know what's authored and generates correct code.
 */

import { headingAnatomy } from "./heading.anatomy.js";
import type { UseHeadingProps, UseHeadingReturn, HeadingLevel } from "./heading.types.js";

export function useHeading(props: UseHeadingProps = {}): UseHeadingReturn {
	const level: HeadingLevel = props.level ?? 2;

	const root = $derived({
		...headingAnatomy.attrs.root,
		"data-level": level,
	});

	return {
		get root() {
			return root;
		},
		get level() {
			return level;
		},
	};
}
