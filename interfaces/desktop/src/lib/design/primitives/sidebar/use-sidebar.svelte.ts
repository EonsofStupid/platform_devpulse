export interface UseSidebarOptions { label?: string; expanded?: boolean; }
export function useSidebar(opts: UseSidebarOptions) {
	return { root: { role: "navigation" as const, "aria-label": opts.label ?? "Sidebar", "aria-expanded": opts.expanded } };
}
