/**
 * Types for the Supabase schema in `supabase/migrations`.
 * After changing the schema, regenerate with:
 *   npx supabase gen types typescript --project-id <project-ref> > src/lib/server/database.types.ts
 */

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
	public: {
		Tables: {
			votes: {
				Row: {
					id: number;
					created_at: string;
					event_id: string;
					rule: string;
					choice: string;
					station: string | null;
					client_id: string | null;
					participant_id: string | null;
					persona_id: string | null;
					colour_id: string | null;
				};
				Insert: {
					id?: never;
					created_at?: string;
					event_id?: string;
					rule: string;
					choice: string;
					station?: string | null;
					client_id?: string | null;
					participant_id?: string | null;
					persona_id?: string | null;
					colour_id?: string | null;
				};
				Update: {
					id?: never;
					created_at?: string;
					event_id?: string;
					rule?: string;
					choice?: string;
					station?: string | null;
					client_id?: string | null;
					participant_id?: string | null;
					persona_id?: string | null;
					colour_id?: string | null;
				};
				Relationships: [];
			};
			vote_arrivals: {
				Row: {
					id: number;
					created_at: string;
					event_id: string;
					rule: string;
					participant_id: string;
					persona_id: string;
					colour_id: string;
				};
				Insert: {
					id?: never;
					created_at?: string;
					event_id?: string;
					rule: string;
					participant_id: string;
					persona_id: string;
					colour_id: string;
				};
				Update: {
					id?: never;
					created_at?: string;
					event_id?: string;
					rule?: string;
					participant_id?: string;
					persona_id?: string;
					colour_id?: string;
				};
				Relationships: [];
			};
			persona_holds: {
				Row: {
					event_id: string;
					persona_id: string;
					participant_id: string | null;
					taken_at: string | null;
				};
				Insert: {
					event_id: string;
					persona_id: string;
					participant_id?: string | null;
					taken_at?: string | null;
				};
				Update: {
					event_id?: string;
					persona_id?: string;
					participant_id?: string | null;
					taken_at?: string | null;
				};
				Relationships: [];
			};
			rankings: {
				Row: {
					id: string;
					created_at: string;
					event_id: string;
					persona_id: string;
					locale: string;
					ranking: string[];
					choices: Json;
				};
				Insert: {
					id?: string;
					created_at?: string;
					event_id?: string;
					persona_id: string;
					locale: string;
					ranking: string[];
					choices: Json;
				};
				Update: {
					id?: string;
					created_at?: string;
					event_id?: string;
					persona_id?: string;
					locale?: string;
					ranking?: string[];
					choices?: Json;
				};
				Relationships: [];
			};
			participant_events: {
				Row: {
					event_id: string;
					participant_id: string;
					kind: string;
					occurred_at: string;
					received_at: string;
				};
				Insert: {
					event_id: string;
					participant_id: string;
					kind: string;
					occurred_at: string;
					received_at?: string;
				};
				Update: {
					event_id?: string;
					participant_id?: string;
					kind?: string;
					occurred_at?: string;
					received_at?: string;
				};
				Relationships: [];
			};
		};
		Views: {
			participant_durations: {
				Row: {
					event_id: string | null;
					participant_id: string | null;
					opened_at: string | null;
					finished_at: string | null;
					duration: unknown;
					downloaded_pdf: boolean | null;
				};
				Relationships: [];
			};
		};
		Functions: {
			take_persona: {
				Args: {
					p_event_id: string;
					p_block: string;
					p_participant_id: string;
					p_persona_ids: string[];
					p_hold_minutes: number;
				};
				Returns: string;
			};
			return_persona: {
				Args: { p_event_id: string; p_participant_id: string };
				Returns: undefined;
			};
			empty_persona_holds: { Args: Record<PropertyKey, never>; Returns: undefined };
			vote_summary: {
				Args: { p_event_id: string; p_rule: string };
				Returns: { choice: string; votes: number }[];
			};
		};
		Enums: { [_ in never]: never };
		CompositeTypes: { [_ in never]: never };
	};
};
