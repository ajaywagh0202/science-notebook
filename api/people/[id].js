import * as db from '../../lib/db.js';
import {
  resolveOldCollegePhoto,
  resolveSinglePhoto,
  resolveFamilyPhotos,
  getPhotoUrls,
  deletePhotos,
} from '../../lib/blob.js';

function noStore(res) {
  res.setHeader('Cache-Control', 'no-store, max-age=0');
}

export default async function handler(req, res) {
  const { id } = req.query;

  if (req.method === 'GET') {
    try {
      noStore(res);
      const person = await db.getById(id);
      if (!person) return res.status(404).json({ error: 'Not found' });
      return res.status(200).json(person);
    } catch (err) {
      console.error('Failed to load entry', err);
      return res.status(500).json({
        error: 'Failed to load the entry. Check the Vercel Blob connection and token.',
      });
    }
  }

  if (req.method === 'PUT') {
    const uploadedUrls = [];
    try {
      const existing = await db.getById(id);
      if (!existing) return res.status(404).json({ error: 'Not found' });

      const body = req.body || {};
      if (!body.name || !body.name.trim()) {
        return res.status(400).json({ error: 'Name is required' });
      }

      const trackUpload = (url) => uploadedUrls.push(url);
      const oldCollegePhoto = await resolveOldCollegePhoto(
        existing.oldCollegePhoto,
        body.oldCollegePhoto,
        trackUpload
      );
      const personalPhoto = await resolveSinglePhoto(
        existing.personalPhoto,
        body.personalPhoto,
        'personal',
        trackUpload
      );
      const familyPhotos = await resolveFamilyPhotos(
        existing.familyPhotos,
        body.familyPhotos || [],
        trackUpload
      );

      const updated = await db.update(id, (prev) => ({
        ...prev,
        name: body.name.trim(),
        occupation: body.occupation ?? prev.occupation,
        birthday: body.birthday ?? prev.birthday,
        currentCity: body.currentCity ?? prev.currentCity,
        maritalStatus: body.maritalStatus ?? prev.maritalStatus,
        spouseName: body.spouseName ?? prev.spouseName,
        socialLinks: {
          instagram: body.socialLinks?.instagram ?? prev.socialLinks?.instagram ?? '',
          linkedin: body.socialLinks?.linkedin ?? prev.socialLinks?.linkedin ?? '',
          facebook: body.socialLinks?.facebook ?? prev.socialLinks?.facebook ?? '',
          other: body.socialLinks?.other ?? prev.socialLinks?.other ?? '',
        },
        collegeBranch: body.collegeBranch ?? prev.collegeBranch,
        collegeMemory: body.collegeMemory ?? prev.collegeMemory,
        oldCollegePhoto,
        personalPhoto,
        familyPhotos,
        updatedAt: new Date().toISOString(),
      }));

      const keptUrls = new Set(getPhotoUrls(updated));
      await deletePhotos(getPhotoUrls(existing).filter((url) => !keptUrls.has(url)));
      noStore(res);
      return res.status(200).json(updated);
    } catch (err) {
      await deletePhotos(uploadedUrls);
      console.error('Failed to update entry', err);
      return res.status(500).json({ error: 'Failed to update entry' });
    }
  }

  if (req.method === 'DELETE') {
    try {
      const existing = await db.getById(id);
      if (!existing) return res.status(404).json({ error: 'Not found' });

      await db.remove(id);
      await deletePhotos(getPhotoUrls(existing));
      noStore(res);
      return res.status(204).end();
    } catch (err) {
      console.error('Failed to delete entry', err);
      return res.status(500).json({ error: 'Failed to delete entry' });
    }
  }

  res.setHeader('Allow', 'GET, PUT, DELETE');
  return res.status(405).json({ error: 'Method not allowed' });
}
