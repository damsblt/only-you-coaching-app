/**
 * Database client for Neon PostgreSQL
 * This replaces lib/supabase.ts for database operations
 * 
 * Note: For authentication, you'll need to migrate to NextAuth.js
 * or keep Supabase Auth separately (Neon is just the database)
 */

import { neon, neonConfig } from '@neondatabase/serverless'
import { Pool } from '@neondatabase/serverless'
import ws from 'ws'

// Configure Neon for serverless environments
if (typeof window === 'undefined') {
  neonConfig.webSocketConstructor = ws
}

const databaseUrl = process.env.DATABASE_URL

if (!databaseUrl) {
  console.error('❌ Missing DATABASE_URL environment variable')
  throw new Error('Missing DATABASE_URL environment variable')
}

// Create a connection pool for server-side operations
let pool: Pool
try {
  pool = new Pool({ connectionString: databaseUrl })
  console.log('✅ Database pool created successfully')
} catch (poolError) {
  console.error('❌ Failed to create database pool:', poolError)
  throw poolError
}

export { pool }

// Create a serverless client for edge functions
export const neonSql = neon(databaseUrl)
const sql = neonSql

/**
 * Supabase-compatible query builder wrapper
 * This provides a similar API to Supabase for easier migration
 */
class QueryBuilder {
  private table: string
  private selectFields: string = '*'
  private whereConditions: Array<{ field: string; operator: string; value: any }> = []
  private orderBy?: { field: string; ascending: boolean }
  private limitValue?: number
  private offsetValue?: number

  constructor(table: string) {
    this.table = table
  }

  select(fields: string) {
    this.selectFields = fields
    return this
  }

  eq(field: string, value: any) {
    this.whereConditions.push({ field, operator: '=', value })
    return this
  }

  neq(field: string, value: any) {
    this.whereConditions.push({ field, operator: '!=', value })
    return this
  }

  gt(field: string, value: any) {
    this.whereConditions.push({ field, operator: '>', value })
    return this
  }

  gte(field: string, value: any) {
    this.whereConditions.push({ field, operator: '>=', value })
    return this
  }

  lt(field: string, value: any) {
    this.whereConditions.push({ field, operator: '<', value })
    return this
  }

  lte(field: string, value: any) {
    this.whereConditions.push({ field, operator: '<=', value })
    return this
  }

  like(field: string, pattern: string) {
    this.whereConditions.push({ field, operator: 'LIKE', value: pattern })
    return this
  }

  ilike(field: string, pattern: string) {
    this.whereConditions.push({ field, operator: 'ILIKE', value: pattern })
    return this
  }

  in(field: string, values: any[]) {
    this.whereConditions.push({ field, operator: 'IN', value: values })
    return this
  }

  or(conditions: string) {
    // Parse Supabase-style OR conditions
    // Format: "field1.ilike.%value%,field2.ilike.%value%"
    const parts = conditions.split(',')
    const orConditions = parts.map(part => {
      const [field, ...rest] = part.split('.')
      const operator = rest[0] || '='
      let value = rest.slice(1).join('.')
      
      if (operator === 'ilike') {
        value = value.replace(/^%/, '').replace(/%$/, '')
        return { field, operator: 'ILIKE', value: `%${value}%` }
      }
      return { field, operator: '=', value }
    })
    
    this.whereConditions.push({ field: '__OR__', operator: 'OR', value: orConditions })
    return this
  }

  order(field: string, options?: { ascending?: boolean }) {
    this.orderBy = { field, ascending: options?.ascending !== false }
    return this
  }

  range(start: number, end: number) {
    this.offsetValue = start
    this.limitValue = end - start + 1
    return this
  }

  limit(count: number) {
    this.limitValue = count
    return this
  }

  offset(count: number) {
    this.offsetValue = count
    return this
  }

