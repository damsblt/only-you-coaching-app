import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Use service role key for admin operations
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

export async function syncUserWithDatabase(supabaseUserId: string) {
  try {
    // Get user from Supabase Auth
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.getUserById(supabaseUserId)
    
    if (authError || !authUser.user) {
      console.error('Error fetching user from Supabase Auth:', authError)
      return { success: false, error: authError }
    }

    const user = authUser.user
    
    // Check if user already exists in our custom table
    const { data: existingUser, error: existingUserError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', supabaseUserId)
      .single()

    if (existingUserError && existingUserError.code !== 'PGRST116') {
      console.error('Error checking existing user:', existingUserError)
      return { success: false, error: existingUserError }
    }

    if (existingUser) {
      console.log('User already exists in custom table:', user.email)
      return { success: true, user: existingUser }
    }

    // Create user in our custom table
    const { data: newUser, error: createError } = await supabaseAdmin
      .from('users')
      .insert({
        id: user.id,
        email: user.email!,
        name: user.user_metadata?.name || user.email!.split('@')[0],
        image: user.user_metadata?.avatar_url || null,
        role: 'USER'
      })
      .select()
      .single()

    if (createError) {
      console.error('Error creating user:', createError)
      return { success: false, error: createError }
    }

    console.log('User synced to custom table:', newUser.email)
    return { success: true, user: newUser }

  } catch (error) {
    console.error('Error syncing user:', error)
    return { success: false, error }
  }
}

// Sync existing user
export async function syncExistingUser() {
  try {
    const { data: { users }, error } = await supabaseAdmin.auth.admin.listUsers()
    
    if (error) {
      console.error('Error fetching users:', error)
      return
    }

    console.log(`Found ${users.length} users in Supabase Auth`)
    
    for (const user of users) {
      await syncUserWithDatabase(user.id)
    }
    
    console.log('All users synced!')
  } catch (error) {
    console.error('Error syncing existing users:', error)
  }
}
