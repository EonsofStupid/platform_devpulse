export interface UseNotificationCenterOptions {
	open?: boolean;
}
export function useNotificationCenter(_opts: UseNotificationCenterOptions) {
	return {
		root: {
			role: "log" as const,
			"aria-live": "polite" as const,
			"aria-relevant": "additions" as const,
		},
	};
}
