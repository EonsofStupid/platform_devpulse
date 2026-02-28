/**
 * @file FormField Recipe
 * @kind form-field
 * @layer components
 *
 * Shortcode class composition — ZERO raw Tailwind.
 * Structural classes: form-field-root, form-field-label,
 *   form-field-description, form-field-error
 * Size intent classes: form-field-{size}
 */

import { cn } from "$lib/design/utils/cn.js";

type FormFieldRecipeProps = { size?: string };

export function formFieldRecipe(props: FormFieldRecipeProps = {}): string {
	const sizeMap: Record<string, string> = {
		sm: "form-field-sm",
		md: "form-field-md",
	};
	return cn(
		"form-field-root",
		sizeMap[props.size ?? "md"] ?? sizeMap.md,
	);
}

export function formFieldLabelRecipe(props: FormFieldRecipeProps = {}): string {
	return cn("form-field-label");
}

export function formFieldControlRecipe(): string {
	return "";
}

export function formFieldDescriptionRecipe(props: FormFieldRecipeProps = {}): string {
	return cn("form-field-description");
}

export function formFieldErrorRecipe(props: FormFieldRecipeProps = {}): string {
	return cn("form-field-error");
}
