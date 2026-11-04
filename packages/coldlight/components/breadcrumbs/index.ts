/**
 * @file Breadcrumbs Component Barrel
 * @kind breadcrumbs
 * @layer components
 */

export { default as Breadcrumbs } from "./Breadcrumbs.svelte";
export { default as BreadcrumbsItem } from "./BreadcrumbsItem.svelte";
export { default as BreadcrumbsLink } from "./BreadcrumbsLink.svelte";
export { default as BreadcrumbsList } from "./BreadcrumbsList.svelte";
export { default as BreadcrumbsPage } from "./BreadcrumbsPage.svelte";
export { default as BreadcrumbsSeparator } from "./BreadcrumbsSeparator.svelte";
export { BREADCRUMBS_DEFAULTS, BREADCRUMBS_SIZES } from "./breadcrumbs.generated.js";
export type {
	BreadcrumbsItemProps,
	BreadcrumbsLinkProps,
	BreadcrumbsListProps,
	BreadcrumbsPageProps,
	BreadcrumbsProps,
	BreadcrumbsSeparatorProps,
	BreadcrumbsSize,
} from "./types.js";
