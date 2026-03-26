export interface UseStepsOptions { label?: string; activeStep?: number; disabled?: boolean; }
export function useSteps(opts: UseStepsOptions) {
	return { root: { role: "group" as const, "aria-label": opts.label ?? "Progress steps", "aria-disabled": opts.disabled ? ("true" as const) : undefined } };
}
