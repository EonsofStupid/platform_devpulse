export interface UseToasterOptions {
	position?: string;
}
export function useToaster(_opts: UseToasterOptions) {
	return { root: { role: "region" as const, "aria-label": "Notifications" } };
}
