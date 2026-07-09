import { Routes, Route } from 'react-router-dom';
import Cover from './pages/Cover.jsx';
import Roster from './pages/Roster.jsx';
import ProfileDetail from './pages/ProfileDetail.jsx';
import EditProfile from './pages/EditProfile.jsx';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Cover />} />
      <Route path="/roster" element={<Roster />} />
      <Route path="/person/:id" element={<ProfileDetail />} />
      <Route path="/edit/:id" element={<EditProfile />} />
      <Route path="/add" element={<EditProfile />} />
    </Routes>
  );
}
