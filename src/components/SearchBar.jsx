export default function SearchBar({ value, onChange }) {
  return (
    <div className="search-bar">
      <input
        type="text"
        placeholder="Search by name, city, or occupation..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label="Search the roster"
      />
    </div>
  );
}
