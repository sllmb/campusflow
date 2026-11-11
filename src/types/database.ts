/**
 * Types du schéma Supabase.
 * Écrits à la main pour l'instant ; à régénérer avec la CLI Supabase quand le schéma grossira :
 *   npx supabase gen types typescript --project-id <id> > src/types/database.ts
 */
export type Database = {
  public: {
    Tables: {
      focus_sessions: {
        Row: {
          id: string;
          user_id: string;
          subject_id: string | null;
          mode: "pomodoro" | "deep_work";
          planned_minutes: number;
          started_at: string;
          ended_at: string;
          focused_seconds: number;
          completed: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string;
          subject_id?: string | null;
          mode: "pomodoro" | "deep_work";
          planned_minutes: number;
          started_at: string;
          ended_at: string;
          focused_seconds: number;
          completed?: boolean;
        };
        Update: Record<string, never>;
        Relationships: [];
      };
      revision_sessions: {
        Row: {
          id: string;
          user_id: string;
          assignment_id: string;
          planned_on: string;
          minutes: number;
          done: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string;
          assignment_id: string;
          planned_on: string;
          minutes: number;
          done?: boolean;
        };
        Update: {
          planned_on?: string;
          minutes?: number;
          done?: boolean;
        };
        Relationships: [];
      };
      grades: {
        Row: {
          id: string;
          user_id: string;
          subject_id: string;
          title: string;
          score: number;
          out_of: number;
          weight: number;
          graded_on: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string;
          subject_id: string;
          title: string;
          score: number;
          out_of?: number;
          weight?: number;
          graded_on?: string | null;
        };
        Update: {
          title?: string;
          score?: number;
          out_of?: number;
          weight?: number;
          graded_on?: string | null;
        };
        Relationships: [];
      };
      assignments: {
        Row: {
          id: string;
          user_id: string;
          subject_id: string;
          kind: "homework" | "project" | "exam";
          title: string;
          notes: string | null;
          due_at: string;
          status: "todo" | "in_progress" | "done";
          priority: "low" | "normal" | "high";
          completed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string;
          subject_id: string;
          kind?: "homework" | "project" | "exam";
          title: string;
          notes?: string | null;
          due_at: string;
          status?: "todo" | "in_progress" | "done";
          priority?: "low" | "normal" | "high";
        };
        Update: {
          subject_id?: string;
          kind?: "homework" | "project" | "exam";
          title?: string;
          notes?: string | null;
          due_at?: string;
          status?: "todo" | "in_progress" | "done";
          priority?: "low" | "normal" | "high";
        };
        Relationships: [];
      };
      semesters: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          starts_on: string;
          ends_on: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string;
          name: string;
          starts_on: string;
          ends_on: string;
        };
        Update: {
          name?: string;
          starts_on?: string;
          ends_on?: string;
        };
        Relationships: [];
      };
      teaching_units: {
        Row: {
          id: string;
          user_id: string;
          semester_id: string;
          name: string;
          code: string | null;
          ects_credits: number;
          position: number;
          jury_validated: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string;
          semester_id: string;
          name: string;
          code?: string | null;
          ects_credits: number;
          position?: number;
        };
        Update: {
          name?: string;
          code?: string | null;
          ects_credits?: number;
          position?: number;
          jury_validated?: boolean;
        };
        Relationships: [];
      };
      subjects: {
        Row: {
          id: string;
          user_id: string;
          unit_id: string;
          name: string;
          color: number;
          coefficient: number;
          position: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string;
          unit_id: string;
          name: string;
          color?: number;
          coefficient?: number;
          position?: number;
        };
        Update: {
          name?: string;
          color?: number;
          coefficient?: number;
          position?: number;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          id: string;
          display_name: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          display_name?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          display_name?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      delete_my_account: { Args: Record<string, never>; Returns: undefined };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
