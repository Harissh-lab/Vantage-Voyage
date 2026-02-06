# 📸 Getting Your Supabase Credentials - Visual Guide

## Step-by-Step Instructions with Screenshots

### Step 1: Go to Supabase Dashboard
1. Open your browser and go to: **https://supabase.com/dashboard**
2. Sign up or log in with your account

### Step 2: Create a New Project
1. Click the **"New Project"** button (green button on the top right)
2. Fill in the form:
   - **Name**: `GatherPath` (or any name you prefer)
   - **Database Password**: Create a STRONG password and SAVE IT somewhere safe
   - **Region**: Select the region closest to you (e.g., `Southeast Asia`, `US East`, etc.)
   - **Pricing Plan**: Select "Free" (it's enough for development)
3. Click **"Create new project"**
4. ⏱️ Wait about 2 minutes while Supabase sets up your database

### Step 3: Get Your Project URL
Once your project is created:

1. Look at the top of the page - you'll see your project URL in the browser address bar
2. Or, go to **Settings** (gear icon in the sidebar)
3. Click **"API"** in the settings menu
4. Find the section called **"Config"**
5. Copy the **"Project URL"** (looks like: `https://abcdefghijk.supabase.co`)

```
Example:
SUPABASE_URL=https://xyzabc123def.supabase.co
```

### Step 4: Get Your anon/public Key
Still on the **Settings → API** page:

1. Scroll down to the section **"Project API keys"**
2. You'll see two keys:
   - `anon` `public` - ✅ THIS IS THE ONE YOU NEED
   - `service_role` `secret` - ❌ DO NOT USE THIS ONE
3. Click the **Copy** icon next to the `anon public` key
4. The key will start with `eyJ...` and is very long

```
Example:
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB0...
```

### Step 5: Update Your .env File
1. Open the `.env` file in your project root folder
2. Replace the placeholder values:

```env
# Before:
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here

# After (with your actual values):
SUPABASE_URL=https://xyzabc123def.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB0...
```

3. Generate a random session secret:
   ```bash
   # On Windows PowerShell:
   -join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | ForEach-Object {[char]$_})
   ```
   
4. Add it to your `.env`:
   ```env
   SESSION_SECRET=abc123xyz789randomstring
   ```

### Step 6: Run the Database Migration
1. In Supabase dashboard, click **"SQL Editor"** from the left sidebar
2. Click **"+ New query"** button
3. Open the file `supabase/migrations/001_initial_schema.sql` from your project
4. **Copy ALL the content** (Ctrl+A, Ctrl+C)
5. **Paste** it into the SQL Editor in Supabase (Ctrl+V)
6. Click the **"Run"** button (or press Ctrl+Enter)
7. Wait for the success message: ✅ **"Success. No rows returned"**

### Step 7: Verify Tables Were Created
1. Click **"Table Editor"** from the left sidebar
2. You should see all the tables:
   - users
   - events
   - client_details
   - hotel_bookings
   - travel_options
   - travel_schedules
   - guests
   - labels
   - perks
   - requests

### Step 8: Start Your Application
```bash
npm run dev
```

### Step 9: Test It Works
1. Open http://localhost:5000
2. Click **"Agent Sign Up"**
3. Fill in the form and create an account
4. Go back to Supabase → **Table Editor** → **"users"** table
5. You should see your new user! 🎉

---

## 🔍 Where to Find What

### Supabase Dashboard Navigation

| What You Need | Where to Find It |
|---------------|------------------|
| Project URL | Settings → API → Config → URL |
| anon/public key | Settings → API → Project API keys → anon public |
| Run SQL | SQL Editor (left sidebar) |
| View Data | Table Editor (left sidebar) |
| Check Usage | Home (dashboard icon) |
| Database Password | You created this when making the project |

### Common Locations in Dashboard

```
Sidebar Menu:
├── 🏠 Home (Dashboard)
├── 📊 Table Editor ← View your data here
├── 🔒 Authentication
├── 🗄️ Database
├── 💾 Storage  
├── ⚡ Edge Functions
├── 📝 SQL Editor ← Run migrations here
└── ⚙️ Settings
    └── API ← Get credentials here
```

---

## ⚠️ Important Security Notes

### ✅ DO:
- Use the **anon/public** key in your `.env`
- Keep your database password safe
- Keep your session secret random and private
- Add `.env` to `.gitignore` (already done)

### ❌ DON'T:
- Share your service_role key publicly
- Commit `.env` to git
- Use the database password anywhere except Supabase dashboard
- Share your credentials in screenshots or public forums

---

## 🆘 Troubleshooting Visual Guide

### Problem: "Can't find the API section"
**Solution:**
1. Click the **gear icon** (⚙️) at the bottom of the left sidebar
2. Look for **"API"** in the settings menu
3. Click it

### Problem: "Too many keys, which one?"
**Solution:**
- Look for the one labeled `anon` `public` with a green "public" badge
- It will have a copy icon next to it
- The key starts with `eyJ`

### Problem: "Migration failed"
**Solution:**
1. Make sure you copied the ENTIRE SQL file
2. Check you're in SQL Editor, not Database section
3. Try clicking "Run" again
4. If still fails, check the error message

### Problem: "Can't find Table Editor"
**Solution:**
1. Look at the left sidebar
2. Find the icon that looks like a table/grid (📊)
3. Click it
4. You should see "users", "events", etc.

---

## 📞 Need More Help?

- Check [QUICKSTART.md](QUICKSTART.md) for text-based setup
- Read [SUPABASE_SETUP.md](SUPABASE_SETUP.md) for detailed docs
- Visit [Supabase Documentation](https://supabase.com/docs)

---

**Next:** After getting your credentials, go back to [QUICKSTART.md](QUICKSTART.md) and continue with Step 4!
