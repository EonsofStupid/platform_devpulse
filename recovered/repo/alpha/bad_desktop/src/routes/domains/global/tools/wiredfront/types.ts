export interface CaptureResult {
	id: string;
	data_base64: string;
	width: number;
	height: number;
	timestamp: number;
	file_path?: string;
}

export interface ScreenInfo {
	id: number;
	name: string;
	x: number;
	y: number;
	width: number;
	height: number;
	is_primary: boolean;
	scale_factor: number;
}

export interface CaptureRegion {
	x: number;
	y: number;
	width: number;
	height: number;
}

export interface SaveOptions {
	scope: 'global' | 'project';
	project_id?: string;
	filename?: string;
}

export interface SavedCapture {
	id: string;
	filename: string;
	path: string;
	created_at: number;
	width?: number;
	height?: number;
	file_size: number;
}

export interface CaptureFilters {
	scope?: 'global' | 'project';
	project_id?: string;
	start_date?: number;
	end_date?: number;
	limit?: number;
}
