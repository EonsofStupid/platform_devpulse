/**
 * @file Code Recipe — Shortcode Class Composition
 * @kind visual
 * @layer components
 *
 * GOLD STANDARD recipe — shortcode class composition system.
 *
 * Class strategy:
 *   - Structural classes (code-inline, code-block) handle layout/font/spacing
 *   - Shortcode classes (v-*, s-*, e-*) handle visual appearance (block only)
 *   - NO raw Tailwind utilities in recipe output
 */

type CodeRecipeProps = { inline?: boolean };

export function codeRecipe(props: CodeRecipeProps = {}): string {
	if (props.inline) {
		return "code-inline";
	}
	return "code-block v-void s-glass e-1";
}
