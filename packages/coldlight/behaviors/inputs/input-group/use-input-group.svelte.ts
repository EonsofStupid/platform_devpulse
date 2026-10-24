export interface UseInputGroupOptions {
	disabled?: boolean;
}
export function useInputGroup(opts: UseInputGroupOptions) {
	return {
		root: {
			role: "group" as const,
			"aria-disabled": opts.disabled ? ("true" as const) : undefined,
		},
	};
}
