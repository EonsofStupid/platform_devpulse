/**
 * @file Form Field Recipe
 * @kind form-field
 * @layer components
 *
 * SD5-driven styling via CSS custom properties from the token pipeline.
 */

import type { FormFieldSize } from "./types.js";

const base = [
	"flex flex-col",
	"data-[disabled]:opacity-50",
].join(" ");

const labelBase = [
	"font-medium text-text-primary",
	"data-[required]:after:content-['*'] data-[required]:after:text-ember-400 data-[required]:after:ml-0.5",
	"data-[disabled]:text-text-muted",
].join(" ");

const controlBase = [
	"w-full",
].join(" ");

const descriptionBase = [
	"text-text-muted",
].join(" ");

const errorBase = [
	"text-ember-400",
	"data-[invalid]:block hidden",
].join(" ");

const sizeStyles: Record<FormFieldSize, string> = {
	sm: "gap-1 text-sm",
	md: "gap-1.5 text-base",
	lg: "gap-2 text-lg",
};

const labelSizeStyles: Record<FormFieldSize, string> = {
	sm: "text-xs",
	md: "text-sm",
	lg: "text-base",
};

const descriptionSizeStyles: Record<FormFieldSize, string> = {
	sm: "text-xs",
	md: "text-xs",
	lg: "text-sm",
};

const errorSizeStyles: Record<FormFieldSize, string> = {
	sm: "text-xs",
	md: "text-xs",
	lg: "text-sm",
};

export function formFieldRecipe(opts: { size: FormFieldSize }): string {
	return `${base} ${sizeStyles[opts.size]}`;
}

export function formFieldLabelRecipe(opts: { size: FormFieldSize }): string {
	return `${labelBase} ${labelSizeStyles[opts.size]}`;
}

export function formFieldControlRecipe(): string {
	return controlBase;
}

export function formFieldDescriptionRecipe(opts: { size: FormFieldSize }): string {
	return `${descriptionBase} ${descriptionSizeStyles[opts.size]}`;
}

export function formFieldErrorRecipe(opts: { size: FormFieldSize }): string {
	return `${errorBase} ${errorSizeStyles[opts.size]}`;
}
