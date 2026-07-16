import { getSupabaseServerClient } from "../supabaseClient";

// Generic CRUD factory — the 14 MVP tables all share the same shape
// (a Postgres table, RLS already enforcing ownership, a primary key
// column). Rather than writing near-identical get/create/update/delete
// per entity, each specific repository below configures this factory
// with its table name and key column, then adds any entity-specific
// queries on top (e.g. "get by date range").
//
// This does NOT replace RLS — the database still enforces who can see
// what. This factory just avoids repeating the same Supabase call shape
// 14 times.

export function createRepository<Row, InsertRow = Partial<Row>>(table: string, idColumn: keyof Row & string) {
  return {
    async getById(id: string): Promise<Row | null> {
      const supabase = getSupabaseServerClient();
      const { data, error } = await supabase.from(table).select("*").eq(idColumn, id).maybeSingle();
      if (error) throw error;
      return data as Row | null;
    },

    async listByUser(userId: string, orderBy?: { column: string; ascending?: boolean }): Promise<Row[]> {
      const supabase = getSupabaseServerClient();
      let query = supabase.from(table).select("*").eq("user_id", userId);
      if (orderBy) query = query.order(orderBy.column, { ascending: orderBy.ascending ?? false });
      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as Row[];
    },

    async create(row: InsertRow): Promise<Row> {
      const supabase = getSupabaseServerClient();
      const { data, error } = await supabase.from(table).insert(row).select().single();
      if (error) throw error;
      return data as Row;
    },

    async update(id: string, patch: Partial<Row>): Promise<Row> {
      const supabase = getSupabaseServerClient();
      const { data, error } = await supabase.from(table).update(patch).eq(idColumn, id).select().single();
      if (error) throw error;
      return data as Row;
    },

    async remove(id: string): Promise<void> {
      const supabase = getSupabaseServerClient();
      const { error } = await supabase.from(table).delete().eq(idColumn, id);
      if (error) throw error;
    },
  };
}
