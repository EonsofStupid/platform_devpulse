class GlobalState {
	current_domain = $state<string>("devpulse");
	sidebar_mode = $state<"collapsed" | "expanded">("collapsed");
	sidebar_submenu = $state<string | null>(null);

	setDomain(domain: string): void {
		this.current_domain = domain;
	}

	toggleSidebar(): void {
		this.sidebar_mode = this.sidebar_mode === "collapsed" ? "expanded" : "collapsed";
	}

	openSubmenu(hub: string): void {
		this.sidebar_submenu = this.sidebar_submenu === hub ? null : hub;
	}

	closeSubmenu(): void {
		this.sidebar_submenu = null;
	}
}

export const globalState = new GlobalState();
