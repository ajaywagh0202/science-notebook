import { useState } from 'react';
import SealStamp from './SealStamp.jsx';

function LockIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true">
      <path d="M12 2a4 4 0 0 0-4 4v3H7a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V10a1 1 0 0 0-1-1h-1V6a4 4 0 0 0-4-4zm-2 7V6a2 2 0 1 1 4 0v3h-4z" />
    </svg>
  );
}

// Public photos render immediately. Private photos show a blurred preview
// with a "Tap to reveal" button; revealing only flips local component state
// for this viewing session — the stored visibility flag never changes.
export default function PhotoReveal({ url, visibility, alt, circle = false }) {
  const [revealed, setRevealed] = useState(false);

  if (!url) return null;

  const isPublic = visibility === 'public';
  const showImage = isPublic || revealed;

  return (
    <div className={`photo-reveal${circle ? ' circle' : ''}`}>
      <img src={url} alt={alt} className={showImage ? '' : 'blurred'} />
      {!isPublic && !revealed && (
        <button type="button" className="reveal-btn" onClick={() => setRevealed(true)}>
          <LockIcon />
          <span>Tap to reveal</span>
        </button>
      )}
      {!isPublic && revealed && (
        <span className="reveal-stamp">
          <SealStamp size={34} topText="REVEALED" bottomText="2015" />
        </span>
      )}
    </div>
  );
}
