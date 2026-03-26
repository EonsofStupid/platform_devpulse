export interface UseToggleGroupOptions { disabled?: boolean; orientation?: string; }
export function useToggleGroup(opts: UseToggleGroupOptions) {
	return { root: { role: "group" as const, "aria-orientation": opts.orientation, "aria-disabled": opts.disabled ? ("true" as const) : undefined } };
}
