# Quick Start - Supabase Integration

## 🚀 Setup Steps (5 minutes)

### Step 1: Create Supabase Project
1. Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Click "New Project"
3. Fill in project details:
   - Name: GatherPath (or any name)
   - Database Password: Create a strong password
   - Region: Choose closest to you
4. Click "Create new project"
5. Wait ~2 minutes for provisioning

### Step 2: Get API Credentials
1. In your project dashboard, click "Settings" (gear icon)
2. Click "API" in the sidebar
3. Find and copy:
   - **URL**: Under "Project URL" (e.g., `https://abcdefghijk.supabase.co`)
   - **anon key**: Under "Project API keys" → anon/public (starts with `eyJ...`)

### Step 3: Run Database Migration
1. In Supabase dashboard, click "SQL Editor" from the sidebar
2. Click "+ New query"
3. Open the file `supabase/migrations/001_initial_schema.sql` from this project
4. Copy ALL the content and paste into the SQL Editor
5. Click "Run" (or press Ctrl+Enter)
6. Wait for "Success" message

### Step 4: Configure Your App
1. Open the `.env` file in the project root
2. Replace the placeholder values:
   ```env
   SUPABASE_URL=https://your-actual-project-id.supabase.co
   SUPABASE_ANON_KEY=your-actual-anon-key-here
   SESSION_SECRET=generate-a-random-string-here
   ```

### Step 5: Start the Application
```bash
npm run dev
```

## ✅ Verify Setup

1. Open http://localhost:5000
2. Click "Agent Sign Up"
3. Create an account
4. Check Supabase dashboard → Table Editor → "users" table
5. You should see your new user!

## 🎉 You're Done!

Your app is now using Supabase for:
- ✅ User authentication (agents & clients)
- ✅ Event storage and management
- ✅ Event code verification
- ✅ Client details, hotel bookings, travel options
- ✅ Guest lists per event

## 📊 View Your Data

In Supabase Dashboard:
- **Table Editor**: View/edit all tables
- **Database**: See table structure and relationships
- **Authentication**: (Not used yet - we're using custom auth)
- **API Docs**: Auto-generated API documentation

## 🐛 Common Issues

**"relation does not exist"**
→ You forgot to run the migration. Go to Step 3.

**"Invalid API key"**
→ Check your SUPABASE_ANON_KEY has no extra spaces and is the anon/public key.

**"Failed to fetch"**
→ Check SUPABASE_URL is correct and project is not paused.

## 📚 Next Steps

- Read [SUPABASE_SETUP.md](SUPABASE_SETUP.md) for detailed documentation
- Explore Supabase [Table Editor](https://supabase.com/docs/guides/database/tables) to see your data
- Learn about [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security) for production
