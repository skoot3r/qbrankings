# QB Rankings

Minimal weekly QB rankings site with a public rankings page and a secure editor/login architecture.

## Secure login + publishing
The site is wired for Supabase Auth + Postgres. To enable it:

1. Create a Supabase project.
2. In Authentication, create your editor user with email/password.
3. Open the Supabase SQL editor and run `supabase.sql`.
4. Copy your project URL and anon key into `config.js`.
5. Deploy the folder to a static host (Vercel, Netlify, GitHub Pages, etc.).
6. Visit `login.html` to sign in. The Editor page is protected by the Supabase session.

The anon key is intended for browser use; security comes from Supabase Row Level Security. Keep service-role keys out of the website.

## Weekly workflow
Sign in → Editor → reorder QBs → edit thoughts → choose week/date → Publish Week. Each published edition is stored separately, so history is preserved.
