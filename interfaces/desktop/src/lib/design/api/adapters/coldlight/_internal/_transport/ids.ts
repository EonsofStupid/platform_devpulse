let counter = 0;

export function generateId(prefix = "cl"): string {
	return `${prefix}-${++counter}`;
}

export interface DialogIds {
	content: string;
	title: string;
	description: string;
}

export function createDialogIds(): DialogIds {
	const base = generateId("dlg");
	return {
		content: `${base}-content`,
		title: `${base}-title`,
		description: `${base}-desc`,
	};
}
