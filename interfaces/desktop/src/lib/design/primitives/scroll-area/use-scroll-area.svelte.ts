export interface UseScrollAreaOptions { label?: string; orientation?: string; }
export function useScrollArea(opts: UseScrollAreaOptions) {
	return { root: { "aria-label": opts.label, "data-orientation": opts.orientation } };
}
