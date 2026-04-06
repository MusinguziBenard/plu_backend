import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
)

// Raw SQL executor (replaces Sequelize)
export const query = async (sql: string, params: any[] = []) => {
  const { data, error } = await supabase.rpc('execute_sql', { query: sql, params })
  if (error) throw error
  return data
}

// Simple table operations
export const db = {
  from: (table: string) => ({
    select: async (columns = '*') => {
      const { data, error } = await supabase.from(table).select(columns)
      if (error) throw error
      return data
    },
    insert: async (values: any) => {
      const { data, error } = await supabase.from(table).insert(values).select()
      if (error) throw error
      return data[0]
    },
    update: async (values: any, where: any) => {
      const { data, error } = await supabase.from(table).update(values).match(where).select()
      if (error) throw error
      return data[0]
    },
    delete: async (where: any) => {
      const { error } = await supabase.from(table).delete().match(where)
      if (error) throw error
      return true
    }
  })
}