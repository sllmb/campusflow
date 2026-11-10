/**
 * Types du schéma Supabase.
 * Écrits à la main pour l'instant ; à régénérer avec la CLI Supabase quand le schéma grossira :
 *   npx supabase gen types typescript --project-id <id> > src/types/database.ts
 */
export type Database = {
  public: {
    Tables: {
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
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
