/**
 * @file sys/bindings/pixvix/index.ts
 * @description PixVix capture primitives — monitor / window / webcam one-shots.
 */

import { commands } from "#lib/sys/generated/bindings.js";

export const pixvixListMonitors = commands.pixvixListMonitors;
export const pixvixCaptureMonitorOnce = commands.pixvixCaptureMonitorOnce;
export const pixvixListWindows = commands.pixvixListWindows;
export const pixvixCaptureWindowOnce = commands.pixvixCaptureWindowOnce;
export const pixvixListWebcams = commands.pixvixListWebcams;
export const pixvixCaptureWebcamOnce = commands.pixvixCaptureWebcamOnce;

export type { CommandError } from "#lib/sys/bindings/_shared/index.js";
export type {
	CapturedFrame,
	MonitorInfo,
	WebcamInfo,
	WindowCapability,
	WindowListing,
} from "#lib/sys/generated/bindings.js";
