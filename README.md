# QB Rankings

A clean weekly Top 32 QB rankings site with a public rankings board, secure Supabase login, private editor, weekly publishing, history, and light/dark themes.

## Supabase
The site is configured for the supplied Supabase project. `supabase.sql` must be run once in SQL Editor.

Create your editor account in Supabase: Authentication → Users → Add user. Use an email/password you control.

## Vercel
Upload this folder as a Vercel project. No build command is required; it is a static site.

Public page: `/index.html`
Login: `/login.html`
Editor: `/admin.html`
History: `/history.html`

The browser only contains the Supabase publishable key. Do not put a service-role/secret key in the site.
