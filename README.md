# ⚽ Football Chaos

A lightweight, highly shareable football entertainment web app. Because football isn't just about goals; it's about the banter, the questionable VAR decisions, and the unbelievable excuses.

## Features

- **Match Predictions:** Predict the score and the inevitable chaos (e.g., "Manager loses mind").
- **VAR Simulator:** Upload an image and let our highly-biased algorithm draw arbitrary lines to rule out goals.
- **Excuse Generator:** Your team lost? Don't blame the tactics. Generate the perfect delusion.
- **Chaos Bingo:** Watch a match and check off classic moments. First to 5 wins.
- **Fan Rankings:** Climb the leaderboard from "Casual" to "Football Prophet".

## Tech Stack

- Next.js 15 (App Router)
- React
- TypeScript
- Tailwind CSS v4
- shadcn/ui
- Supabase (Database & Auth - setup ready)

## Local Development

1. Clone and install dependencies:
   ```bash
   npm install
   ```

2. Setup Environment Variables:
   Create a `.env.local` file with your Supabase credentials:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

3. Run the development server:
   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000)

## Database Setup (Supabase)

1. Create a free tier project on Supabase.
2. Go to the SQL Editor.
3. Copy the contents of `database-schema.sql` and run it to create the necessary tables for profiles, matches, predictions, bingo_cards, and leaderboard entries.
4. Set up ROW LEVEL SECURITY (RLS) according to your authentication needs (guest vs. authenticated users).

## Deployment (Vercel)

1. Push this repository to GitHub.
2. Import the project in Vercel.
3. Add the `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` to Vercel Environment Variables.
4. Deploy!

## License
Built for the culture.
