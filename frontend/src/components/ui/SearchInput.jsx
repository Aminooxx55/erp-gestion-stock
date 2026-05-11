import { FiSearch } from 'react-icons/fi';

/**
 * Reusable search input with icon and consistent focus styling.
 */
export default function SearchInput({ value, onChange, placeholder = 'Rechercher...', className = '' }) {
  return (
    <div className={`search-input-wrap ${className}`}>
      <div className="search-input-icon">
        <FiSearch size={17} />
      </div>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="input-field w-full pl-11 pr-4 py-3 text-sm"
        style={{ background: 'var(--bg-surface)' }}
      />
    </div>
  );
}
