/**
 * @file builders/alert/factory.ts
 * @package @devpulse/coldlight
 *
 * ColdLight Alert builder — Svelte 5 runes-native.
 * Owns all ARIA semantics.
 *
 * role="alert" provides implicit aria-live="assertive".
 * Optional dismiss action toggles visible state via Synced<boolean>.
 *
 * Slots: root, icon, title, description, action.
 */

import { Synced } from "../_internal/synced.svelte.js";
import {
	createBuilderMetadata,
	dataAttr,
	extract,
} from "../_internal/index.js";
import type { SlotAttrs } from "../_internal/types.js";
import type { AlertProps } from "./types.js";

const metadata = createBuilderMetadata("alert", [
	"root",
	"icon",
	"title",
	"description",
	"action",
] as const);

export class Alert {
	readonly ids = metadata.createIds();

	#visible: Synced<boolean>;
	#props: AlertProps;

	constructor(props: AlertProps = {} as AlertProps) {
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

	/** Dismiss the alert. */
	dismiss(): void {
		this.#visible.current = false;
	}

	/** Show the alert. */
	show(): void {
		this.#visible.current = true;
	}

	// --- Slot attribute getters ---

	get root(): SlotAttrs {
		const ariaLabel = extract(this.#props["aria-label"], undefined);
		const ariaLabelledby = extract(this.#props["aria-labelledby"], undefined);

		return {
			[metadata.dataAttrs.root]: "",
			id: this.ids.root,
			role: "alert",
			"aria-label": ariaLabel,
			"aria-labelledby": ariaLabelledby,
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

	get title(): SlotAttrs {
		return {
			[metadata.dataAttrs.title]: "",
			id: this.ids.title,
		};
	}

	get description(): SlotAttrs {
		return {
			[metadata.dataAttrs.description]: "",
			id: this.ids.description,
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
export function createAlert(props?: AlertProps): Alert {
	return new Alert(props);
}
