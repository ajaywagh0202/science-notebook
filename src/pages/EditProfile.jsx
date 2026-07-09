import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { createPerson, updatePerson, deletePerson, fetchPerson, fileToDataUrl } from '../api.js';

const emptyForm = {
  name: '',
  occupation: '',
  birthday: '',
  currentCity: '',
  maritalStatus: '',
  spouseName: '',
  socialLinks: { instagram: '', linkedin: '', facebook: '', other: '' },
  collegeBranch: '',
  collegeMemory: '',
};

let familyKeySeq = 0;

export default function EditProfile() {
  const { id } = useParams();
  const isEditing = Boolean(id);
  const navigate = useNavigate();

  const [form, setForm] = useState(emptyForm);
  const [oldCollegePhoto, setOldCollegePhoto] = useState({ url: null, newFile: null, preview: null });
  const [personalPhoto, setPersonalPhoto] = useState({ url: null, visibility: 'private', newFile: null, preview: null });
  const [familyPhotos, setFamilyPhotos] = useState([]);
  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  useEffect(() => {
    if (!isEditing) return;
    fetchPerson(id)
      .then((person) => {
        setForm({
          name: person.name || '',
          occupation: person.occupation || '',
          birthday: person.birthday || '',
          currentCity: person.currentCity || '',
          maritalStatus: person.maritalStatus || '',
          spouseName: person.spouseName || '',
          socialLinks: {
            instagram: person.socialLinks?.instagram || '',
            linkedin: person.socialLinks?.linkedin || '',
            facebook: person.socialLinks?.facebook || '',
            other: person.socialLinks?.other || '',
          },
          collegeBranch: person.collegeBranch || '',
          collegeMemory: person.collegeMemory || '',
        });
        setOldCollegePhoto({ url: person.oldCollegePhoto || null, newFile: null, preview: null });
        setPersonalPhoto({
          url: person.personalPhoto?.url || null,
          visibility: person.personalPhoto?.visibility || 'private',
          newFile: null,
          preview: null,
        });
        setFamilyPhotos(
          (person.familyPhotos || []).map((p) => ({
            key: `existing-${familyKeySeq++}`,
            url: p.url,
            caption: p.caption || '',
            visibility: p.visibility || 'private',
            newFile: null,
            preview: null,
          }))
        );
        setLoading(false);
      })
      .catch(() => {
        setError('Could not load this entry.');
        setLoading(false);
      });
  }, [id, isEditing]);

  function updateField(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function updateSocial(key, value) {
    setForm((f) => ({ ...f, socialLinks: { ...f.socialLinks, [key]: value } }));
  }

  function addFamilyRow() {
    setFamilyPhotos((rows) => [
      ...rows,
      { key: `new-${familyKeySeq++}`, url: null, caption: '', visibility: 'private', newFile: null, preview: null },
    ]);
  }

  function updateFamilyRow(key, patch) {
    setFamilyPhotos((rows) => rows.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  }

  function removeFamilyRow(key) {
    setFamilyPhotos((rows) => rows.filter((r) => r.key !== key));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.name.trim()) {
      setError('Name is required.');
      return;
    }
    setSaving(true);
    setError('');

    try {
      let oldCollegePhotoPayload;
      if (oldCollegePhoto.newFile) {
        oldCollegePhotoPayload = { dataUrl: await fileToDataUrl(oldCollegePhoto.newFile) };
      } else if (oldCollegePhoto.url) {
        oldCollegePhotoPayload = oldCollegePhoto.url;
      } else {
        oldCollegePhotoPayload = null;
      }

      let personalPhotoPayload;
      if (personalPhoto.newFile) {
        personalPhotoPayload = { dataUrl: await fileToDataUrl(personalPhoto.newFile), visibility: personalPhoto.visibility };
      } else if (personalPhoto.url) {
        personalPhotoPayload = { url: personalPhoto.url, visibility: personalPhoto.visibility };
      } else {
        personalPhotoPayload = null;
      }

      const familyPhotosPayload = await Promise.all(
        familyPhotos.map(async (row) => {
          if (row.newFile) {
            return { dataUrl: await fileToDataUrl(row.newFile), caption: row.caption, visibility: row.visibility };
          }
          return { url: row.url, caption: row.caption, visibility: row.visibility };
        })
      );

      const payload = {
        ...form,
        oldCollegePhoto: oldCollegePhotoPayload,
        personalPhoto: personalPhotoPayload,
        familyPhotos: familyPhotosPayload,
      };

      const saved = isEditing ? await updatePerson(id, payload) : await createPerson(payload);
      navigate(`/person/${saved.id}`);
    } catch (err) {
      setError(err.message || 'Something went wrong while saving.');
      setSaving(false);
    }
  }

  async function handleDelete() {
    setSaving(true);
    try {
      await deletePerson(id);
      navigate('/roster');
    } catch (err) {
      setError(err.message || 'Could not delete this entry.');
      setSaving(false);
      setConfirmingDelete(false);
    }
  }

  if (loading) return <div className="page center-note">Loading entry...</div>;

  return (
    <div className="page">
      <h1>{isEditing ? 'Edit My Entry' : 'Add Myself'}</h1>
      <div className="sub" style={{ marginBottom: 18 }}>
        This directory has no login — anyone with the link can add or edit any entry. Please only edit your own.
      </div>

      <form className="form-card" onSubmit={handleSubmit}>
        <div className="form-grid">
          <div className="field full">
            <label htmlFor="name">Name *</label>
            <input id="name" type="text" value={form.name} onChange={(e) => updateField('name', e.target.value)} required />
          </div>
          <div className="field">
            <label htmlFor="occupation">Occupation</label>
            <input id="occupation" type="text" value={form.occupation} onChange={(e) => updateField('occupation', e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="currentCity">Current City</label>
            <input id="currentCity" type="text" value={form.currentCity} onChange={(e) => updateField('currentCity', e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="birthday">Birthday</label>
            <input id="birthday" type="date" value={form.birthday} onChange={(e) => updateField('birthday', e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="maritalStatus">Marital Status</label>
            <select id="maritalStatus" value={form.maritalStatus} onChange={(e) => updateField('maritalStatus', e.target.value)}>
              <option value="">Prefer not to say</option>
              <option value="single">Single</option>
              <option value="married">Married</option>
            </select>
          </div>
          {form.maritalStatus === 'married' && (
            <div className="field">
              <label htmlFor="spouseName">Spouse Name</label>
              <input id="spouseName" type="text" value={form.spouseName} onChange={(e) => updateField('spouseName', e.target.value)} />
            </div>
          )}
          <div className="field">
            <label htmlFor="collegeBranch">College Branch</label>
            <input id="collegeBranch" type="text" value={form.collegeBranch} onChange={(e) => updateField('collegeBranch', e.target.value)} />
          </div>
          <div className="field full">
            <label htmlFor="collegeMemory">A College Memory</label>
            <textarea id="collegeMemory" value={form.collegeMemory} onChange={(e) => updateField('collegeMemory', e.target.value)} />
          </div>
        </div>

        <h3 className="section-title">Social Links</h3>
        <div className="form-grid">
          <div className="field">
            <label htmlFor="instagram">Instagram</label>
            <input id="instagram" type="url" value={form.socialLinks.instagram} onChange={(e) => updateSocial('instagram', e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="linkedin">LinkedIn</label>
            <input id="linkedin" type="url" value={form.socialLinks.linkedin} onChange={(e) => updateSocial('linkedin', e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="facebook">Facebook</label>
            <input id="facebook" type="url" value={form.socialLinks.facebook} onChange={(e) => updateSocial('facebook', e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="other">Other</label>
            <input id="other" type="url" value={form.socialLinks.other} onChange={(e) => updateSocial('other', e.target.value)} />
          </div>
        </div>

        <h3 className="section-title">Photos</h3>

        <div className="photo-field">
          {(oldCollegePhoto.preview || oldCollegePhoto.url) && (
            <img className="preview" src={oldCollegePhoto.preview || oldCollegePhoto.url} alt="Old college photo" />
          )}
          <div>
            <label>Old College Photo (always public)</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) setOldCollegePhoto((p) => ({ ...p, newFile: file, preview: URL.createObjectURL(file) }));
              }}
            />
          </div>
          {(oldCollegePhoto.url || oldCollegePhoto.preview) && (
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={() => setOldCollegePhoto({ url: null, newFile: null, preview: null })}
            >
              Remove
            </button>
          )}
        </div>

        <div className="photo-field">
          {(personalPhoto.preview || personalPhoto.url) && (
            <img className="preview" src={personalPhoto.preview || personalPhoto.url} alt="Personal photo" />
          )}
          <div>
            <label>Personal Photo</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) setPersonalPhoto((p) => ({ ...p, newFile: file, preview: URL.createObjectURL(file) }));
              }}
            />
          </div>
          <label className="visibility-toggle">
            <input
              type="checkbox"
              checked={personalPhoto.visibility === 'public'}
              onChange={(e) => setPersonalPhoto((p) => ({ ...p, visibility: e.target.checked ? 'public' : 'private' }))}
            />
            {personalPhoto.visibility === 'public' ? 'Visible to everyone' : 'Private (blurred by default)'}
          </label>
          {(personalPhoto.url || personalPhoto.preview) && (
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={() => setPersonalPhoto({ url: null, visibility: 'private', newFile: null, preview: null })}
            >
              Remove
            </button>
          )}
        </div>

        <label>Family Photos</label>
        {familyPhotos.map((row) => (
          <div className="family-photo-row" key={row.key}>
            {(row.preview || row.url) && <img className="preview" src={row.preview || row.url} alt={row.caption || 'Family photo'} />}
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) updateFamilyRow(row.key, { newFile: file, preview: URL.createObjectURL(file) });
              }}
            />
            <input
              type="text"
              placeholder="Caption (optional)"
              value={row.caption}
              onChange={(e) => updateFamilyRow(row.key, { caption: e.target.value })}
            />
            <label className="visibility-toggle">
              <input
                type="checkbox"
                checked={row.visibility === 'public'}
                onChange={(e) => updateFamilyRow(row.key, { visibility: e.target.checked ? 'public' : 'private' })}
              />
              {row.visibility === 'public' ? 'Visible to everyone' : 'Private (blurred by default)'}
            </label>
            <button type="button" className="btn btn-outline btn-sm" onClick={() => removeFamilyRow(row.key)}>
              Remove
            </button>
          </div>
        ))}
        <button type="button" className="btn btn-outline btn-sm" onClick={addFamilyRow} style={{ marginBottom: 20 }}>
          + Add Family Photo
        </button>

        {error && <div className="error-text">{error}</div>}

        <div className="form-actions">
          <div>
            {isEditing && (
              <button type="button" className="btn btn-danger" onClick={() => setConfirmingDelete(true)} disabled={saving}>
                Delete Entry
              </button>
            )}
          </div>
          <button type="submit" className="btn btn-gold" disabled={saving}>
            {saving ? 'Saving...' : 'Save Entry'}
          </button>
        </div>
      </form>

      {confirmingDelete && (
        <div className="modal-backdrop" onClick={() => !saving && setConfirmingDelete(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <h3>Delete this entry?</h3>
            <p>This removes it and all uploaded photos permanently.</p>
            <div className="form-actions">
              <button type="button" className="btn btn-outline" onClick={() => setConfirmingDelete(false)} disabled={saving}>
                Cancel
              </button>
              <button type="button" className="btn btn-danger" onClick={handleDelete} disabled={saving}>
                {saving ? 'Deleting...' : 'Yes, delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
