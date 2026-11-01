export interface CouncilSeat {
	id: string;
	label: string;
	role: string;
	provider: string;
	kind: "answerer" | "selector";
}

export interface CouncilConfigProps {
	ticketId: string;
	seats: CouncilSeat[];
	roles: { id: string; label: string }[];
	providers: { id: string; label: string; vendor: string }[];
	validation: string | null;
	onChange: (id: string, field: "role" | "provider", value: string) => void;
	onSave: () => void;
	onBack: () => void;
}