  private buildWhereClause(): { sql: string; params: any[] } {
    if (this.whereConditions.length === 0) {
      return { sql: '', params: [] }
    }

    const params: any[] = []
    const conditions: string[] = []
    let paramIndex = 1

    for (const condition of this.whereConditions) {
      if (condition.field === '__OR__') {
        const orConditions = condition.value as Array<{ field: string; operator: string; value: any }>
        const orParts = orConditions.map(orCond => {
          params.push(orCond.value)
          return `"${orCond.field}" ${orCond.operator} $${paramIndex++}`
        })
        conditions.push(`(${orParts.join(' OR ')})`)
      } else if (condition.operator === 'IN') {
        const placeholders = condition.value.map(() => `$${paramIndex++}`).join(', ')
        params.push(...condition.value)
        conditions.push(`"${condition.field}" IN (${placeholders})`)
      } else {
        params.push(condition.value)
        conditions.push(`"${condition.field}" ${condition.operator} $${paramIndex++}`)
      }
    }

    return {
      sql: `WHERE ${conditions.join(' AND ')}`,
      params
    }
  }

  async execute(): Promise<{ data: any[] | null; error: any }> {
    try {
      const where = this.buildWhereClause()
      
      // Escape column names in SELECT clause
      let selectClause = this.selectFields
      if (this.selectFields !== '*') {
        // Split by comma and escape each column name
        const columns = this.selectFields.split(',').map(col => {
          const trimmed = col.trim()
          // If already escaped, don't escape again
          if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
            return trimmed
          }
          return `"${trimmed}"`
        })
        selectClause = columns.join(', ')
      }
      
      let query = `SELECT ${selectClause} FROM "${this.table}"`
      const params: any[] = []

      if (where.sql) {
        query += ` ${where.sql}`
        params.push(...where.params)
      }

      if (this.orderBy) {
        query += ` ORDER BY "${this.orderBy.field}" ${this.orderBy.ascending ? 'ASC' : 'DESC'}`
      }

      if (this.limitValue) {
        params.push(this.limitValue)
        query += ` LIMIT $${params.length}`
      }

      if (this.offsetValue !== undefined) {
        params.push(this.offsetValue)
        query += ` OFFSET $${params.length}`
      }

      // Use pool.query() for server-side queries
      // The Pool.query() method accepts SQL string and params array
      console.log('🔍 Executing query:', query.substring(0, 200), 'with params:', params)
      
      let result: any
      try {
        // Use pool.query() method - this is the correct way for Neon Pool
        result = await pool.query(query, params)
        console.log('✅ Query result type:', typeof result, 'has rows:', 'rows' in result, 'is array:', Array.isArray(result))
        
        // Pool.query() returns an object with .rows property
        const rows = result.rows || (Array.isArray(result) ? result : [])
        console.log('📊 Returning', rows.length, 'rows')
        return { data: rows, error: null }
      } catch (queryError: any) {
        console.error('❌ Query execution error:', {
          message: queryError?.message,
          code: queryError?.code,
          detail: queryError?.detail,
          hint: queryError?.hint,
          fullError: queryError
        })
        return { data: null, error: queryError }
      }
    } catch (error: any) {
      console.error('❌ Database query error in execute():', {
        message: error?.message || String(error),
        code: error?.code,
        detail: error?.detail,
        hint: error?.hint,
        stack: error?.stack?.substring(0, 500),
        fullError: error
      })
      return { data: null, error }
    }
  }

  async single(): Promise<{ data: any | null; error: any }> {
    const result = await this.execute()
    if (result.error) {
      return result
    }
    if (result.data && result.data.length > 0) {
      return { data: result.data[0], error: null }
    }
    return { data: null, error: { message: 'No rows returned', code: 'PGRST116' } }
  }

  async insert(data: Record<string, any>): Promise<{ data: any | null; error: any }> {
    try {
      const keys = Object.keys(data)
      // Process values: convert arrays/objects to JSON strings for JSONB columns
      const processedValues = Object.values(data).map(val => {
        if (val === null || val === undefined) {
          return null
        }
        // If it's an array or object, stringify it (PostgreSQL JSONB will handle it)
        if (Array.isArray(val) || (typeof val === 'object' && val.constructor === Object)) {
          return JSON.stringify(val)
        }
        return val
      })
      const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ')
      const query = `INSERT INTO "${this.table}" (${keys.map(k => `"${k}"`).join(', ')}) VALUES (${placeholders}) RETURNING *`
      const result = await pool.query(query, processedValues)
      const rows = result.rows || (Array.isArray(result) ? result : [])
      return { data: rows[0] || null, error: null }
    } catch (error) {
      return { data: null, error }
    }
  }
}

