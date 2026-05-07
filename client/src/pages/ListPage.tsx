import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import type { EntityConfig } from '../config';
import { fetchList } from '../api';
import StatusBadge from '../components/StatusBadge';

export default function ListPage({ config }: { config: EntityConfig }) {
  const navigate = useNavigate();
  const [items, setItems] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<Record<string, string>>({});

  useEffect(() => {
    setLoading(true);
    setError(null);
    setSearch('');
    setFilters({});
  }, [config.key]);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetchList(config.apiPath, filters)
      .then((data) => setItems(data))
      .catch((err: unknown) => setError((err as Error).message))
      .finally(() => setLoading(false));
  }, [config.apiPath, JSON.stringify(filters)]);

  const displayed = items.filter((item) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    const name = String(item[config.nameField] ?? '').toLowerCase();
    const id = String(item[config.idField] ?? '').toLowerCase();
    const secondary = config.secondaryField
      ? String(item[config.secondaryField] ?? '').toLowerCase()
      : '';
    return name.includes(q) || id.includes(q) || secondary.includes(q);
  });

  return (
    <div>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div>
            <div className="page-title">{config.label}</div>
            <div className="page-subtitle">
              {loading ? 'Loading…' : `${displayed.length} ${displayed.length === 1 ? config.singular : config.label}`}
            </div>
          </div>
          <Link to={`${config.path}/new`} className="btn btn-primary">
            + New {config.singular}
          </Link>
        </div>
      </div>

      <div className="controls">
        <input
          className="search-input"
          placeholder={`Search ${config.label.toLowerCase()}…`}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {config.filters?.map((f) => (
          <select
            key={f.key}
            className="filter-select"
            value={filters[f.key] ?? ''}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, [f.key]: e.target.value }))
            }
          >
            <option value="">All {f.label}</option>
            {f.options?.map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        ))}
      </div>

      {error && <div className="error-box">{error}</div>}

      {loading ? (
        <div className="loading">Loading {config.label.toLowerCase()}…</div>
      ) : displayed.length === 0 ? (
        <div className="empty-box">No {config.label.toLowerCase()} found</div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                {config.columns.map((col) => (
                  <th key={col.key}>{col.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {displayed.map((item) => {
                const rowId = String(item[config.idField] ?? '');
                return (
                  <tr
                    key={rowId}
                    onClick={() => navigate(`${config.path}/${encodeURIComponent(rowId)}`)}
                  >
                    {config.columns.map((col) => {
                      const val = item[col.key];
                      return (
                        <td key={col.key}>
                          {col.key === 'status' ? (
                            <StatusBadge status={String(val ?? '')} />
                          ) : col.key === config.idField ? (
                            <span className="cell-id">{String(val ?? '—')}</span>
                          ) : (
                            String(val ?? '—')
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
