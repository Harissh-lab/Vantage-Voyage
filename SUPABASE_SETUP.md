# GatherPath - Supabase Setup Guide

## Prerequisites
- Node.js installed
- A Supabase account (free tier works fine)

## Supabase Setup

### 1. Create a Supabase Project
1. Go to [https://supabase.com](https://supabase.com)
2. Sign up or log in
3. Create a new project
4. Wait for the project to be provisioned (takes ~2 minutes)

### 2. Get Your Supabase Credentials
1. Go to your project settings
2. Navigate to **API** section
3. Copy the following:
   - **Project URL** (looks like: `https://xxxxxxxxxxxxx.supabase.co`)
   - **anon/public key** (starts with `eyJ...`)

### 3. Run Database Migrations
1. In your Supabase dashboard, go to **SQL Editor**
2. Click **New query**
3. Copy and paste the entire contents of `supabase/migrations/001_initial_schema.sql`
4. Click **Run** to execute the migration
5. You should see "Success. No rows returned" message

### 4. Configure Environment Variables
1. Create a `.env` file in the root directory of the project:
   ```bash
   cp .env.example .env
   ```

2. Edit the `.env` file and add your Supabase credentials:
   ```env
   SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
   SUPABASE_ANON_KEY=eyJhbGc...your-key-here
   SESSION_SECRET=your-random-secret-here
   ```

3. Generate a random session secret:
   ```bash
   # On Windows PowerShell:
   -join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | ForEach-Object {[char]$_})
   ```

### 5. Install Dependencies & Start
```bash
# Install dependencies (if not already done)
npm install

# Start the development server
npm run dev
```

## Database Schema Overview

The following tables are created:

- **users** - Stores agent and client accounts
- **events** - Event information created by agents
- **client_details** - Client information for each event
- **hotel_bookings** - Hotel booking details
- **travel_options** - Travel mode and schedule information
- **travel_schedules** - Specific flight/train timings
- **guests** - Guest list for events
- **labels** - Custom labels for categorization
- **perks** - Event perks and amenities
- **requests** - Special requests from guests

## Features Using Supabase

✅ **Authentication**
- Agent and client sign up/sign in
- Password hashing with bcrypt
- Session-based authentication

✅ **Event Management**
- Create events with unique event codes
- Publish/unpublish events
- Event code verification for clients

✅ **Data Persistence**
- All event data stored in Supabase PostgreSQL
- Client details, hotel bookings, travel options
- Guest lists with categories (VIP, Friends, Family)

✅ **Real-time Capabilities** (Future Enhancement)
- Supabase supports real-time subscriptions
- Can add live updates for event changes

## Troubleshooting

### "Invalid API key" Error
- Double-check your `SUPABASE_ANON_KEY` in `.env`
- Make sure there are no extra spaces
- Verify the key is the **anon public** key, not the service role key

### "relation does not exist" Error
- The database migration was not run
- Go to Supabase SQL Editor and run the migration script

### Cannot Connect to Supabase
- Check your `SUPABASE_URL` is correct
- Ensure your project is not paused (Supabase pauses inactive projects)
- Verify your internet connection

### Data Not Persisting
- Check Supabase Table Editor to see if data is being inserted
- Look at the browser console for errors
- Check the server logs for any database errors

## Migration from In-Memory Storage

The application now uses Supabase instead of in-memory storage. Key differences:

| Feature | In-Memory | Supabase |
|---------|-----------|----------|
| Data persistence | Lost on restart | Permanent |
| Multi-user | Limited | Full support |
| Scalability | Single instance | Cloud-scale |
| Real-time | Not available | Available |
| Backup | None | Automatic |

## Next Steps

- [ ] Set up Row Level Security policies for production
- [ ] Add real-time subscriptions for live updates
- [ ] Implement file uploads for profile images using Supabase Storage
- [ ] Add email notifications using Supabase Edge Functions
- [ ] Set up database backups

## Support

For Supabase-specific issues, refer to:
- [Supabase Documentation](https://supabase.com/docs)
- [Supabase Discord](https://discord.supabase.com)
