/**
 * @file Alert Context
 * @kind alert
 * @layer components
 */

import { getContext, setContext } from "svelte";
import type { AlertIds } from "./types.js";

export interface AlertContext {
	readonly ids: Partial<AlertIds>;
	readonly dir: "ltr" | "rtl";
}

const ALERT_CTX = Symbol("coldlight-alert");

export function setAlertContext(ctx: AlertContext): void {
	setContext(ALERT_CTX, ctx);
}

export function getAlertContext(): AlertContext {
	return getContext<AlertContext>(ALERT_CTX);
}
