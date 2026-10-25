const allPages = import.meta.glob("/src/routes/(app)/**/+page.svelte", {
	eager: false,
});

export function getChildRoutes(parentPath: string): { path: string; label: string }[] {
	return Object.keys(allPages)
		.map((key) => key.replace("/src/routes/(app)", "").replace("/+page.svelte", ""))
		.filter((path) => path.startsWith(`${parentPath}/`) && path !== parentPath)
		.filter((path) => {
			const relative = path.slice(parentPath.length + 1);
			return !relative.includes("/");
		})
		.map((path) => ({
			path,
			label: path.split("/").pop()?.replace(/-/g, " ") ?? "",
		}));
}
