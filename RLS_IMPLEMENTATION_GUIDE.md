# 🛡️ RLS Implementation Guide for Pilates App

## 📋 Overview

This guide will help you implement Row Level Security (RLS) in your Supabase database to protect your Pilates coaching app's sensitive data.

## 🚨 Why RLS is Critical for Your App

Your app currently has **NO SECURITY** on the database level. This means:
- ❌ **Anyone can access all your videos** (including premium content)
- ❌ **Anonymous users can see user data** if they know the API endpoints
- ❌ **Your paid content is completely unprotected**
- ❌ **User subscriptions and personal data are exposed**

## 🎯 What RLS Will Protect

### **Public Content (Anonymous Access)**
- ✅ Published videos (`is_published = true`)
- ✅ Published audios (`is_published = true`)

### **User-Specific Data (Authenticated Only)**
- 🔒 User profiles (own data only)
- 🔒 Subscriptions (own subscriptions only)
- 🔒 Favorites (own favorites only)
- 🔒 Playlists (own playlists + public playlists)
- 🔒 Bookings (own bookings only)

### **Admin-Only Data**
- 🔒 All user data
- 🔒 All subscriptions
- 🔒 All bookings
- 🔒 Unpublished content

## 🚀 Implementation Steps

### **Step 1: Apply RLS Policies**

1. **Go to your Supabase Dashboard**
   - Visit: https://app.supabase.com
   - Select your project
   - Go to **SQL Editor**

2. **Run the RLS Setup Script**
   - Copy the contents of `supabase-rls-setup.sql`
   - Paste into the SQL Editor
   - Click **Run**

3. **Verify RLS is Enabled**
   - Go to **Authentication** → **Policies**
   - You should see policies for each table

### **Step 2: Test the Implementation**

1. **Run the Test Script**
   ```bash
   node scripts/test-rls-policies.js
   ```

2. **Manual Testing**
   - Test anonymous access to your app
   - Test logged-in user access
   - Verify premium content is protected

### **Step 3: Update Your Code (If Needed)**

Most of your existing code should work without changes, but you may need to update:

1. **Queries that bypass authentication**
2. **Admin operations that need service role key**
3. **Error handling for access denied scenarios**

## 🔧 Key RLS Policies Explained

### **Videos Table**
```sql
-- Anonymous users: Only published videos
-- Authenticated users: All published videos  
-- Admins: All videos (including unpublished)
```

### **Users Table**
```sql
-- Users: Only their own profile
-- Admins: All users
```

### **Subscriptions Table**
```sql
-- Users: Only their own subscriptions
-- Admins: All subscriptions
```

## 🧪 Testing Checklist

### **Anonymous User Tests**
- [ ] Can browse published videos
- [ ] Cannot see user data
- [ ] Cannot see subscriptions
- [ ] Cannot see unpublished content

### **Authenticated User Tests**
- [ ] Can see all published videos
- [ ] Can see own profile
- [ ] Cannot see other users' profiles
- [ ] Can see own subscriptions
- [ ] Cannot see other users' subscriptions

### **Admin Tests**
- [ ] Can see all users
- [ ] Can see all videos (including unpublished)
- [ ] Can see all subscriptions
- [ ] Can manage all data

## ⚠️ Important Notes

### **Service Role Key**
- Use `SUPABASE_SERVICE_ROLE_KEY` for admin operations
- This bypasses RLS policies
- Keep this key secure!

### **Anonymous Key**
- Use `NEXT_PUBLIC_SUPABASE_ANON_KEY` for client-side operations
- This respects RLS policies
- Safe to expose in frontend

### **Premium Content**
- Currently, all published videos are accessible to authenticated users
- If you want to restrict premium content, uncomment the premium policies in the SQL script

## 🚨 Common Issues & Solutions

### **Issue: "Access denied" errors**
**Solution**: Check if the user is authenticated and has the right permissions

### **Issue: Admin operations failing**
**Solution**: Use the service role key for admin operations

### **Issue: Anonymous users can't see videos**
**Solution**: Check if `is_published = true` for your videos

### **Issue: Users can't see their own data**
**Solution**: Verify the user is properly authenticated and the policies are correct

## 📊 Monitoring RLS

### **Check RLS Status**
```sql
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';
```

### **View All Policies**
```sql
SELECT schemaname, tablename, policyname, permissive, roles, cmd 
FROM pg_policies 
WHERE schemaname = 'public';
```

## 🎉 Next Steps

1. **Apply the RLS policies** using the SQL script
2. **Test thoroughly** with the test script
3. **Monitor your app** for any access issues
4. **Consider premium content restrictions** if needed
5. **Set up monitoring** for security events

## 🔒 Security Best Practices

1. **Always use RLS** for user-facing tables
2. **Test with both authenticated and anonymous users**
3. **Use service role key sparingly** and only for admin operations
4. **Monitor access patterns** for suspicious activity
5. **Regularly review and update policies** as your app grows

---

**Remember**: RLS is your first line of defense. Even if someone bypasses your frontend authentication, they still can't access protected data at the database level.
