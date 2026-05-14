# Cloudflare Pages + Supabase Deploy

## Supabase

1. Open the Supabase project.
2. Go to SQL Editor.
3. Run `supabase-schema.sql` from this folder.
4. Go to Authentication > Users.
5. Create at least one admin user with email and password.

## Local Env

`.env` should contain:

```bash
VITE_SUPABASE_URL=https://qrqyltquhrjyzxstpror.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

Never put the Supabase service role key in Vite or frontend code.

## GitHub

From `/Users/ali/Documents/Codex/findadog-lostdog`:

```bash
git init
git add .
git commit -m "Build FDLD charity landing page"
git branch -M main
git remote add origin YOUR_GITHUB_REPO_URL
git push -u origin main
```

## Cloudflare Pages

1. Cloudflare Dashboard > Workers & Pages.
2. Create application > Pages > Connect to Git.
3. Select the GitHub repo.
4. Build settings:
   - Framework preset: Vite
   - Build command: `npm run build`
   - Build output directory: `dist`
5. Add environment variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
6. Deploy.

## After Deploy

Test:

- Public dog directory loads from `dogs`.
- RSVP inserts into `rsvps`.
- Team signup inserts into `teams`.
- Sponsor signup inserts into `sponsors`.
- Admin login uses Supabase Auth.
- Admin gallery upload writes to `fdld-gallery` Storage and `gallery_photos`.
