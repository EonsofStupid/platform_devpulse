export interface UseListOptions {
	label?: string;
}
export function useList(opts: UseListOptions) {
	return { root: { role: "list" as const, "aria-label": opts.label } };
}
