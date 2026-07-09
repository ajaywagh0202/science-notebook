import { randomUUID } from 'crypto';
import { put, list, del } from '@vercel/blob';

// The roster is one logical JSON document. Each save writes a new immutable
// blob and removes the previous version. Public Blob overwrites may serve
// stale content from the CDN for up to 60 seconds, while a new pathname is
// immediately readable. The prefix also discovers the legacy people.json
// used by earlier versions of this app.
const PEOPLE_JSON_PREFIX = 'data/people';

async function findPeopleBlobs() {
  const { blobs } = await list({ prefix: PEOPLE_JSON_PREFIX, limit: 1000 });
  return blobs
    .filter((blob) => blob.pathname.endsWith('.json'))
    .sort((a, b) => {
      const timeDifference = new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime();
      return timeDifference || b.pathname.localeCompare(a.pathname);
    });
}

async function findPeopleBlob() {
  const [newest] = await findPeopleBlobs();
  return newest;
}

export async function getAll() {
  const existing = await findPeopleBlob();
  if (!existing) return [];

  const res = await fetch(existing.url, { cache: 'no-store' });
  if (!res.ok) {
    throw new Error(`Could not read people.json (${res.status})`);
  }

  const data = await res.json();
  if (!data || !Array.isArray(data.people)) {
    throw new Error('people.json has an invalid structure');
  }
  return data.people;
}

export async function getById(id) {
  const people = await getAll();
  return people.find((p) => p.id === id) || null;
}

async function saveAll(people) {
  const previousBlobs = await findPeopleBlobs();
  const pathname = `${PEOPLE_JSON_PREFIX}-${Date.now()}-${randomUUID()}.json`;

  const saved = await put(pathname, JSON.stringify({ people }, null, 2), {
    access: 'public',
    contentType: 'application/json',
    addRandomSuffix: false,
    cacheControlMaxAge: 60,
  });

  // Only delete older versions after the new document is safely stored.
  // A failed cleanup is non-fatal because reads always select the newest blob.
  const oldUrls = previousBlobs
    .filter((blob) => blob.url !== saved.url)
    .map((blob) => blob.url);
  if (oldUrls.length > 0) {
    try {
      await del(oldUrls);
    } catch (err) {
      console.error('Failed to remove old roster JSON blob versions', err);
    }
  }
}

export async function create(entry) {
  const people = await getAll();
  people.push(entry);
  await saveAll(people);
  return entry;
}

// updater receives the previous record and returns the next one, keeping
// the read-modify-write step atomic within this single function call.
export async function update(id, updater) {
  const people = await getAll();
  const idx = people.findIndex((p) => p.id === id);
  if (idx === -1) return null;
  people[idx] = updater(people[idx]);
  await saveAll(people);
  return people[idx];
}

export async function remove(id) {
  const people = await getAll();
  const idx = people.findIndex((p) => p.id === id);
  if (idx === -1) return null;
  const [removed] = people.splice(idx, 1);
  await saveAll(people);
  return removed;
}
