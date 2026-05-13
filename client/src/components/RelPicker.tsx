import { useState, useRef } from 'react';
import { fetchList } from '../api';
import StatusBadge from './StatusBadge';

interface Props {
  apiPath: string;
  idField: string;
  nameField: string;
  secondaryField?: string;
  placeholder?: string;
  disabled?: boolean;
  error?: string;
  onSelect: (id: string) => void;
}

export default function RelPicker({
  apiPath,
  idField,
  nameField,
  secondaryField,
  placeholder = 'Search to add…',
  disabled = false,
  error,
  onSelect,
}: Props) {
  const [query, setQuery] = useState('');
  const [all, setAll] = useState<Record<string, unknown>[]>([]);
  const [fetching, setFetching] = useState(false);
  const [open, setOpen] = useState(false);
  const loaded = useRef(false);

  async function ensureLoaded() {
    if (loaded.current) return;
    loaded.current = true;
    setFetching(true);
    try {
      const data = await fetchList(apiPath);
      setAll(data);
    } finally {
      setFetching(false);
    }
  }

  const filtered = all.filter((item) => {
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    const name = String(item[nameField] ?? '').toLowerCase();
    const itemId = String(item[idField] ?? '').toLowerCase();
    const sec = secondaryField ? String(item[secondaryField] ?? '').toLowerCase() : '';
    return name.includes(q) || itemId.includes(q) || sec.includes(q);
  });

  function handleSelect(item: Record<string, unknown>) {
    const selectedId = String(item[idField] ?? '');
    setQuery('');
    setOpen(false);
    onSelect(selectedId);
  }

  return (
    <div className="rel-picker">
      <input
        className="search-input rel-picker-input"
        value={query}
        placeholder={placeholder}
        disabled={disabled}
        onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
        onFocus={() => { setOpen(true); void ensureLoaded(); }}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
      />
      {open && (
        <div className="rel-picker-dropdown">
          {fetching ? (
            <div className="rel-picker-hint">Loading…</div>
          ) : filtered.length === 0 ? (
            <div className="rel-picker-hint">No results</div>
          ) : (
            filtered.slice(0, 8).map((item) => {
              const itemId = String(item[idField] ?? '');
              const name = String(item[nameField] ?? itemId);
              const status = String(item['status'] ?? '');
              const sec = secondaryField ? String(item[secondaryField] ?? '') : '';
              return (
                <button
                  key={itemId}
                  className="rel-picker-option"
                  onMouseDown={() => handleSelect(item)}
                >
                  <div className="rel-picker-option-main">
                    <span className="rel-picker-option-name">{name}</span>
                    {status && <StatusBadge status={status} />}
                  </div>
                  <div className="rel-picker-option-id">{itemId}</div>
                  {sec && <div className="rel-picker-option-sec">{sec}</div>}
                </button>
              );
            })
          )}
        </div>
      )}
      {error && <span className="rel-picker-error">{error}</span>}
    </div>
  );
}
