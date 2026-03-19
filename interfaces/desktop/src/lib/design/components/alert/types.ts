/**
 * @file Alert Types
 * @kind alert
 * @layer components
 */

import type { Snippet } from "svelte";
import type { HTMLAttributes } from "svelte/elements";
import type { ColdLightProps } from "$lib/design/components/_base/types.js";
import type { BaseProps } from "$lib/design/utils/cn.js";

export type AlertIntent = "info" | "success" | "warning" | "error";

export const ALERT_INTENT_PRESETS: Record<AlertIntent, string> = {
	info: "panel-glass",
	success: "panel-glass",
	warning: "panel-glass",
	error: "panel-glass",
};

export interface AlertProps
	extends Omit<HTMLAttributes<HTMLDivElement>, "style" | "children">,
		BaseProps,
		ColdLightProps {
	children?: Snippet;
	closable?: boolean;
	onClose?: () => void;
	intent?: AlertIntent;
}
