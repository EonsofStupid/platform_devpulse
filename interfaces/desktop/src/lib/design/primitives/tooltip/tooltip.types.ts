export interface UseTooltipProps {
	/** Delay before showing (ms). Default: 700. */
	openDelay?: number;
	/** Delay before hiding (ms). Default: 300. */
	closeDelay?: number;
}

export interface UseTooltipReturn {
	readonly open: boolean;
	readonly trigger: Record<string, unknown>;
	readonly content: Record<string, unknown>;
}
