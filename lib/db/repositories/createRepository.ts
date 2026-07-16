// 14 times.
//
// TYPING NOTE (fixes the Vercel build error on this file):
// getSupabaseServerClient() returns the bare, default-generic
// SupabaseClient — there's no generated Database schema type to attach
// (no live Supabase project exists yet to generate one from; see
// MIGRATION_PLAN.md). Because `table` here is a dynamic `string`
// parameter rather than a literal known to a Database type, PostgREST's
// query builder can't resolve a real row shape for `.from(table)`. Its
// filter methods (`.eq()`, etc.) then expect a column-name type that
// collapses to something no generic `keyof Row & string` can ever
// satisfy — that's what produced:
//   "Argument of type 'keyof Row & string' is not assignable to
//    parameter of type 'never'"
// This is not a mistake in the query logic; it's a structural mismatch
// between a table-agnostic generic factory and an untyped client. The
// fix: every query starts from `builder()`, which explicitly returns
// `any` right after `.from(table)`. That sidesteps Supabase's broken
// inference for the rest of the chain (`.select`, `.eq`, `.order`,
// `.insert`, `.update`, `.delete`, `.single`, `.maybeSingle`) — all of
// which follow the exact same dynamic-table-name pattern and would hit
// an identical error if left alone. The public API stays fully typed:
// every method below still declares real `Row`/`InsertRow` return
// types, and callers like `createRepository<DbGoal>("goal", "goal_id")`
// keep full type-checking on `idColumn` against their own Row type via
// the outer function signature — only the internal Supabase chain is
// relaxed, nothing external.
//
// Once real generated Database types exist (`supabase gen types
// typescript`), this factory should be re-parameterized against them
// directly and `builder()` can go away.

export function createRepository<Row, InsertRow = Partial<Row>>(table: string, idColumn: keyof Row & string) {
  function builder(): any {
    return getSupabaseServerClient().from(table);
  }

  return {
    async getById(id: string): Promise<Row | null> {
      const { data, error } = await builder().select("*").eq(idColumn, id).maybeSingle();
      if (error) throw error;
      return data as Row | null;
    },

    async listByUser(userId: string, orderBy?: { column: string; ascending?: boolean }): Promise<Row[]> {
      let query = builder().select("*").eq("user_id", userId);
      if (orderBy) query = query.order(orderBy.column, { ascending: orderBy.ascending ?? false });
      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as Row[];
    },

    async create(row: InsertRow): Promise<Row> {
      const { data, error } = await builder().insert(row).select().single();
      if (error) throw error;
      return data as Row;
    },

    async update(id: string, patch: Partial<Row>): Promise<Row> {
      const { data, error } = await builder().update(patch).eq(idColumn, id).select().single();
      if (error) throw error;
      return data as Row;
    },

    async remove(id: string): Promise<void> {
      const { error } = await builder().delete().eq(idColumn, id);
      if (error) throw error;
    },
  };
}
