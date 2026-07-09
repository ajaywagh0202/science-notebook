import { randomUUID } from 'crypto';
import * as db from '../../lib/db.js';
import { uploadPhoto, resolveFamilyPhotos, deletePhotos } from '../../lib/blob.js';

function noStore(res) {
  res.setHeader('Cache-Control', 'no-store, max-age=0');
}

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      noStore(res);
      const people = await db.getAll();
      return res.status(200).json(people);
    } catch (err) {
      console.error('Failed to load roster', err);
      return res.status(500).json({
        error: 'Failed to load the roster. Check the Vercel Blob connection and token.',
      });
    }
  }

  if (req.method === 'POST') {
    const uploadedUrls = [];
    try {
      const body = req.body || {};
      if (!body.name || !body.name.trim()) {
        return res.status(400).json({ error: 'Name is required' });
      }

      const now = new Date().toISOString();

      const oldCollegePhoto = body.oldCollegePhoto?.dataUrl
        ? await uploadPhoto(body.oldCollegePhoto.dataUrl, 'college').then((url) => {
            uploadedUrls.push(url);
            return url;
          })
        : null;

      const personalPhoto = body.personalPhoto?.dataUrl
        ? {
            url: await uploadPhoto(body.personalPhoto.dataUrl, 'personal').then((url) => {
              uploadedUrls.push(url);
              return url;
            }),
            visibility: body.personalPhoto.visibility === 'public' ? 'public' : 'private',
          }
        : null;

      const familyPhotos = await resolveFamilyPhotos(
        [],
        body.familyPhotos || [],
        (url) => uploadedUrls.push(url)
      );

      const entry = {
        id: randomUUID(),
        name: body.name.trim(),
        occupation: body.occupation || '',
        birthday: body.birthday || '',
        currentCity: body.currentCity || '',
        maritalStatus: body.maritalStatus || '',
        spouseName: body.spouseName || '',
        socialLinks: {
          instagram: body.socialLinks?.instagram || '',
          linkedin: body.socialLinks?.linkedin || '',
          facebook: body.socialLinks?.facebook || '',
          other: body.socialLinks?.other || '',
        },
        collegeBranch: body.collegeBranch || '',
        collegeMemory: body.collegeMemory || '',
        oldCollegePhoto,
        personalPhoto,
        familyPhotos,
        createdAt: now,
        updatedAt: now,
      };

      await db.create(entry);
      noStore(res);
      return res.status(201).json(entry);
    } catch (err) {
      await deletePhotos(uploadedUrls);
      console.error('Failed to create entry', err);
      return res.status(500).json({ error: 'Failed to create entry' });
    }
  }

  res.setHeader('Allow', 'GET, POST');
  return res.status(405).json({ error: 'Method not allowed' });
}
