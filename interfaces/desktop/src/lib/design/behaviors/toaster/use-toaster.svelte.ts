export interface UseToasterOptions { position?: string; }
export function useToaster(opts: UseToasterOptions) {
	return { root: { role: "region" as const, "aria-label": "Notifications" } };
}
