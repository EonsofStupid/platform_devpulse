/**
 * @file sys/bindings/window/index.ts
 * @description Multi-window cockpit — open/close/focus/devtools.
 */

import { commands } from "$lib/sys/generated/bindings.js";

export const openWindow = commands.openWindow;
export const closeChildWindow = commands.closeChildWindow;
export const listWindows = commands.listWindows;
export const openChatWindow = commands.openChatWindow;
export const closeWindow = commands.closeWindow;
export const focusWindow = commands.focusWindow;
export const toggleDevtools = commands.toggleDevtools;

export type {
	WindowConfig,
	WindowInfo,
	WindowRole,
} from "$lib/sys/generated/bindings.js";
