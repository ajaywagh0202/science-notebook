import { Link } from 'react-router-dom';
import SealStamp from '../components/SealStamp.jsx';

export default function Cover() {
  return (
    <div className="cover">
      <SealStamp size={180} />
      <div className="cover-frame">
        <div className="cover-kicker">A Keepsake, Reopened</div>
        <h1 className="cover-title">Class Book</h1>
        <p className="cover-sub">
          Where the batch of 2015 signs back in — new cities, new faces, same old memories.
        </p>
        <Link to="/roster" className="btn btn-gold">
          Enter the Directory
        </Link>
      </div>
    </div>
  );
}
