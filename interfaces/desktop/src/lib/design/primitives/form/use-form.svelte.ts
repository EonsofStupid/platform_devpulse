export interface UseFormOptions { label?: string; disabled?: boolean; pending?: boolean; }
export function useForm(opts: UseFormOptions) {
	return { root: { role: "form" as const, "aria-label": opts.label, "aria-busy": opts.pending ? ("true" as const) : undefined, "aria-disabled": opts.disabled ? ("true" as const) : undefined } };
}
