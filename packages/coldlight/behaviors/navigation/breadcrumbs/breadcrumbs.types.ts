import type { HTMLAnchorAttributes, HTMLAttributes } from "svelte/elements";

export interface UseBreadcrumbsProps {
	label?: string;
}

export type BreadcrumbsRootAttrs = HTMLAttributes<HTMLElement> & {
	"data-kind": "breadcrumbs";
	"data-slot": "root";
};

export type BreadcrumbsListAttrs = HTMLAttributes<HTMLOListElement> & {
	"data-kind": "breadcrumbs";
	"data-slot": "list";
};

export type BreadcrumbsItemAttrs = HTMLAttributes<HTMLLIElement> & {
	"data-kind": "breadcrumbs";
	"data-slot": "item";
};

export type BreadcrumbsSeparatorAttrs = HTMLAttributes<HTMLSpanElement> & {
	"data-kind": "breadcrumbs";
	"data-slot": "separator";
};

export type BreadcrumbsLinkAttrs = HTMLAnchorAttributes & {
	"data-kind": "breadcrumbs";
	"data-slot": "link";
	"data-current"?: "";
};

export interface UseBreadcrumbsReturn {
	readonly root: BreadcrumbsRootAttrs;
	readonly list: BreadcrumbsListAttrs;
	readonly item: BreadcrumbsItemAttrs;
	readonly separator: BreadcrumbsSeparatorAttrs;
	getLink(isCurrent?: boolean): BreadcrumbsLinkAttrs;
}
