export interface UseSwitchProps {
	/** Whether the switch is on. Default: false. */
	checked?: boolean;
	/** Callback when checked state changes. */
	onCheckedChange?: (checked: boolean) => void;
	/** Whether the switch is disabled. */
	disabled?: boolean;
	/** Whether the switch is required. */
	required?: boolean;
	/** Accessible label. */
	"aria-label"?: string;
	"aria-labelledby"?: string;
	"aria-describedby"?: string;
}

export interface UseSwitchReturn {
	readonly checked: boolean;
	readonly root: Record<string, unknown>;
	readonly thumb: Record<string, unknown>;
	readonly label: Record<string, unknown>;
	toggle(): void;
	turnOn(): void;
	turnOff(): void;
}
