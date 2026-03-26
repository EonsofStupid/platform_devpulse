import type { HTMLAttributes } from "svelte/elements";

export type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6;

export interface UseHeadingProps {
	level?: HeadingLevel;
}

export type HeadingRootAttrs = HTMLAttributes<HTMLHeadingElement> & {
	"data-kind": "heading";
	"data-slot": "root";
	"data-level": HeadingLevel;
};

export interface UseHeadingReturn {
	readonly root: HeadingRootAttrs;
	readonly level: HeadingLevel;
}
