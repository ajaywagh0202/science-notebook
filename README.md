# Class Book

A private alumni directory for the batch of 2015 — no user accounts or separate server to manage, just a shared link. The whole app (React frontend, API, and storage) runs as a single Vercel project.

## Stack

- **Frontend:** React + Vite
- **Backend:** Node.js Vercel Serverless Functions under `/api`
- **Storage:** [`@vercel/blob`](https://vercel.com/docs/storage/vercel-blob) — one roster JSON blob holds all directory data, and every uploaded photo is its own blob file. Only the blob URL is stored in the roster JSON.
- **Profile protection:** each profile has its own password. Reading remains public to the group, while editing and deletion require that profile's password.

## Project layout

```
/api/people/index.js   GET all, POST new entry
/api/people/[id].js     GET one, PUT update, DELETE
/lib/db.js              roster JSON blob read/modify/write helper
/lib/blob.js             photo upload/delete + public/private resolution helpers
/lib/password.js         password validation, scrypt hashing, and verification
/src                     React app (pages, components, styles)
```

## Local development

1. Install dependencies (this includes `@vercel/blob`):
   ```
   npm install
   ```
2. Create a Blob store and link it to this project from the **Storage** tab of your Vercel dashboard (Storage → Create → Blob → connect to this project). This generates `BLOB_READ_WRITE_TOKEN`.
3. Pull the token locally:
   ```
   vercel env pull .env.local
   ```
   or copy `.env.example` to `.env.local` and paste the token manually.
4. Run the full app so `/api` routes execute exactly as they will in
   production and read/write against your real Blob store:
   ```
   npm run dev:full
   ```
   The first run downloads the pinned Vercel CLI through `npx`; no global CLI
   installation or Vercel login is required. The app still needs a valid
   `BLOB_READ_WRITE_TOKEN` in `.env.local`.
   `npm run dev` starts only Vite and is useful for frontend-only work; it
   does not serve the API routes.
   Vercel Blob has no local-only mode — even in development it talks to real (free-tier) Blob storage, which is why a real token is required.

## Deploying

```
vercel deploy
```

Make sure the Blob store is connected to the project (step 2 above) **before** your first deploy, or API calls will fail with a missing-token error.

## Seeding sample data

There's no seed script — add 2-3 sample entries by opening the deployed site and using **"Add Myself"** on the roster page. Each submission goes through the real API and writes into the roster JSON blob, so this doubles as a smoke test of the whole read/write path.

## Profile passwords & photo privacy (read this)

- There are no user accounts or sessions. Every new profile requires its own password, and that password is required for all updates and deletions.
- Passwords are never stored directly. The roster stores only a salted `scrypt` hash, and API responses remove the hash before returning profile data.
- There is no password recovery. Profile owners must keep their password safe.
- Profiles created before password protection show a one-time **Protect Legacy Profile** screen. Because the app has no identity system, the first trusted group member to protect an older profile becomes its password holder.
- Every photo (personal photo, each family photo) has a `visibility` flag: `public` or `private`, defaulting to **private** on upload. The old college photo is always public.
- In the roster grid, private personal photos never render — a silhouette placeholder is shown instead.
- On a profile page, private photos show blurred with a "Tap to reveal" button. Revealing only changes what's shown in your browser for that page load — it does **not** change the stored visibility flag or grant any other viewer access.
- **This is a courtesy blur, not access control.** Vercel Blob URLs are unguessable (long random paths) but not permissioned — anyone who obtains a photo's direct URL can view it, public or private. That's an acceptable trade-off here because there's no real per-user identity to authorize against anyway; don't reuse this pattern for data that needs genuine confidentiality.

## Environment variables

See `.env.example`:

```
BLOB_READ_WRITE_TOKEN=your_vercel_blob_token
```

## Known limits

- Photos are uploaded as base64 JSON rather than multipart form data, which is simpler to implement without extra parsing libraries but costs ~33% size overhead and is subject to Vercel's request body size limit (4.5 MB on the Hobby plan). Keep individual photos to a few hundred KB — compress before uploading for best results.
- The roster JSON is read-modified-written on every change with no locking. Fine for a small friend group with low write concurrency; not meant to scale beyond that.
- Roster saves use a new immutable `data/people-<timestamp>-<uuid>.json` pathname and delete the previous version only after the write succeeds. This keeps one logical roster blob at rest while avoiding Vercel Blob's cache delay for overwritten public files.
