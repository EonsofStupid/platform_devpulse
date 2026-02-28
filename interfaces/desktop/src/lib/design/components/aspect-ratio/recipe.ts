/**
 * @file AspectRatio Recipe — Shortcode Class Composition
 * @kind layout
 * @layer components
 *
 * GOLD STANDARD recipe — shortcode class composition system.
 *
 * Class strategy:
 *   - Structural class (aspect-ratio) handles layout/positioning
 *   - NO raw Tailwind utilities in recipe output
 */

export function aspectRatioRecipe(): string {
	return "aspect-ratio";
}
