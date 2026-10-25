export interface UseToggleProps {
	/** Whether the toggle is pressed. Default: false. */
	pressed?: boolean;
	/** Callback when pressed state changes. */
	onPressedChange?: (pressed: boolean) => void;
	/** Whether the toggle is disabled. */
	disabled?: boolean;
	"aria-label"?: string;
}

export interface UseToggleReturn {
	readonly pressed: boolean;
	readonly root: Record<string, unknown>;
	toggle(): void;
}
