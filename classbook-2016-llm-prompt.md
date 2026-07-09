# PROMPT: Build "Class Book" — Alumni Directory Web App (100% Vercel)

You are a senior full-stack engineer. Build a complete, production-ready web application called **"Class Book"** — a private alumni directory for a college friend group that lost touch after graduating in 2015. The entire app must deploy as a **single project on Vercel** (frontend + backend + storage, no separate server, no external database). Follow every requirement below exactly. Ask no clarifying questions — make reasonable assumptions and document them in `NOTES.md` if needed.

---

## 1. Tech Stack (fixed — do not substitute)

- **Frontend:** React (Vite)
- **Backend:** Node.js API routes under `/api` (Vercel Serverless Functions) — no separate Express server
- **Data storage:** `@vercel/blob` — store one JSON blob (`people.json`) holding all structured data. Vercel serverless functions have a read-only, ephemeral local filesystem, so plain `fs` writes to a local JSON file will NOT persist — Vercel Blob is the correct Vercel-native replacement and behaves like a simple persistent file store, accessed via API calls instead of local disk.
- **Photo storage:** Also `@vercel/blob` — each uploaded photo (personal photo, family photos, old college photo) is uploaded as its own blob file. Store only the returned blob URL in `people.json`, not the image data itself.
- **Styling:** Plain CSS or Tailwind CSS (your choice), themed as an old-school "class register / yearbook" aesthetic — aged paper background, deep maroon/navy accents, gold foil highlight, serif display font for headings. Avoid generic templated SaaS look.
- **Auth:** No login system. Each person "claims" their own roster entry by name and edits it freely (trusted closed group via shared link). Do not build user accounts, passwords, or sessions.

---

## 2. Data Model (`people.json`, stored as a Vercel Blob)

```json
{
  "people": [
    {
      "id": "uuid",
      "name": "string (required)",
      "occupation": "string",
      "birthday": "MM-DD or full ISO date",
      "currentCity": "string",
      "maritalStatus": "single | married",
      "spouseName": "string (optional)",
      "socialLinks": {
        "instagram": "string (optional)",
        "linkedin": "string (optional)",
        "facebook": "string (optional)",
        "other": "string (optional)"
      },
      "collegeBranch": "string (optional)",
      "collegeMemory": "string (optional)",
      "oldCollegePhoto": "blob URL (optional) — ALWAYS PUBLIC",
      "personalPhoto": {
        "url": "blob URL (optional)",
        "visibility": "public | private"
      },
      "familyPhotos": [
        {
          "url": "blob URL",
          "caption": "string (optional)",
          "visibility": "public | private"
        }
      ],
      "createdAt": "timestamp",
      "updatedAt": "timestamp"
    }
  ]
}
```

---

## 3. Public/Private Photo Logic (IMPORTANT — implement exactly)

- Every photo (personalPhoto, each familyPhoto) has its own `visibility` flag, settable only by editing that person's own entry.
- **Default value for every new photo upload is `"private"`.**
- Directory grid view: NEVER render private photos directly. Show a neutral silhouette/placeholder avatar instead.
- Profile detail view:
  - If `visibility === "public"` → render the image directly from its blob URL, no interaction needed.
  - If `visibility === "private"` → render a blurred placeholder card with a "Tap to reveal" button. On tap, reveal the image **client-side only for that viewing session** (do not change the stored flag). This is a courtesy blur, not real access control — the group is fully trusted, so no per-viewer permission system is needed.
- On the edit form, show each photo next to a toggle: **"Visible to everyone" / "Private (blurred by default)"** so the owner explicitly controls it.
- Vercel Blob URLs are unguessable but not access-controlled — that's acceptable here since there's no real per-user auth anyway. Document this clearly in README.

---

## 4. Core Features

1. **Cover / landing page** — "Batch of 2015" themed entry screen, button to enter the directory.
2. **Roster grid** — cards showing name, occupation, currentCity, birthday (day/month), maritalStatus, social icons, and avatar (silhouette if personalPhoto is private or missing).
3. **Search & filter** — by name, city, or occupation (client-side filter is fine).
4. **"Birthdays this month" banner** — computed from birthday field, shown at top of roster page.
5. **Profile detail page** (`/person/:id`) — full public info + reveal-on-tap for private photos + family photo gallery.
6. **"Add myself" / "Edit my entry" form** — full CRUD, no auth, editable by anyone (open trust model). Photo inputs upload directly to Vercel Blob via the API route.
7. **Delete entry** — allow deletion with a confirmation dialog; also delete that person's associated blob files.

---

## 5. API Routes (`/api`, Vercel Serverless Functions)

```
GET    /api/people            → list all (roster grid data)
GET    /api/people/[id]       → single profile
POST   /api/people            → create new entry (handles photo blob uploads)
PUT    /api/people/[id]       → update entry (handles photo blob uploads)
DELETE /api/people/[id]       → delete entry + associated blob files
```

All reads/writes to the `people.json` blob should go through a single helper module (`/lib/db.js`) with functions like `getAll()`, `getById(id)`, `create(data)`, `update(id, data)`, `remove(id)` — fetch the current `people.json` blob, modify in memory, re-upload it (overwrite) via `@vercel/blob`'s `put()`. Since this is a small trusted-group app (low concurrent writes), a simple read-modify-write is acceptable without a lock/queue.

---

## 6. Folder Structure

```
/api
  people/
    index.js         (GET all, POST)
    [id].js           (GET one, PUT, DELETE)
/lib
  db.js               (people.json blob read/write helper)
  blob.js             (photo upload/delete helper)
/src
  main.jsx
  App.jsx
  pages/
    Cover.jsx
    Roster.jsx
    ProfileDetail.jsx
    EditProfile.jsx
  components/
    PersonCard.jsx
    PhotoReveal.jsx
    BirthdayBanner.jsx
    SearchBar.jsx
  styles/
    theme.css
.env.example
vercel.json
README.md
```

---

## 7. Setup & Deployment Notes

- `.env.example` should include:
  ```
  BLOB_READ_WRITE_TOKEN=your_vercel_blob_token
  ```
- `README.md` must document:
  - Installing `@vercel/blob`
  - Running `vercel dev` locally to test API routes against real Vercel Blob storage (Blob requires a real token even locally — no separate local-only fallback needed since Blob's free tier works fine for dev)
  - How to connect Blob storage to the project via the Vercel dashboard (Storage tab → create a Blob store → link to project) before first deploy
  - `vercel deploy` for shipping

---

## 8. Design Direction

- Theme: old class register / yearbook, not a generic SaaS dashboard.
- Palette: aged paper background (#E9DEC2), deep oxblood/maroon accent (#5B1A23), ink navy text (#22283A), gold foil highlight (#B8912F).
- Typography: characterful serif for headings (e.g., Playfair Display), clean serif/sans for body text.
- Signature element: a circular "class seal" stamp motif used on the cover and as a small "revealed" stamp overlay on photos once tapped.
- Fully responsive down to mobile (this will primarily be opened on phones via WhatsApp link).

---

## 9. Deliverables

- Full working codebase per the structure above, deployable with a single `vercel deploy`
- `README.md` with Blob storage setup steps and deploy instructions
- `.env.example`
- Seed logic or instructions to add 2–3 sample entries for testing after first deploy

Build the entire application now, file by file.
