/**
 * @file api/adapters/meltui/_internal/avatar/adapter.ts
 * @package @devpulse/coldlight
 *
 * MeltUI Avatar adapter — wraps the MeltUI Avatar builder into AdapterResult.
 *
 * Avatar has two slots: image and fallback. The loading status drives
 * visibility via style attributes. The image slot has onload/onerror handlers.
 */

import type { AdapterResult } from "../../../_schema/engine.js";
import { createMeltAvatar, type MeltAvatarConfig } from "./factory.js";

export function createAdapter(props?: Record<string, unknown>): AdapterResult {
	const builder = createMeltAvatar(props as MeltAvatarConfig);

	return {
		states: {
			loading: {
				get current() {
					return builder.loadingStatus === "loading";
				},
				set current(_v: boolean) {
					// loadingStatus is read-only (driven by image load events)
				},
			},
			loaded: {
				get current() {
					return builder.loadingStatus === "loaded";
				},
				set current(_v: boolean) {
					// loadingStatus is read-only
				},
			},
			error: {
				get current() {
					return builder.loadingStatus === "error";
				},
				set current(_v: boolean) {
					// loadingStatus is read-only
				},
			},
		},
		attrs: {
			image: {
				get "data-melt-avatar-image"() {
					return builder.image["data-melt-avatar-image"];
				},
				get src() {
					return builder.image.src;
				},
				get style() {
					return builder.image.style;
				},
			},
			fallback: {
				get "data-melt-avatar-fallback"() {
					return builder.image["data-melt-avatar-image"];
				},
				get style() {
					return builder.fallback.style;
				},
				get hidden() {
					return builder.fallback.hidden === true ? "" : undefined;
				},
			},
		},
		handlers: {
			image: {
				get onload() {
					return builder.image.onload as unknown as (e: Event) => void;
				},
				get onerror() {
					return builder.image.onerror as unknown as (e: Event) => void;
				},
			},
			fallback: {},
		},
		context: {
			/** Direct access to loadingStatus for fine-grained state checks */
			get loadingStatus() {
				return builder.loadingStatus;
			},
		},
	};
}
