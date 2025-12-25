/**
 * Database client for Neon PostgreSQL using serverless client
 * This replaces lib/supabase.ts for database operations
 * 
 * Uses the neon() client directly for better compatibility with Vercel serverless environments
 */

import { neon, neonConfig } from '@neondatabase/serverless'
import ws from 'ws'

// Configure Neon for serverless environments
if (typeof window === 'undefined') {
  neonConfig.webSocketConstructor = ws
}

const databaseUrl = process.env.DATABASE_URL

if (!databaseUrl) {
  console.error('❌ Missing DATABASE_URL environment variable')
  if (process.env.NODE_ENV === 'production') {
    console.error('❌ CRITICAL: DATABASE_URL is required in production')
  }
}

// Create serverless client (works better than Pool in Vercel serverless environments)
export const sql = databaseUrl ? neon(databaseUrl) : null

// For backward compatibility
export const neonSql = sql

/**
 * Helper function to execute parameterized queries with neon() client
 * Converts SQL with $1, $2 placeholders to template literal format
 * Note: This is a workaround since template literals can't be built dynamically
 * For better performance, consider using template literals directly in your code
 */
async function executeQuery(queryStr: string, params: any[] = []): Promise<any[]> {
  if (!sql) {
    throw new Error('Database client is not initialized')
  }
  
  if (params.length === 0) {
    // No parameters, use simple query as template literal
    return await (sql as any)`${queryStr as any}`
  }
  
  // Convert parameterized query ($1, $2, etc.) to template literal
  // Split by placeholders and build template literal parts
  const parts: string[] = []
  const values: any[] = []
  const placeholderRegex = /\$(\d+)/g
  let lastIndex = 0
  let match
  
  while ((match = placeholderRegex.exec(queryStr)) !== null) {
    const placeholderIndex = parseInt(match[1]) - 1
    if (placeholderIndex >= 0 && placeholderIndex < params.length) {
      parts.push(queryStr.substring(lastIndex, match.index))
      values.push(params[placeholderIndex])
      lastIndex = match.index + match[0].length
    }
  }
  parts.push(queryStr.substring(lastIndex))
  
  // Build template literal array (neon expects TemplateStringsArray)
  const templateArray = parts as any
  templateArray.raw = parts
  
  // Execute with template literal syntax
  return await (sql as any)(templateArray, ...values)
}

