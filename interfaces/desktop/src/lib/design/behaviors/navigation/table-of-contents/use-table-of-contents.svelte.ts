export interface UseTableOfContentsOptions {
	label?: string;
}
export function useTableOfContents(opts: UseTableOfContentsOptions) {
	return { root: { role: "navigation" as const, "aria-label": opts.label ?? "Table of contents" } };
}
