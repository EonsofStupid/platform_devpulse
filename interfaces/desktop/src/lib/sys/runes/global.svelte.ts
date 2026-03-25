export type ChatMode = "developer" | "planning" | "image" | "general";

class GlobalState {
	current_domain = $state<string>("devpulse");
	sidebar_mode = $state<"collapsed" | "expanded">("collapsed");
	sidebar_submenu = $state<string | null>(null);
	context_mode = $state<"collapsed" | "expanded">("collapsed");
	overlay_active = $state<boolean>(false);

	// Chat window state (spec: layouts/chat/README.md lines 400-416)
	chat_open = $state<boolean>(false);
	chat_minimized = $state<boolean>(false);
	chat_mode = $state<ChatMode>("general");
	chat_transparency = $state<number>(0.35);

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

	toggleContext(): void {
		this.context_mode = this.context_mode === "collapsed" ? "expanded" : "collapsed";
	}

	showOverlay(): void {
		this.overlay_active = true;
	}

	hideOverlay(): void {
		this.overlay_active = false;
	}

	toggleChat(): void {
		this.chat_open = !this.chat_open;
	}

	setMode(mode: ChatMode): void {
		this.chat_mode = mode;
	}

	minimizeChat(): void {
		this.chat_minimized = true;
	}

	restoreChat(): void {
		this.chat_minimized = false;
	}
}

export const globalState = new GlobalState();