/**
 * Supabase-compatible query builder wrapper
 * Uses neon() client with template literals for serverless compatibility
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

  contains(field: string, value: any) {
    // For array fields, check if array contains the value
    // Uses PostgreSQL ANY operator: 'value' = ANY(array_field)
    this.whereConditions.push({ field, operator: 'ANY', value })
    return this
  }

  or(conditions: string) {
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

  async execute(): Promise<{ data: any[] | null; error: any }> {
    try {
      if (!sql) {
        const error = new Error('Database client is not initialized. Check DATABASE_URL environment variable.')
        console.error('❌ Database client is null - DATABASE_URL may be missing or invalid')
        return { 
          data: null, 
          error: {
            message: error.message,
            code: 'CLIENT_NOT_INITIALIZED',
            hint: 'Please check your DATABASE_URL environment variable in Vercel settings'
          }
        }
      }

      // Build query using template literals for neon() client
      // Escape column names in SELECT clause
      let selectClause = this.selectFields
      if (this.selectFields !== '*') {
        const columns = this.selectFields.split(',').map(col => {
          const trimmed = col.trim()
          if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
            return trimmed
          }
          return `"${trimmed}"`
        })
        selectClause = columns.join(', ')
      }

      // Build WHERE clause with values
      const whereParts: string[] = []
      const whereValues: any[] = []
      
      for (const condition of this.whereConditions) {
        if (condition.field === '__OR__') {
          const orConditions = condition.value as Array<{ field: string; operator: string; value: any }>
          const orParts = orConditions.map(orCond => {
            whereValues.push(orCond.value)
            return `"${orCond.field}" ${orCond.operator} $${whereValues.length}`
          })
          whereParts.push(`(${orParts.join(' OR ')})`)
        } else if (condition.operator === 'IN') {
          // Build placeholders for IN clause correctly
          const inValues = Array.isArray(condition.value) ? condition.value : [condition.value]
          const placeholders = inValues.map((val: any) => {
            whereValues.push(val)
            return `$${whereValues.length}`
          }).join(', ')
          whereParts.push(`"${condition.field}" IN (${placeholders})`)
        } else if (condition.operator === 'ANY') {
          // Array contains operator - check if value exists in array (case-insensitive)
          // Use EXISTS with unnest for case-insensitive search
          whereValues.push(condition.value.toLowerCase())
          whereParts.push(`EXISTS (SELECT 1 FROM unnest("${condition.field}") AS elem WHERE LOWER(elem::text) = $${whereValues.length})`)
        } else {
          whereValues.push(condition.value)
          // Handle column names that are already quoted (for camelCase columns)
          const fieldName = condition.field.startsWith('"') && condition.field.endsWith('"') 
            ? condition.field 
            : `"${condition.field}"`
          whereParts.push(`${fieldName} ${condition.operator} $${whereValues.length}`)
        }
      }

      // Build the query string with placeholders
      let queryStr = `SELECT ${selectClause} FROM "${this.table}"`
      if (whereParts.length > 0) {
        queryStr += ` WHERE ${whereParts.join(' AND ')}`
      }
      if (this.orderBy) {
        queryStr += ` ORDER BY "${this.orderBy.field}" ${this.orderBy.ascending ? 'ASC' : 'DESC'}`
      }
      if (this.limitValue) {
        whereValues.push(this.limitValue)
        queryStr += ` LIMIT $${whereValues.length}`
      }
      if (this.offsetValue !== undefined) {
        whereValues.push(this.offsetValue)
        queryStr += ` OFFSET $${whereValues.length}`
      }

      console.log('🔍 Executing query:', queryStr.substring(0, 200), 'with', whereValues.length, 'params')

      // Use helper function to convert parameterized query to template literal
      const result = await executeQuery(queryStr, whereValues)
      
      // neon() returns an array directly
      const rows = Array.isArray(result) ? result : []
      console.log('📊 Returning', rows.length, 'rows')
      return { data: rows, error: null }
    } catch (error: any) {
      const errorInfo = {
        message: error?.message,
        code: error?.code,
        detail: error?.detail,
        hint: error?.hint,
        isConnectionError: error?.message?.includes('Connection') || 
                         error?.message?.includes('terminated') ||
                         error?.message?.includes('timeout'),
      }
      console.error('❌ Query execution error:', errorInfo)
      
      if (errorInfo.isConnectionError) {
        return {
          data: null,
          error: {
            message: 'Database connection error. Please try again.',
            code: error?.code || 'CONNECTION_ERROR',
            hint: 'The database connection was interrupted. This may be a temporary issue.',
            originalError: process.env.NODE_ENV === 'development' ? errorInfo : undefined
          }
        }
      }
      
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
      if (!sql) {
        const error = new Error('Database client is not initialized. Check DATABASE_URL environment variable.')
        console.error('❌ Database client is null in insert() - DATABASE_URL may be missing or invalid')
        return { 
          data: null, 
          error: {
            message: error.message,
            code: 'CLIENT_NOT_INITIALIZED',
            hint: 'Please check your DATABASE_URL environment variable in Vercel settings'
          }
        }
      }

      const keys = Object.keys(data)
      const values = Object.values(data).map(val => {
        if (val === null || val === undefined) {
          return null
        }
        if (Array.isArray(val) || (typeof val === 'object' && val.constructor === Object)) {
          return JSON.stringify(val)
        }
        return val
      })

      // Build template literal for INSERT
      const columns = keys.map(k => `"${k}"`).join(', ')
      const placeholders = values.map((_, i) => `$${i + 1}`).join(', ')
      const queryStr = `INSERT INTO "${this.table}" (${columns}) VALUES (${placeholders}) RETURNING *`

      console.log('🔍 Inserting into', this.table, 'with', values.length, 'values')

      // Use helper function to convert parameterized query to template literal
      const result = await executeQuery(queryStr, values)
      const rows = Array.isArray(result) ? result : []
      return { data: rows[0] || null, error: null }
    } catch (error: any) {
      const errorInfo = {
        message: error?.message,
        code: error?.code,
        detail: error?.detail,
        hint: error?.hint,
        isConnectionError: error?.message?.includes('Connection') || 
                         error?.message?.includes('terminated') ||
                         error?.message?.includes('timeout'),
      }
      console.error('❌ Insert error:', errorInfo)
      
      if (errorInfo.isConnectionError) {
        return {
          data: null,
          error: {
            message: 'Database connection error. Please try again.',
            code: error?.code || 'CONNECTION_ERROR',
            hint: 'The database connection was interrupted. This may be a temporary issue.',
            originalError: process.env.NODE_ENV === 'development' ? errorInfo : undefined
          }
        }
      }
      
      return { data: null, error }
    }
  }

  async update(data: Record<string, any>): Promise<{ data: any | null; error: any }> {
    try {
      if (!sql) {
        const error = new Error('Database client is not initialized. Check DATABASE_URL environment variable.')
        console.error('❌ Database client is null in update() - DATABASE_URL may be missing or invalid')
        return { 
          data: null, 
          error: {
            message: error.message,
            code: 'CLIENT_NOT_INITIALIZED',
            hint: 'Please check your DATABASE_URL environment variable in Vercel settings'
          }
        }
      }

      // Build SET clause
      const keys = Object.keys(data)
      const setValues: any[] = []
      const setParts: string[] = []
      
      keys.forEach((key, index) => {
        const value = data[key]
        if (value === null || value === undefined) {
          setValues.push(null)
        } else if (Array.isArray(value) || (typeof value === 'object' && value.constructor === Object)) {
          setValues.push(JSON.stringify(value))
        } else {
          setValues.push(value)
        }
        setParts.push(`"${key}" = $${index + 1}`)
      })

      // Build WHERE clause
      const whereParts: string[] = []
      let paramIndex = keys.length + 1
      
      for (const condition of this.whereConditions) {
        if (condition.operator === 'IN') {
          const inValues = Array.isArray(condition.value) ? condition.value : [condition.value]
          const placeholders = inValues.map((val: any) => {
            setValues.push(val)
            return `$${paramIndex++}`
          }).join(', ')
          whereParts.push(`"${condition.field}" IN (${placeholders})`)
        } else {
          setValues.push(condition.value)
          const fieldName = condition.field.startsWith('"') && condition.field.endsWith('"') 
            ? condition.field 
            : `"${condition.field}"`
          whereParts.push(`${fieldName} ${condition.operator} $${paramIndex++}`)
        }
      }

      if (whereParts.length === 0) {
        return { 
          data: null, 
          error: { 
            message: 'Update requires WHERE conditions', 
            code: 'MISSING_WHERE_CLAUSE' 
          } 
        }
      }

      const queryStr = `UPDATE "${this.table}" SET ${setParts.join(', ')} WHERE ${whereParts.join(' AND ')} RETURNING *`

      console.log('🔍 Updating', this.table, 'with', setValues.length, 'values')

      // Use helper function to convert parameterized query to template literal
      const result = await executeQuery(queryStr, setValues)
      const rows = Array.isArray(result) ? result : []
      return { data: rows[0] || null, error: null }
    } catch (error: any) {
      const errorInfo = {
        message: error?.message,
        code: error?.code,
        detail: error?.detail,
        hint: error?.hint,
        isConnectionError: error?.message?.includes('Connection') || 
                         error?.message?.includes('terminated') ||
                         error?.message?.includes('timeout'),
      }
      console.error('❌ Update error:', errorInfo)
      
      if (errorInfo.isConnectionError) {
        return {
          data: null,
          error: {
            message: 'Database connection error. Please try again.',
            code: error?.code || 'CONNECTION_ERROR',
            hint: 'The database connection was interrupted. This may be a temporary issue.',
            originalError: process.env.NODE_ENV === 'development' ? errorInfo : undefined
          }
        }
      }
      
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
    if (!sql) {
      throw new Error('Database client is not initialized. Check DATABASE_URL environment variable.')
    }
    
    const result = await executeQuery(querySql, params || [])
    return Array.isArray(result) ? result : []
  }
}

// Export singleton instances
export const db = new DatabaseClient()

// For backward compatibility
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
 * Direct SQL query helper
 */
