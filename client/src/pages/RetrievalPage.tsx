import { useState } from 'react';
import { fetchRetrieval, fetchRetrievalForCastle } from '../api';
import StatusBadge from '../components/StatusBadge';

type Mode = 'context' | 'castle';

interface ContextItem {
  id: string;
  name: string;
  status: string;
  [key: string]: unknown;
}

interface RelevantContext {
  castle_units?: ContextItem[];
  castle_services?: ContextItem[];
  composites?: ContextItem[];
  compounds?: ContextItem[];
  atomic_assets?: ContextItem[];
}

const SECTION_LABELS: Record<string, string> = {
  castle_units: 'Castle Units',
  castle_services: 'Castle Services',
  composites: 'Composites',
  compounds: 'Compounds',
  atomic_assets: 'Atomic Assets',
};

function ContextSection({ title, items }: { title: string; items: ContextItem[] }) {
  if (items.length === 0) return null;
  const keys = Object.keys(items[0]);
  return (
    <div className="panel" style={{ marginBottom: '1rem' }}>
      <div className="panel-header">
        {title}
        <span style={{ fontWeight: 400, color: '#484f58' }}>{items.length}</span>
      </div>
      <div className="table-wrap" style={{ border: 'none', borderRadius: 0 }}>
        <table>
          <thead>
            <tr>
              {keys.map((k) => <th key={k}>{k.replace(/_/g, ' ')}</th>)}
            </tr>
          </thead>
          <tbody>
            {items.map((row, i) => (
              <tr key={i} style={{ cursor: 'default' }}>
                {keys.map((k) => (
                  <td key={k}>
                    {k === 'status' && typeof row[k] === 'string'
                      ? <StatusBadge status={row[k] as string} />
                      : String(row[k] ?? '—')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function RetrievalPage() {
  const [mode, setMode] = useState<Mode>('context');
  const [ctxTypeId, setCtxTypeId] = useState('');
  const [ctxBlueprintId, setCtxBlueprintId] = useState('');
  const [castleId, setCastleId] = useState('');
  const [result, setResult] = useState<RelevantContext | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function fetchContext() {
    if (!ctxTypeId.trim() || !ctxBlueprintId.trim()) {
      setError('Both Castle Type ID and Blueprint ID are required');
      return;
    }
    setLoading(true);
    setError(null);
    setResult(null);
    fetchRetrieval({ castle_type_id: ctxTypeId.trim(), blueprint_id: ctxBlueprintId.trim() })
      .then((r) => setResult(r as RelevantContext))
      .catch((err: unknown) => setError((err as Error).message))
      .finally(() => setLoading(false));
  }

  function fetchCastle() {
    if (!castleId.trim()) {
      setError('Castle Record ID is required');
      return;
    }
    setLoading(true);
    setError(null);
    setResult(null);
    fetchRetrievalForCastle(castleId.trim())
      .then((r) => setResult(r as RelevantContext))
      .catch((err: unknown) => setError((err as Error).message))
      .finally(() => setLoading(false));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (mode === 'context') fetchContext();
    else fetchCastle();
  }

  const totalItems = result
    ? Object.values(result).reduce((n, arr) => n + (Array.isArray(arr) ? arr.length : 0), 0)
    : 0;

  return (
    <div>
      <div className="page-header">
        <div className="page-title">AI Retrieval Context</div>
        <div className="page-subtitle">Fetch relevant assets for AI-assisted Castle construction</div>
      </div>

      <div className="tabs">
        <div
          className={`tab${mode === 'context' ? ' active' : ''}`}
          onClick={() => { setMode('context'); setResult(null); setError(null); }}
        >
          By Type + Blueprint
        </div>
        <div
          className={`tab${mode === 'castle' ? ' active' : ''}`}
          onClick={() => { setMode('castle'); setResult(null); setError(null); }}
        >
          By Castle
        </div>
      </div>

      <form onSubmit={handleSubmit} style={{ marginBottom: '1.5rem' }}>
        {mode === 'context' ? (
          <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <input
              className="search-input"
              style={{ minWidth: 280 }}
              value={ctxTypeId}
              onChange={(e) => setCtxTypeId(e.target.value)}
              placeholder="Castle Type ID"
            />
            <input
              className="search-input"
              style={{ minWidth: 280 }}
              value={ctxBlueprintId}
              onChange={(e) => setCtxBlueprintId(e.target.value)}
              placeholder="Blueprint ID"
            />
            <button className="btn btn-primary" type="submit">Fetch Context</button>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <input
              className="search-input"
              style={{ minWidth: 400 }}
              value={castleId}
              onChange={(e) => setCastleId(e.target.value)}
              placeholder="Castle Record ID — e.g. CSTL-STRUT-WAREHOUSE-INVENTORY-V001"
            />
            <button className="btn btn-primary" type="submit">Fetch Context</button>
          </div>
        )}
      </form>

      {error && <div className="error-box">{error}</div>}
      {loading && <div className="loading">Fetching context…</div>}

      {result && !loading && (
        <>
          <div style={{ marginBottom: '1rem', fontSize: '0.82rem', color: '#6e7681' }}>
            {totalItems} relevant assets found
          </div>
          {Object.entries(SECTION_LABELS).map(([key, label]) => {
            const items = (result[key as keyof RelevantContext] ?? []) as ContextItem[];
            return <ContextSection key={key} title={label} items={items} />;
          })}
          {totalItems === 0 && (
            <div className="empty-box">No relevant assets found for these parameters</div>
          )}
        </>
      )}
    </div>
  );
}
