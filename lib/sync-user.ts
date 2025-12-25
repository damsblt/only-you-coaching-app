import { query } from './db'

export async function syncUserWithDatabase(userId: string) {
  try {
    // Check if user already exists in our custom table
    const existingUserResult = await query(
      'SELECT * FROM users WHERE id = $1',
      [userId]
    )

    if (existingUserResult && existingUserResult.length > 0) {
      console.log('User already exists in custom table:', existingUserResult[0].email)
      return { success: true, user: existingUserResult[0] }
    }

    // Note: User creation should be handled by your authentication system (NextAuth, etc.)
    // This function is kept for backward compatibility but may need to be updated
    // based on your auth implementation
    
    console.log('User sync: User not found in database. User should be created during authentication.')
    return { success: false, error: 'User not found. Please create user through authentication flow.' }

  } catch (error) {
    console.error('Error syncing user:', error)
    return { success: false, error }
  }
}

// Sync existing user
export async function syncExistingUser() {
  try {
    // This function is kept for backward compatibility
    // In a Neon-only setup, users should be managed through your authentication system
    console.log('User sync: Users should be managed through your authentication system (NextAuth, etc.)')
    return { success: true, message: 'User sync not needed with Neon database' }
  } catch (error) {
    console.error('Error syncing existing users:', error)
    return { success: false, error }
  }
}
