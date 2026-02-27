/**
 * @file builders/skeleton/factory.ts
 * @package @devpulse/coldlight
 *
 * ColdLight Skeleton builder -- Svelte 5 runes-native.
 * Owns all ARIA semantics.
 *
 * ARIA spec:
 * - `role="status"` -- implicit `aria-live="polite"` region.
 * - `aria-busy="true"` when loading, `"false"` when loaded.
 * - `aria-label` defaults to "Loading".
 *
 * Keyboard: None -- skeletons are non-interactive placeholder indicators.
 *
 * Data attributes:
 * - `data-builder-skeleton-root` -- root slot marker
 * - `data-state` -- `"loading"` | `"loaded"`
 */

import { Synced } from "../../builders/synced.svelte.js";
import {
	createBuilderMetadata,
	extract,
} from "../../builders/index.js";
import type { SkeletonProps } from "./types.js";

// ============================================================================
// Metadata
// ============================================================================

const metadata = createBuilderMetadata("skeleton", ["root"] as const);

// ============================================================================
// Builder
// ============================================================================

/**
 * Skeleton builder -- content placeholder with loading status semantics.
 *
 * Exposes `role="status"` with `aria-busy` to communicate loading state
 * to assistive technology. Transitions between `"loading"` and `"loaded"` data states.
 */
export class Skeleton {
	#loading: Synced<boolean>;
	#props: SkeletonProps;

	/** Unique element IDs for this builder instance. */
	readonly ids: { readonly root: string } = metadata.createIds();

	/**
	 * Create a new Skeleton builder.
	 *
	 * @param props - Configuration options. All props support `MaybeGetter` for reactivity.
	 */
	constructor(props: SkeletonProps = {}) {
		this.#props = props;

		this.#loading = new Synced<boolean>({
			value: props.loading,
			onChange: props.onLoadingChange,
			defaultValue: true,
		});
	}

	// ========================================================================
	// Reactive state
	// ========================================================================

	/** Whether the skeleton is currently in the loading state. */
	get loading(): boolean {
		return this.#loading.current;
	}

	// ========================================================================
	// Slot attribute getters
	// ========================================================================

	/**
	 * Root element attributes. Spread onto the skeleton placeholder element.
	 *
	 * Always: `role="status"`, `aria-label`.
	 * When loading: `aria-busy="true"`, `data-state="loading"`.
	 * When loaded: `aria-busy="false"`, `data-state="loaded"`.
	 */
	get root() {
		const ariaLabel = extract(this.#props["aria-label"], "Loading");
		const isLoading = this.loading;

		return {
			[metadata.dataAttrs.root]: "",
			id: this.ids.root,
			role: "status" as const,
			"aria-busy": isLoading ? ("true" as const) : ("false" as const),
			"aria-label": ariaLabel,
			"data-state": isLoading ? ("loading" as const) : ("loaded" as const),
		};
	}
}

// ============================================================================
// Factory
// ============================================================================

/**
 * Create a new Skeleton builder instance.
 *
 * @param props - Configuration options.
 * @returns A reactive Skeleton builder.
 */
export function createSkeleton(props?: SkeletonProps): Skeleton {
	return new Skeleton(props);
}
