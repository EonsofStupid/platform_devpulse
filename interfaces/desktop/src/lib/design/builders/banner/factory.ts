/**
 * @file builders/banner/factory.ts
 * @package @devpulse/coldlight
 *
 * ColdLight Banner builder — Svelte 5 runes-native.
 * Owns all ARIA semantics.
 *
 * role="alert" on root. Dismissible via action slot.
 *
 * Slots: root, icon, content, action.
 */

import { Synced } from "../_internal/synced.svelte.js";
import {
	createBuilderMetadata,
	dataAttr,
	extract,
} from "../_internal/index.js";
import type { SlotAttrs } from "../_internal/types.js";
import type { BannerProps } from "./types.js";

const metadata = createBuilderMetadata("banner", [
	"root",
	"icon",
	"content",
	"action",
] as const);

export class Banner {
	readonly ids = metadata.createIds();

	#visible: Synced<boolean>;
	#props: BannerProps;

	constructor(props: BannerProps = {} as BannerProps) {
		this.#props = props;

		this.#visible = new Synced<boolean>({
			value: props.visible,
			onChange: props.onVisibleChange,
			defaultValue: true,
		});
	}

	// --- Reactive state ---

	get visible(): boolean {
		return this.#visible.current;
	}

	/** Dismiss the banner. */
	dismiss(): void {
		this.#visible.current = false;
	}

	/** Show the banner. */
	show(): void {
		this.#visible.current = true;
	}

	// --- Slot attribute getters ---

	get root(): SlotAttrs {
		const ariaLabel = extract(this.#props["aria-label"], undefined);
		const ariaLive = extract(this.#props["aria-live"], undefined);

		return {
			[metadata.dataAttrs.root]: "",
			id: this.ids.root,
			role: "alert",
			"aria-label": ariaLabel,
			"aria-live": ariaLive,
			"data-state": this.visible ? "visible" : "hidden",
			hidden: this.visible ? undefined : true,
		};
	}

	get icon(): SlotAttrs {
		return {
			[metadata.dataAttrs.icon]: "",
			id: this.ids.icon,
			"aria-hidden": "true",
		};
	}

	get content(): SlotAttrs {
		return {
			[metadata.dataAttrs.content]: "",
			id: this.ids.content,
		};
	}

	get action(): SlotAttrs {
		return {
			[metadata.dataAttrs.action]: "",
			id: this.ids.action,
			onclick: () => {
				this.dismiss();
			},
		};
	}
}

/** Factory function — preferred API. */
export function createBanner(props?: BannerProps): Banner {
	return new Banner(props);
}
