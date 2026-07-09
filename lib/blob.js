import { put, del } from '@vercel/blob';
import { randomUUID } from 'crypto';

function decodeDataUrl(dataUrl) {
  const match = /^data:(.+);base64,(.+)$/.exec(dataUrl);
  if (!match) throw new Error('Invalid photo data URL');
  const mimeType = match[1];
  const buffer = Buffer.from(match[2], 'base64');
  const ext = mimeType.split('/')[1]?.split('+')[0] || 'jpg';
  return { buffer, mimeType, ext };
}

export async function uploadPhoto(dataUrl, folder) {
  const { buffer, mimeType, ext } = decodeDataUrl(dataUrl);
  const pathname = `${folder}/${randomUUID()}.${ext}`;
  const blob = await put(pathname, buffer, {
    access: 'public',
    contentType: mimeType,
    addRandomSuffix: false,
  });
  return blob.url;
}

export async function deletePhoto(url) {
  if (!url) return;
  try {
    await del(url);
  } catch (err) {
    // Non-fatal: an already-missing blob shouldn't block the request.
    console.error('Failed to delete blob', url, err.message);
  }
}

// oldCollegePhoto is a plain URL string (always public, no visibility flag).
// submitted is one of: undefined/null (remove), a string (keep unchanged
// existing URL), or { dataUrl } (new upload replacing any existing photo).
// Old blobs are deliberately not deleted here: the API removes them only
// after the people.json update succeeds.
export async function resolveOldCollegePhoto(existingUrl, submitted, onUpload) {
  if (submitted === null || submitted === undefined) {
    return null;
  }
  if (typeof submitted === 'object' && submitted.dataUrl) {
    const url = await uploadPhoto(submitted.dataUrl, 'college');
    onUpload?.(url);
    return url;
  }
  if (typeof submitted === 'string') return submitted;
  return existingUrl || null;
}

// personalPhoto is { url, visibility }. submitted mirrors that shape, plus
// an optional dataUrl when the owner picks a new file.
export async function resolveSinglePhoto(existing, submitted, folder, onUpload) {
  if (submitted === null || submitted === undefined) {
    return null;
  }
  if (submitted.dataUrl) {
    const url = await uploadPhoto(submitted.dataUrl, folder);
    onUpload?.(url);
    return { url, visibility: submitted.visibility === 'public' ? 'public' : 'private' };
  }
  return {
    url: submitted.url || existing?.url || null,
    visibility: submitted.visibility === 'public' ? 'public' : 'private',
  };
}

// familyPhotos is an array of { url, caption, visibility }. The API compares
// the resolved result with the previous record and deletes removed blobs only
// after the database update succeeds.
export async function resolveFamilyPhotos(existingArray = [], submittedArray = [], onUpload) {
  const results = [];
  for (const item of submittedArray) {
    if (item.dataUrl) {
      const url = await uploadPhoto(item.dataUrl, 'family');
      onUpload?.(url);
      results.push({
        url,
        caption: item.caption || '',
        visibility: item.visibility === 'public' ? 'public' : 'private',
      });
    } else if (item.url) {
      results.push({
        url: item.url,
        caption: item.caption || '',
        visibility: item.visibility === 'public' ? 'public' : 'private',
      });
    }
  }
  return results;
}

export function getPhotoUrls(person) {
  return [
    person?.oldCollegePhoto,
    person?.personalPhoto?.url,
    ...(person?.familyPhotos || []).map((photo) => photo.url),
  ].filter(Boolean);
}

export async function deletePhotos(urls) {
  await Promise.all([...new Set(urls)].map(deletePhoto));
}
