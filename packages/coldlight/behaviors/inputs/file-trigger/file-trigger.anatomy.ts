/**
 * FileTrigger anatomy — custom-styled file input trigger.
 *
 * A FileTrigger wraps a hidden <input type="file"> with a custom-styled
 * button or element. The trigger element programmatically clicks the
 * hidden input, keeping full native file picker behaviour.
 *
 * WAI-ARIA: The visible trigger is a button. The hidden input carries
 * aria-hidden to exclude it from the accessibility tree.
 * Keyboard: Space/Enter on the trigger activates the file picker.
 */

export const fileTriggerAnatomy = {
	slots: ["root", "input"] as const,
	attrs: {
		root: {
			"data-kind": "file-trigger",
			"data-slot": "root",
		},
		input: {
			"data-kind": "file-trigger",
			"data-slot": "input",
		},
	},
} as const;
