/**
 * @file Spacer Recipe
 * @kind spacer
 * @layer components
 */

type SpacerRecipeProps = { size?: string };

export function spacerRecipe(props: SpacerRecipeProps = {}): string {
	const sizeMap: Record<string, string> = {
		xs: "h-1",
		sm: "h-2",
		md: "h-4",
		lg: "h-8",
		xl: "h-16",
	};
	return sizeMap[props.size ?? "md"] ?? sizeMap.md;
}
