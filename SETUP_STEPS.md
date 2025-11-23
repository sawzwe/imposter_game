# Quick Setup Steps

## ✅ Step 1: SQL Script - DONE

You've already run the SQL script in Supabase. The `game_rooms` table is created.

## 📋 Step 2: Get Your Supabase Credentials

1. Go to your Supabase project dashboard
2. Click **Settings** (gear icon) → **API**
3. Copy these two values:
   - **Project URL** (looks like: `https://xxxxx.supabase.co`)
   - **Service Role Key** (long string starting with `eyJ...` - **Keep this secret!**)

## 🔧 Step 3: Set Up Local Environment

1. Open `.env.local` file in the project root
2. Replace the placeholder values:
   ```
   USE_SUPABASE=true
   NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

## 🧪 Step 4: Test Locally

```bash
npm run dev
```

Open http://localhost:3000 and test creating a room.

## 🚀 Step 5: Deploy to Vercel

1. **Push to GitHub** (if not already):

   ```bash
   git add .
   git commit -m "Add Supabase database support"
   git push
   ```

2. **In Vercel Dashboard:**

   - Go to your project → **Settings** → **Environment Variables**
   - Add the same 3 variables from `.env.local`:
     - `USE_SUPABASE` = `true`
     - `NEXT_PUBLIC_SUPABASE_URL` = (your Supabase URL)
     - `SUPABASE_SERVICE_ROLE_KEY` = (your service role key)

3. **Redeploy** (or it will auto-deploy if connected to GitHub)

## ✅ You're Done!

Your game will now work online with persistent rooms that multiple players can join!
