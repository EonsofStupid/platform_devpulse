export interface UseDescriptionListOptions {
	label?: string;
}
export function useDescriptionList(opts: UseDescriptionListOptions) {
	return { root: { "aria-label": opts.label } };
}
