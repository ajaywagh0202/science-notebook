import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { fetchPerson, deletePerson } from '../api.js';
import PhotoReveal from '../components/PhotoReveal.jsx';
import { formatBirthday } from '../utils/date.js';

function Silhouette() {
  return (
    <svg viewBox="0 0 24 24" width="54" height="54" fill="currentColor" aria-hidden="true">
      <circle cx="12" cy="8" r="4.2" />
      <path d="M4 20c0-4.4 3.6-7 8-7s8 2.6 8 7v1H4v-1z" />
    </svg>
  );
}

const SOCIAL_LABELS = { instagram: 'Instagram', linkedin: 'LinkedIn', facebook: 'Facebook', other: 'Link' };

export default function ProfileDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [person, setPerson] = useState(null);
  const [status, setStatus] = useState('loading');
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteError, setDeleteError] = useState('');

  useEffect(() => {
    fetchPerson(id)
      .then((data) => {
        setPerson(data);
        setStatus('ready');
      })
      .catch(() => setStatus('error'));
  }, [id]);

  async function handleDelete() {
    if (!deletePassword) {
      setDeleteError('Enter the profile password.');
      return;
    }
    setDeleting(true);
    setDeleteError('');
    try {
      await deletePerson(id, deletePassword);
      navigate('/roster');
    } catch (err) {
      setDeleteError(err.message || 'Could not delete this entry.');
      setDeleting(false);
    }
  }

  if (status === 'loading') return <div className="page center-note">Turning the pages...</div>;
  if (status === 'error' || !person) {
    return (
      <div className="page center-note">
        Couldn't find that entry. <Link to="/roster">Back to the roster</Link>
      </div>
    );
  }

  const social = Object.entries(person.socialLinks || {}).filter(([, value]) => value);

  return (
    <div className="page">
      <p>
        <Link to="/roster">&larr; Back to the roster</Link>
      </p>

      <div className="profile-header">
        {person.personalPhoto?.url ? (
          <PhotoReveal
            url={person.personalPhoto.url}
            visibility={person.personalPhoto.visibility}
            alt={person.name}
            circle
          />
        ) : (
          <div className="avatar-silhouette" style={{ width: 130, height: 130 }}>
            <Silhouette />
          </div>
        )}
        <div className="profile-meta">
          <h2>{person.name}</h2>
          {person.occupation && <div className="card-line">{person.occupation}</div>}
          {person.currentCity && <div className="card-line">{person.currentCity}</div>}
        </div>
      </div>

      <div className="info-grid">
        {person.birthday && (
          <div className="info-card">
            <div className="label">Birthday</div>
            <div>{formatBirthday(person.birthday)}</div>
          </div>
        )}
        {person.maritalStatus && (
          <div className="info-card">
            <div className="label">Marital Status</div>
            <div>{person.maritalStatus}{person.spouseName ? ` — ${person.spouseName}` : ''}</div>
          </div>
        )}
        {person.collegeBranch && (
          <div className="info-card">
            <div className="label">College Branch</div>
            <div>{person.collegeBranch}</div>
          </div>
        )}
        {social.length > 0 && (
          <div className="info-card">
            <div className="label">Find them online</div>
            <div className="social-icons" style={{ justifyContent: 'flex-start' }}>
              {social.map(([key, value]) => (
                <a key={key} href={value} target="_blank" rel="noreferrer" title={SOCIAL_LABELS[key] || key}>
                  {(SOCIAL_LABELS[key] || key)[0]}
                </a>
              ))}
            </div>
          </div>
        )}
      </div>

      {person.collegeMemory && (
        <>
          <h3 className="section-title">A College Memory</h3>
          <div className="memory-block">"{person.collegeMemory}"</div>
        </>
      )}

      {person.oldCollegePhoto && (
        <>
          <h3 className="section-title">Back in the Day</h3>
          <div className="gallery">
            <figure>
              <img
                src={person.oldCollegePhoto}
                alt={`${person.name} in college`}
                style={{ width: '100%', borderRadius: 8, border: '2px solid var(--maroon)' }}
              />
            </figure>
          </div>
        </>
      )}

      {person.familyPhotos && person.familyPhotos.length > 0 && (
        <>
          <h3 className="section-title">Family Album</h3>
          <div className="gallery">
            {person.familyPhotos.map((photo, i) => (
              <figure key={photo.url + i}>
                <PhotoReveal url={photo.url} visibility={photo.visibility} alt={photo.caption || person.name} />
                {photo.caption && <figcaption>{photo.caption}</figcaption>}
              </figure>
            ))}
          </div>
        </>
      )}

      <div className="profile-actions">
        <Link to={`/edit/${person.id}`} className="btn btn-outline">
          {person.passwordProtected ? 'Edit My Entry' : 'Protect Legacy Profile'}
        </Link>
        {person.passwordProtected && (
          <button
            type="button"
            className="btn btn-danger"
            onClick={() => {
              setDeletePassword('');
              setDeleteError('');
              setConfirmingDelete(true);
            }}
          >
            Delete Entry
          </button>
        )}
      </div>

      {confirmingDelete && (
        <div className="modal-backdrop" onClick={() => !deleting && setConfirmingDelete(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <h3>Remove {person.name} from the register?</h3>
            <p>This deletes their entry and all uploaded photos. This can't be undone.</p>
            <div className="field modal-field">
              <label htmlFor="profileDeletePassword">Profile Password</label>
              <input
                id="profileDeletePassword"
                type="password"
                maxLength="128"
                autoComplete="current-password"
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
                disabled={deleting}
                required
              />
            </div>
            {deleteError && <div className="error-text">{deleteError}</div>}
            <div className="form-actions">
              <button type="button" className="btn btn-outline" onClick={() => setConfirmingDelete(false)} disabled={deleting}>
                Cancel
              </button>
              <button type="button" className="btn btn-danger" onClick={handleDelete} disabled={deleting}>
                {deleting ? 'Deleting...' : 'Yes, delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
