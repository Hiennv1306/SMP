import { supabase } from '../../config/supabase'
import { toSupabaseError } from '../../utils/errorHandler'

function requireSupabase() {
  if (!supabase) {
    throw new Error('Supabase chua Duoc cau hinh. Xem .env.example.')
  }

  return supabase
}

export async function selectRows(table, options = {}) {
  let query = requireSupabase().from(table).select(options.columns || '*')

  if (options.filters) {
    for (const filter of options.filters) {
      query = query[filter.type || 'eq'](filter.column, filter.value)
    }
  }

  if (options.orderBy) {
    query = query.order(options.orderBy.column, {
      ascending: options.orderBy.ascending ?? true,
    })
  }

  if (options.limit) {
    query = query.limit(options.limit)
  }

  const { data, error } = await query
  if (error) {
    return { data: null, error: toSupabaseError(error) }
  }

  return { data, error: null }
}

export async function insertRows(table, values) {
  const { data, error } = await requireSupabase()
    .from(table)
    .insert(values)
    .select()

  return error
    ? { data: null, error: toSupabaseError(error) }
    : { data, error: null }
}

export async function updateRows(table, values, column, value) {
  const { data, error } = await requireSupabase()
    .from(table)
    .update(values)
    .eq(column, value)
    .select()

  return error
    ? { data: null, error: toSupabaseError(error) }
    : { data, error: null }
}

export async function deleteRows(table, column, value) {
  const { data, error } = await requireSupabase()
    .from(table)
    .delete()
    .eq(column, value)
    .select()

  return error
    ? { data: null, error: toSupabaseError(error) }
    : { data, error: null }
}
