import { useState, useEffect } from 'react';
import { fetchReport } from '../api';
import StatusBadge from '../components/StatusBadge';

const SIMPLE_REPORTS = [
  { key: 'deprecated',           label: 'Deprecated Assets' },
  { key: 'duplicates',           label: 'Duplicate Detection' },
  { key: 'reuse',                label: 'Reuse Report' },
  { key: 'promotion-candidates', label: 'Promotion Candidates' },
  { key: 'approval-status',      label: 'Approval Status' },
  { key: 'local-modifications',  label: 'All Local Modifications' },
] as const;

const PARAM_REPORTS = [
  { key: 'build-readiness', label: 'Build Readiness' },
  { key: 'dependency-map',  label: 'Dependency Map' },
] as const;

type SimpleKey = (typeof SIMPLE_REPORTS)[number]['key'];
type ParamKey  = (typeof PARAM_REPORTS)[number]['key'];
type ActiveTab = SimpleKey | ParamKey;

const STATUS_KEYS = new Set(['status', 'review_status']);

const ENTITY_TYPES_FOR_DEP_MAP = [
  'AtomicAsset', 'Compound', 'Composite', 'CastleService', 'CastleUnit',
];

function renderValue(key: string, val: unknown): React.ReactNode {
  if (STATUS_KEYS.has(key) && typeof val === 'string') return <StatusBadge status={val} />;
  if (val === null || val === undefined || val === '') return '—';
  if (typeof val === 'object') {
    return (
      <span style={{ fontFamily: 'monospace', fontSize: '0.73rem', color: '#8b949e' }}>
        {JSON.stringify(val)}
      </span>
    );
  }
  return String(val);
}

function ArrayReport({ data }: { data: Record<string, unknown>[] }) {
  if (data.length === 0) return <div className="empty-box">No results</div>;
  const keys = Object.keys(data[0]);
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>{keys.map((k) => <th key={k}>{k.replace(/_/g, ' ')}</th>)}</tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={i} style={{ cursor: 'default' }}>
              {keys.map((k) => <td key={k}>{renderValue(k, row[k])}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ObjectReport({ data }: { data: Record<string, unknown> }) {
  const entries = Object.entries(data);
  if (entries.length === 0) return <div className="empty-box">No results</div>;
  return (
    <div className="table-wrap">
      <table>
        <thead><tr><th>Key</th><th>Value</th></tr></thead>
        <tbody>
          {entries.map(([k, v]) => (
            <tr key={k} style={{ cursor: 'default' }}>
              <td><span className="cell-id">{k}</span></td>
              <td>{renderValue(k, v)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function renderReport(data: unknown): React.ReactNode {
  if (!data) return null;
  if (Array.isArray(data)) return <ArrayReport data={data as Record<string, unknown>[]} />;
  if (typeof data === 'object') return <ObjectReport data={data as Record<string, unknown>} />;
  return <pre style={{ color: '#e6edf3', fontSize: '0.83rem' }}>{String(data)}</pre>;
}

function BuildReadinessPanel() {
  const [castleId, setCastleId] = useState('');
  const [data, setData] = useState<unknown>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function run() {
    const id = castleId.trim();
    if (!id) { setError('Castle Record ID is required'); return; }
    setLoading(true); setError(null); setData(null);
    fetchReport(`build-readiness/${encodeURIComponent(id)}`)
      .then(setData)
      .catch((e: unknown) => setError((e as Error).message))
      .finally(() => setLoading(false));
  }

  return (
    <>
      <div style={{ display: 'flex', gap: '0.6rem', marginBottom: '1.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <input
          className="search-input"
          style={{ minWidth: 400 }}
          value={castleId}
          onChange={(e) => setCastleId(e.target.value)}
          placeholder="Castle Record ID — e.g. CSTL-STRUT-WAREHOUSE-INVENTORY-V001"
          onKeyDown={(e) => { if (e.key === 'Enter') run(); }}
        />
        <button className="btn btn-primary" onClick={run}>Run Report</button>
      </div>
      {error && <div className="error-box">{error}</div>}
      {loading && <div className="loading">Loading report…</div>}
      {!loading && !error && renderReport(data)}
    </>
  );
}

function DependencyMapPanel() {
  const [entityType, setEntityType] = useState(ENTITY_TYPES_FOR_DEP_MAP[0]);
  const [entityId, setEntityId] = useState('');
  const [data, setData] = useState<unknown>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function run() {
    const id = entityId.trim();
    if (!id) { setError('Entity ID is required'); return; }
    setLoading(true); setError(null); setData(null);
    fetchReport(`dependency-map/${encodeURIComponent(entityType)}/${encodeURIComponent(id)}`)
      .then(setData)
      .catch((e: unknown) => setError((e as Error).message))
      .finally(() => setLoading(false));
  }

  return (
    <>
      <div style={{ display: 'flex', gap: '0.6rem', marginBottom: '1.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <select
          className="filter-select"
          value={entityType}
          onChange={(e) => setEntityType(e.target.value)}
        >
          {ENTITY_TYPES_FOR_DEP_MAP.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
        <input
          className="search-input"
          style={{ minWidth: 360 }}
          value={entityId}
          onChange={(e) => setEntityId(e.target.value)}
          placeholder="Entity ID"
          onKeyDown={(e) => { if (e.key === 'Enter') run(); }}
        />
        <button className="btn btn-primary" onClick={run}>Run Report</button>
      </div>
      {error && <div className="error-box">{error}</div>}
      {loading && <div className="loading">Loading report…</div>}
      {!loading && !error && renderReport(data)}
    </>
  );
}

export default function ReportsPage() {
  const [active, setActive] = useState<ActiveTab>('deprecated');
  const [data, setData] = useState<unknown>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isParamReport = PARAM_REPORTS.some((r) => r.key === active);

  useEffect(() => {
    if (isParamReport) { setData(null); setError(null); return; }
    setLoading(true);
    setError(null);
    setData(null);
    fetchReport(active as SimpleKey)
      .then(setData)
      .catch((err: unknown) => setError((err as Error).message))
      .finally(() => setLoading(false));
  }, [active, isParamReport]);

  return (
    <div>
      <div className="page-header">
        <div className="page-title">Reports</div>
        <div className="page-subtitle">System-wide analysis and audit reports</div>
      </div>

      <div className="tabs">
        {SIMPLE_REPORTS.map((r) => (
          <div key={r.key} className={`tab${active === r.key ? ' active' : ''}`} onClick={() => setActive(r.key)}>
            {r.label}
          </div>
        ))}
        {PARAM_REPORTS.map((r) => (
          <div key={r.key} className={`tab${active === r.key ? ' active' : ''}`} onClick={() => setActive(r.key)}>
            {r.label}
          </div>
        ))}
      </div>

      {active === 'build-readiness' && <BuildReadinessPanel />}
      {active === 'dependency-map'  && <DependencyMapPanel />}

      {!isParamReport && (
        <>
          {error && <div className="error-box">{error}</div>}
          {loading && <div className="loading">Loading report…</div>}
          {!loading && !error && renderReport(data)}
        </>
      )}
    </div>
  );
}