/**
 * Database client with Supabase-like API
 */
class DatabaseClient {
  from(table: string) {
    return new QueryBuilder(table)
  }

  async query(querySql: string, params?: any[]): Promise<any> {
    // Use pool.query() for server-side queries
    const result = await pool.query(querySql, params || [])
    return result.rows || (Array.isArray(result) ? result : result)
  }
}

// Export singleton instances
export const db = new DatabaseClient()

// For backward compatibility, export as supabaseAdmin
export const supabaseAdmin = db

// Helper to check if we're on the server
export const isServer = typeof window === 'undefined'

/**
 * Get database client (server-side only)
 */
export const getSupabaseClient = () => {
  if (!isServer) {
    throw new Error('Database client can only be used server-side')
  }
  return db
}

/**
 * Direct SQL query helper (using pool.query for server-side operations)
 */
export async function query(querySql: string, params?: any[]): Promise<any> {
  // Use pool.query() for parameterized queries
  const result = await pool.query(querySql, params || [])
  return result.rows || (Array.isArray(result) ? result : result)
}

/**
 * Insert helper
 */
export async function insert(table: string, data: Record<string, any>): Promise<{ data: any | null; error: any }> {
  try {
    const keys = Object.keys(data)
    const values = Object.values(data)
    const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ')
    const query = `INSERT INTO "${table}" (${keys.map(k => `"${k}"`).join(', ')}) VALUES (${placeholders}) RETURNING *`
    const result = await pool.query(query, values)
    const rows = result.rows || (Array.isArray(result) ? result : [])
    return { data: rows[0] || null, error: null }
  } catch (error) {
    return { data: null, error }
  }
}

/**
 * Update helper
 */
export async function update(
  table: string,
  data: Record<string, any>,
  where: Record<string, any>
): Promise<{ data: any | null; error: any }> {
  try {
    // Escape column names with quotes
    const setClause = Object.keys(data).map((key, i) => `"${key}" = $${i + 1}`).join(', ')
    const whereClause = Object.keys(where).map((key, i) => `"${key}" = $${Object.keys(data).length + i + 1}`).join(' AND ')
    const values = [...Object.values(data), ...Object.values(where)]
    const query = `UPDATE "${table}" SET ${setClause} WHERE ${whereClause} RETURNING *`
    console.log('🔍 Update query:', query.substring(0, 200), 'with values:', values)
    const result = await pool.query(query, values)
    const rows = result.rows || (Array.isArray(result) ? result : [])
    return { data: rows[0] || null, error: null }
  } catch (error) {
    console.error('❌ Update error:', error)
    return { data: null, error }
  }
}

/**
 * Delete helper
 */
export async function remove(table: string, where: Record<string, any>): Promise<{ data: any | null; error: any }> {
  try {
    const whereClause = Object.keys(where).map((key, i) => `${key} = $${i + 1}`).join(' AND ')
    const values = Object.values(where)
    const query = `DELETE FROM "${table}" WHERE ${whereClause} RETURNING *`
    const result = await pool.query(query, values)
    const rows = result.rows || (Array.isArray(result) ? result : [])
    return { data: rows || null, error: null }
  } catch (error) {
    return { data: null, error }
  }
}

