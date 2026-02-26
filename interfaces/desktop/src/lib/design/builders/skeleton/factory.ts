/**
 * @file builders/skeleton/factory.ts
 * @package @devpulse/coldlight
 *
 * ColdLight Skeleton builder — Svelte 5 runes-native.
 * Owns all ARIA semantics.
 *
 * aria-busy="true" when loading. aria-label defaults to "Loading".
 * Synced<boolean> for loading state.
 *
 * Slots: root (single slot).
 */

import { Synced } from "../_internal/synced.svelte.js";
import {
	createBuilderMetadata,
	extract,
} from "../_internal/index.js";
import type { SlotAttrs } from "../_internal/types.js";
import type { SkeletonProps } from "./types.js";

const metadata = createBuilderMetadata("skeleton", ["root"] as const);

export class Skeleton {
	readonly ids = metadata.createIds();

	#loading: Synced<boolean>;
	#props: SkeletonProps;

	constructor(props: SkeletonProps = {} as SkeletonProps) {
		this.#props = props;

		this.#loading = new Synced<boolean>({
			value: props.loading,
			onChange: props.onLoadingChange,
			defaultValue: true,
		});
	}

	// --- Reactive state ---

	get loading(): boolean {
		return this.#loading.current;
	}

	// --- Slot attribute getters ---

	get root(): SlotAttrs {
		const ariaLabel = extract(this.#props["aria-label"], "Loading");
		const isLoading = this.loading;

		return {
			[metadata.dataAttrs.root]: "",
			id: this.ids.root,
			role: "status",
			"aria-busy": isLoading ? "true" : "false",
			"aria-label": ariaLabel,
			"data-state": isLoading ? "loading" : "loaded",
		};
	}
}

/** Factory function — preferred API. */
export function createSkeleton(props?: SkeletonProps): Skeleton {
	return new Skeleton(props);
}
