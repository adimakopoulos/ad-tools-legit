# Life Tools Hub

A clean Vite + React + Tailwind front-end built to run on Vercel with Supabase as the backend.

It provides:

- Email/password auth (login, register, reset) and email verification via Supabase.
- Basic roles (user / admin) stored in a `profiles` table.
- **Achievement tracker** with happiness / fulfilment ratings, auto-tagging and simple stats.
- **Encryption vault** with client-side AES-GCM encryption using a master password that is never stored in plain text.
- **Stoic quotes** mapped to user-defined problems with fuzzy search to avoid duplicate problems.
- **Admin actions** table to track administrative changes.

## 1. Prerequisites

- Node.js 20+ and npm or pnpm
- A Supabase project
- (Optional but recommended) Vercel account for deployment

## 2. Supabase setup

1. Create a new Supabase project.
2. In the SQL editor, paste and run **supabase_schema.sql** from this repository.
3. In Supabase **Authentication → URL configuration**, add your local dev URL and production URL, e.g.:

   - `http://localhost:5173`
   - `https://your-vercel-domain.vercel.app`

4. In **Authentication → Providers → Email**, make sure email sign-ups and password reset are enabled.

### Create an admin user

1. Sign up with an email/password via the app UI (after you run it locally).
2. In the Supabase table editor, open the `profiles` table and set that user&apos;s `role` column to `admin`.

## 3. Local development

1. Copy `.env.example` to `.env.local`:

   ```bash
   cp .env.example .env.local
   ```

2. Fill in your Supabase values in `.env.local`:

   ```bash
   VITE_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```

3. Install dependencies and start dev server:

   ```bash
   npm install
   npm run dev
   ```

4. Open the printed URL (typically `http://localhost:5173`).

## 4. Master password & vault

- Go to **Profile**.
- Once your email is verified (Supabase sends a confirmation link on sign-up), you can set your **master password**.
- The master password:
  - Is used in the browser to derive an AES-GCM key via PBKDF2.
  - Only the derived key hash and salt are stored in the `profiles` table.
  - Is **never** displayed again. If you forget it, the encrypted vault entries cannot be recovered.

To unlock the vault for the current session, enter your master password in the Profile page. Then:

- Go to **Encryption Vault**.
- Add items with account label, optional URL, username, and password.
- Data is encrypted client-side before being sent to Supabase.

## 5. Achievement tracker

- Go to **Achievement Tracker**.
- Add title + optional description.
- Rate how fulfilling, happy, and accomplished it made you feel.
- Tags are auto-generated from the text.
- A small stats panel shows average scores.
- Basic search across title/description/tags is supported.
- Each new achievement triggers a confetti animation and plays a success sound.
  - Replace the placeholder sound file at `public/sounds/success.mp3` with your own short audio clip.

## 6. Stoic quotes

- Define **problems** (e.g. "excessive eating", "social anxiety").
- When typing a problem name, a fuzzy search will warn you if a similar problem already exists.
- Attach one or more stoic quotes to each problem.
- Click any problem tile to get a random quote for that problem.

## 7. Admin actions

- The `admin_actions` table is set up for audit logging.
- The front-end includes an **Admin** page that lists the most recent 100 actions.
- Use the helper in `src/utils/adminLog.js` to log actions from any admin-only flows you add:

  ```js
  import { logAdminAction } from '../utils/adminLog'

  await logAdminAction({
    admin_id: currentUserId,
    action_type: 'delete',
    entity: 'achievement',
    entity_id: achievementId,
    details: 'Deleted achievement as admin',
  })
  ```

Only users with `role = 'admin'` in `profiles` can access the Admin page or read from `admin_actions` thanks to RLS.

## 8. Deploying to Vercel

1. Push this project to a Git repository (GitHub, GitLab, etc.).
2. In Vercel, create a new project from that repo.
3. Set the environment variables in Vercel:

   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`

4. Vercel will run:

   ```bash
   npm install
   npm run build
   ```

   and serve the built app.

Because this is a standard Vite React app with environment variables prefixed by `VITE_`, it is Vercel-compatible out of the box.

## 9. Notes

- This project focuses on a clean, modern UI: Tailwind-based glassmorphism, floating tiles on hover, smooth button elevation for tools, and small animations for key actions.
- The cryptography uses the browser&apos;s `crypto.subtle` API; it assumes a reasonably modern browser.
- For a production system you would extend error handling, logging of admin actions, and possibly add rate limiting or additional security layers around authentication flows.
