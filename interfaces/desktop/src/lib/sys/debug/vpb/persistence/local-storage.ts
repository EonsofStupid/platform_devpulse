/**
 * @file VPB Persistence — localStorage Save/Load
 * @layer vpb
 * @package @devpulse/sys
 *
 * Save/load BlockDocuments to localStorage.
 * All loads are Zod-validated to catch schema drift.
 */

import { type BlockDocument, BlockDocumentSchema } from "$lib/design/blocks/schema.js";

const AUTO_SAVE_KEY = "vpb:autosave";
const DOCUMENTS_KEY = "vpb:documents";

// =============================================================================
// Auto-save (single active document)
// =============================================================================

let debounceTimer: ReturnType<typeof setTimeout> | null = null;

export function saveAutoSave(doc: BlockDocument): void {
	localStorage.setItem(AUTO_SAVE_KEY, JSON.stringify(doc));
}

export function saveAutoSaveDebounced(doc: BlockDocument): void {
	if (debounceTimer) clearTimeout(debounceTimer);
	debounceTimer = setTimeout(() => saveAutoSave(doc), 500);
}

export function loadAutoSave(): BlockDocument | null {
	const raw = localStorage.getItem(AUTO_SAVE_KEY);
	if (!raw) return null;
	try {
		return BlockDocumentSchema.parse(JSON.parse(raw)) as BlockDocument;
	} catch {
		return null;
	}
}

export function clearAutoSave(): void {
	localStorage.removeItem(AUTO_SAVE_KEY);
}

// =============================================================================
// Document library (multiple saved documents)
// =============================================================================

export function saveDocument(doc: BlockDocument): void {
	const all = loadAllDocuments();
	all[doc.id] = doc;
	localStorage.setItem(DOCUMENTS_KEY, JSON.stringify(all));
}

export function loadDocument(id: string): BlockDocument | null {
	const all = loadAllDocuments();
	const raw = all[id];
	if (!raw) return null;
	try {
		return BlockDocumentSchema.parse(raw) as BlockDocument;
	} catch {
		return null;
	}
}

export function loadAllDocuments(): Record<string, BlockDocument> {
	const raw = localStorage.getItem(DOCUMENTS_KEY);
	if (!raw) return {};
	try {
		return JSON.parse(raw);
	} catch {
		return {};
	}
}

export function deleteDocument(id: string): void {
	const all = loadAllDocuments();
	delete all[id];
	localStorage.setItem(DOCUMENTS_KEY, JSON.stringify(all));
}

// =============================================================================
// Export / Import (JSON files)
// =============================================================================

export function exportDocument(doc: BlockDocument): void {
	const json = JSON.stringify(doc, null, 2);
	const blob = new Blob([json], { type: "application/json" });
	const url = URL.createObjectURL(blob);
	const a = document.createElement("a");
	a.href = url;
	a.download = `vpb-${doc.label.toLowerCase().replace(/\s+/g, "-")}.json`;
	a.click();
	URL.revokeObjectURL(url);
}

export async function importDocument(file: File): Promise<BlockDocument | null> {
	try {
		const text = await file.text();
		const raw = JSON.parse(text);
		return BlockDocumentSchema.parse(raw) as BlockDocument;
	} catch {
		console.error("[VPB] Import failed — invalid document schema");
		return null;
	}
}
