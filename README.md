# My Wishlist

A static wishlist website hosted by GitHub Pages, with shared data and authentication provided by Supabase.

## Free shared database setup

1. Create a free project at [supabase.com](https://supabase.com). The current Free plan includes a 500 MB Postgres database and can pause projects after a week of low activity.
2. In Supabase **Authentication**, create your own user with an email and password. Turn off public signups so visitors cannot create accounts.
3. Open `supabase-setup.sql`. Replace `admin@example.com` with the exact email you created, then run the full script in **SQL Editor**.
4. In the project's **Connect** dialog, copy the Project URL and the **publishable key** (`sb_publishable_…`). Put them in `js/supabase-config.js`.
5. Commit and push the changed files to GitHub. GitHub Pages will publish the update. The manager page is at `/backstage-7d9c2f1a4e6b8c03f5a172de9b64c810.html` under your site URL.

The publishable key is intended for browser code. The SQL policies limit public access to reading items and reserving an available item; only the configured admin email can add, edit, or delete items. Never put a Supabase secret or `service_role` key in this repository.

## How syncing works

The manager writes wishlist items to Supabase. Visitors read from the same database, and Supabase Realtime pushes additions, edits, deletions, and reservations to open pages. Reservations are atomic, so two visitors cannot reserve the same available item at once. Theme preference is still saved locally in each browser.

The database setup is in `supabase-setup.sql`. If the free project pauses due to inactivity, resume it in the Supabase dashboard. The manager page is unlinked and marked `noindex`, and it also requires Supabase sign-in; the secret-looking URL itself is not an access control.

## Files

- `index.html` — public wishlist
- `backstage-7d9c2f1a4e6b8c03f5a172de9b64c810.html` — manager page with sign-in
- `css/style.css` — responsive light and dark themes
- `js/supabase-config.js` — project URL and publishable key
- `js/data.js` — shared URL and escaping helpers
- `js/app.js` — public list, search, reservation, and live updates
- `js/admin.js` — admin authentication and shared item editing
- `supabase-setup.sql` — database table, policies, reservation function, and Realtime setup
