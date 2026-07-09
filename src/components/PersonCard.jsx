import { Link } from 'react-router-dom';
import { formatBirthday } from '../utils/date.js';

function Silhouette() {
  return (
    <svg viewBox="0 0 24 24" width="34" height="34" fill="currentColor" aria-hidden="true">
      <circle cx="12" cy="8" r="4.2" />
      <path d="M4 20c0-4.4 3.6-7 8-7s8 2.6 8 7v1H4v-1z" />
    </svg>
  );
}

const SOCIAL_LABELS = { instagram: 'IG', linkedin: 'in', facebook: 'f', other: '↗' };

export default function PersonCard({ person }) {
  const showPersonalPhoto = person.personalPhoto?.visibility === 'public' && person.personalPhoto?.url;
  const social = person.socialLinks || {};

  return (
    <Link to={`/person/${person.id}`} className="person-card">
      {showPersonalPhoto ? (
        <img className="avatar" src={person.personalPhoto.url} alt={person.name} />
      ) : (
        <div className="avatar-silhouette" aria-label="No public photo">
          <Silhouette />
        </div>
      )}
      <div className="card-name">{person.name}</div>
      {person.occupation && <div className="card-line">{person.occupation}</div>}
      {person.currentCity && <div className="card-line">{person.currentCity}</div>}

      <div className="card-badges">
        {person.birthday && <span className="badge">{formatBirthday(person.birthday)}</span>}
        {person.maritalStatus && <span className="badge">{person.maritalStatus}</span>}
      </div>

      {(social.instagram || social.linkedin || social.facebook || social.other) && (
        <div className="social-icons">
          {Object.entries(social)
            .filter(([, value]) => value)
            .map(([key]) => (
              <span key={key} title={key}>
                {SOCIAL_LABELS[key] || key[0].toUpperCase()}
              </span>
            ))}
        </div>
      )}
    </Link>
  );
}
