/**
 * @file Code Recipe
 * @kind code
 * @layer components
 *
 * Code styling recipe — inline and block variants via Tailwind classes.
 */

const inlineBase = [
	"font-mono text-sm",
	"bg-surface-elevated text-teal-200",
	"px-1.5 py-0.5 rounded",
	"border border-border-subtle",
].join(" ");

const blockBase = [
	"font-mono text-sm",
	"bg-surface-primary text-text-primary",
	"p-4 rounded-lg",
	"border border-border-subtle",
	"overflow-x-auto",
].join(" ");

export function codeRecipe(opts: { inline?: boolean }): string {
	return opts.inline ? inlineBase : blockBase;
}