export async function query(querySql: string, params?: any[]): Promise<any> {
  if (!sql) {
    throw new Error('Database client is not initialized. Check DATABASE_URL environment variable.')
  }
  
  const result = await executeQuery(querySql, params || [])
  return Array.isArray(result) ? result : []
}

/**
 * Insert helper
 */
export async function insert(table: string, data: Record<string, any>): Promise<{ data: any | null; error: any }> {
  try {
    if (!sql) {
      return { 
        data: null, 
        error: {
          message: 'Database client is not initialized. Check DATABASE_URL environment variable.',
          code: 'CLIENT_NOT_INITIALIZED'
        }
      }
    }
    
    const keys = Object.keys(data)
    const values = Object.values(data).map(val => {
      if (val === null || val === undefined) {
        return null
      }
      if (Array.isArray(val) || (typeof val === 'object' && val.constructor === Object)) {
        return JSON.stringify(val)
      }
      return val
    })
    
    const columns = keys.map(k => `"${k}"`).join(', ')
    const placeholders = values.map((_, i) => `$${i + 1}`).join(', ')
    const queryStr = `INSERT INTO "${table}" (${columns}) VALUES (${placeholders}) RETURNING *`

    const result = await executeQuery(queryStr, values)
    const rows = Array.isArray(result) ? result : []
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
    if (!sql) {
      return { 
        data: null, 
        error: {
          message: 'Database client is not initialized. Check DATABASE_URL environment variable.',
          code: 'CLIENT_NOT_INITIALIZED'
        }
      }
    }
    
    const setClause = Object.keys(data).map((key, i) => `"${key}" = $${i + 1}`).join(', ')
    const whereClause = Object.keys(where).map((key, i) => `"${key}" = $${Object.keys(data).length + i + 1}`).join(' AND ')
    const values = [...Object.values(data), ...Object.values(where)]
    const queryStr = `UPDATE "${table}" SET ${setClause} WHERE ${whereClause} RETURNING *`
    
    console.log('🔍 Update query:', queryStr.substring(0, 200), 'with values:', values.length)

    const result = await executeQuery(queryStr, values)
    const rows = Array.isArray(result) ? result : []
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
    if (!sql) {
      return { 
        data: null, 
        error: {
          message: 'Database client is not initialized. Check DATABASE_URL environment variable.',
          code: 'CLIENT_NOT_INITIALIZED'
        }
      }
    }
    
    const whereClause = Object.keys(where).map((key, i) => `"${key}" = $${i + 1}`).join(' AND ')
    const values = Object.values(where)
    const queryStr = `DELETE FROM "${table}" WHERE ${whereClause} RETURNING *`

    const result = await executeQuery(queryStr, values)
    const rows = Array.isArray(result) ? result : []
    return { data: rows || null, error: null }
  } catch (error) {
    return { data: null, error }
  }
}

// Export pool for backward compatibility (deprecated, use sql instead)
export const pool = null
