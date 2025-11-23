# Deployment Guide

## Quick Setup for Vercel

### Option 1: Use Supabase (Recommended - Free Tier Available)

1. **Set up Supabase:**
   - Go to [supabase.com](https://supabase.com) and create a free account
   - Create a new project
   - Go to SQL Editor and run the SQL from `supabase-setup.sql`
   - Go to Settings > API and copy:
     - Project URL (for `NEXT_PUBLIC_SUPABASE_URL`)
     - Service Role Key (for `SUPABASE_SERVICE_ROLE_KEY`) - **Keep this secret!**

2. **Install Supabase client:**
   ```bash
   npm install @supabase/supabase-js
   ```

3. **Set Environment Variables in Vercel:**
   - Go to your Vercel project settings
   - Add these environment variables:
     ```
     USE_SUPABASE=true
     NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
     SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
     ```

4. **Deploy to Vercel:**
   ```bash
   # If not already connected
   vercel
   
   # Or push to GitHub and connect in Vercel dashboard
   ```

### Option 2: Use In-Memory (For Testing Only)

**⚠️ Warning:** This won't work properly on Vercel in production because serverless functions are stateless. Only use for local testing.

1. **Set Environment Variable:**
   ```
   USE_SUPABASE=false
   ```
   (Or just don't set `USE_SUPABASE`)

### Option 3: Use Other Databases

You can modify `app/lib/db.ts` to use:
- **Redis** (via Upstash - free tier available)
- **PostgreSQL** (via Vercel Postgres, Supabase, or Neon)
- **MongoDB** (via MongoDB Atlas)
- **PlanetScale** (MySQL)

## Environment Variables Summary

### Required for Supabase:
- `USE_SUPABASE=true`
- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Your Supabase service role key (server-side only)

### Optional:
- `USE_SUPABASE=false` - Use in-memory store (local dev only)

## Local Development

1. **With Supabase:**
   ```bash
   # Create .env.local file
   USE_SUPABASE=true
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   
   npm run dev
   ```

2. **Without Supabase (in-memory):**
   ```bash
   # No env vars needed, or set:
   USE_SUPABASE=false
   
   npm run dev
   ```

## Database Schema

The Supabase table structure:
- `id` (TEXT, PRIMARY KEY) - Room ID
- `data` (JSONB) - Full game room data
- `updated_at` (TIMESTAMP) - Last update time

## Troubleshooting

1. **"Supabase credentials not configured" error:**
   - Make sure all environment variables are set in Vercel
   - Check that variable names match exactly (case-sensitive)

2. **"Room not found" errors:**
   - Check that the SQL setup script was run in Supabase
   - Verify the table `game_rooms` exists

3. **State not persisting:**
   - If using in-memory, this is expected on Vercel
   - Switch to Supabase for production

