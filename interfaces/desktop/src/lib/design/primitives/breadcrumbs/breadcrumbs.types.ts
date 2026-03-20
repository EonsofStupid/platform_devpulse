import type { ColdLightDataAttrs } from "../../_internal/types/common.js";

export interface UseBreadcrumbsProps {
	/** Accessible label for the nav landmark. Default: "Breadcrumb". */
	label?: string;
}

export interface BreadcrumbsRootAttrs extends ColdLightDataAttrs {
	"data-slot": "root";
	role: "navigation";
	"aria-label": string;
}

export interface BreadcrumbsListAttrs extends ColdLightDataAttrs {
	"data-slot": "list";
}

export interface BreadcrumbsItemAttrs extends ColdLightDataAttrs {
	"data-slot": "item";
}

export interface BreadcrumbsSeparatorAttrs extends ColdLightDataAttrs {
	"data-slot": "separator";
	"aria-hidden": "true";
	role: "presentation";
}

export interface BreadcrumbsLinkAttrs extends ColdLightDataAttrs {
	"data-slot": "link";
	"aria-current": "page" | undefined;
	"data-current": "" | undefined;
}

export interface UseBreadcrumbsReturn {
	readonly root: BreadcrumbsRootAttrs;
	readonly list: BreadcrumbsListAttrs;
	readonly item: BreadcrumbsItemAttrs;
	readonly separator: BreadcrumbsSeparatorAttrs;
	/** Get link attrs. Pass isCurrent=true for the last item. */
	getLink(isCurrent?: boolean): BreadcrumbsLinkAttrs;
}
