import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchPeople } from '../api.js';
import PersonCard from '../components/PersonCard.jsx';
import BirthdayBanner from '../components/BirthdayBanner.jsx';
import SearchBar from '../components/SearchBar.jsx';

export default function Roster() {
  const [people, setPeople] = useState([]);
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchPeople()
      .then((data) => {
        setPeople(data);
        setStatus('ready');
      })
      .catch((err) => {
        setError(err.message);
        setStatus('error');
      });
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return people;
    return people.filter((p) =>
      [p.name, p.currentCity, p.occupation].some((field) => field?.toLowerCase().includes(q))
    );
  }, [people, query]);

  return (
    <div className="page">
      <div className="topbar">
        <div>
          <h1>The Roster</h1>
          <div className="sub">{people.length} classmate{people.length === 1 ? '' : 's'} signed in so far</div>
        </div>
        <Link to="/add" className="btn btn-gold">
          + Add Myself
        </Link>
      </div>

      {status === 'ready' && <BirthdayBanner people={people} />}
      <SearchBar value={query} onChange={setQuery} />

      {status === 'loading' && <div className="center-note">Dusting off the register...</div>}
      {status === 'error' && (
        <div className="center-note">
          Couldn't load the roster. {error || 'Please refresh.'}
        </div>
      )}

      {status === 'ready' && filtered.length === 0 && (
        <div className="empty-state">
          {people.length === 0
            ? 'No one has signed in yet — be the first to add yourself!'
            : 'No classmates match your search.'}
        </div>
      )}

      {status === 'ready' && filtered.length > 0 && (
        <div className="roster-grid">
          {filtered.map((person) => (
            <PersonCard key={person.id} person={person} />
          ))}
        </div>
      )}
    </div>
  );
}
