export interface UseLinkPreviewOptions {
	openDelay?: number;
	closeDelay?: number;
}
export function useLinkPreview(_opts: UseLinkPreviewOptions) {
	return {
		trigger: { "data-kind": "link-preview" as const, "data-slot": "trigger" as const },
		content: {
			role: "tooltip" as const,
			"data-kind": "link-preview" as const,
			"data-slot": "content" as const,
		},
	};
}
