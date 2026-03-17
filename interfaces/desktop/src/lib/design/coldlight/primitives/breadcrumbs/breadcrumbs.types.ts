export interface UseBreadcrumbsProps {
	/** Accessible label for the nav landmark. Default: "Breadcrumb". */
	label?: string;
}

export interface UseBreadcrumbsReturn {
	readonly root: Record<string, unknown>;
	readonly list: Record<string, unknown>;
	readonly item: Record<string, unknown>;
	readonly separator: Record<string, unknown>;
	/** Get link attrs. Pass isCurrent=true for the last item. */
	getLink(isCurrent?: boolean): Record<string, unknown>;
}
