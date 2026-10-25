import type { Orientation } from "../../_internal/utils/kbd.js";

export interface UseTabsProps {
	/** The currently active tab value. */
	value?: string;
	/** Callback when active tab changes. */
	onValueChange?: (value: string) => void;
	/** Tab list orientation. Default: "horizontal". */
	orientation?: Orientation;
	/** Activate tab on focus (true) or require Enter/Space (false). Default: true. */
	activateOnFocus?: boolean;
	/** Loop from last tab to first. Default: true. */
	loop?: boolean;
}

export interface UseTabsReturn {
	readonly value: string;
	readonly root: Record<string, unknown>;
	readonly list: Record<string, unknown>;
	/** Get trigger attrs for a specific tab. */
	getTrigger(tabValue: string, disabled?: boolean): Record<string, unknown>;
	/** Get content attrs for a specific tab. */
	getContent(tabValue: string): Record<string, unknown>;
}
