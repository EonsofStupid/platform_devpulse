/**
 * Layout Types
 */
export interface NavItem {
	href: string;
	label: string;
	icon: string;
}

export interface NavGroup extends NavItem {
	children?: NavItem[];
}

export interface ShellState {
	sidebarWidth: number;
	collapsed: boolean;
}
