/**
 * useLabel — ColdLight label primitive hook.
 *
 * Native <label> semantics. `for` attribute associates with a form control.
 * No custom ARIA roles needed — browser handles label association natively.
 */

import { uid } from "../../_internal/utils/uid.js";
import { dataAttr } from "../../_internal/utils/data-attr.js";
import { labelAnatomy } from "./label.anatomy.js";
import type { UseLabelProps, UseLabelReturn } from "./label.types.js";

export function useLabel(props: UseLabelProps = {}): UseLabelReturn {
	const id = uid("label");
	const disabled = $derived(props.disabled ?? false);

	const root = $derived({
		...labelAnatomy.attrs.root,
		id,
		for: props.htmlFor,
		"data-disabled": dataAttr(disabled),
	});

	return {
		get root() { return root; },
	};
}
