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

// ─── Value renderer ───────────────────────────────────────────────────────────

function renderValue(key: string, val: unknown): React.ReactNode {
  if (STATUS_KEYS.has(key) && typeof val === 'string') return <StatusBadge status={val} />;
  if (val === null || val === undefined || val === '') return <span style={{ color: 'var(--text-faint)' }}>—</span>;
  if (typeof val === 'boolean') return val ? 'Yes' : 'No';
  if (Array.isArray(val)) {
    if (val.length === 0) return <span style={{ color: 'var(--text-faint)' }}>—</span>;
    if (typeof val[0] === 'object' && val[0] !== null && 'name' in val[0]) {
      return (
        <span style={{ fontSize: '0.78rem', color: 'var(--text-sec)' }}>
          {(val as { name: string }[]).map((v) => v.name).join(', ')}
        </span>
      );
    }
    return <span style={{ fontFamily: 'monospace', fontSize: '0.73rem', color: 'var(--text-sec)' }}>{JSON.stringify(val)}</span>;
  }
  if (typeof val === 'object' && val !== null) {
    const obj = val as Record<string, unknown>;
    if ('name' in obj && 'id' in obj) {
      return (
        <span>
          {String(obj.name)}{' '}
          <span style={{ fontFamily: 'monospace', fontSize: '0.73rem', color: 'var(--text-faint)' }}>({String(obj.id)})</span>
        </span>
      );
    }
    return <span style={{ fontFamily: 'monospace', fontSize: '0.73rem', color: 'var(--text-sec)' }}>{JSON.stringify(val)}</span>;
  }
  return String(val);
}

// ─── ArrayReport — flat table with null-column pruning ────────────────────────

function ArrayReport({ data }: { data: Record<string, unknown>[] }) {
  if (data.length === 0) return <div className="empty-box">No results</div>;
  const allKeys = Object.keys(data[0]);
  // Drop columns where every row is null / undefined / ''
  const keys = allKeys.filter((k) =>
    data.some((row) => {
      const v = row[k];
      return v !== null && v !== undefined && v !== '';
    }),
  );
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

// ─── SectionedReport — object whose values are arrays ─────────────────────────

function SectionedReport({ data }: { data: Record<string, unknown> }) {
  const entries = Object.entries(data);
  const scalars = entries.filter(([, v]) => !Array.isArray(v));
  const sections = entries.filter(([, v]) => Array.isArray(v));
  const nonEmpty = sections.filter(([, v]) => (v as unknown[]).length > 0);
  const total = sections.reduce((s, [, v]) => s + (v as unknown[]).length, 0);

  return (
    <div>
      {/* Scalar summary chips */}
      {scalars.length > 0 && (
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
          {scalars.map(([k, v]) => (
            <span key={k} className="settings-count-chip" style={{ fontSize: '0.8rem' }}>
              <span style={{ color: 'var(--text-muted)', textTransform: 'capitalize' }}>
                {k.replace(/_/g, ' ')}:
              </span>{' '}
              <strong style={{ color: 'var(--text)' }}>{String(v)}</strong>
            </span>
          ))}
        </div>
      )}

      {/* Section count bar */}
      <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
        {sections.map(([k, v]) => (
          <span
            key={k}
            className="settings-count-chip"
            style={{ opacity: (v as unknown[]).length === 0 ? 0.45 : 1 }}
          >
            {(v as unknown[]).length} {k.replace(/_/g, ' ')}
          </span>
        ))}
      </div>

      {total === 0 ? (
        <div className="empty-box">No results</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {nonEmpty.map(([k, v]) => (
            <div key={k} className="panel" style={{ marginBottom: 0 }}>
              <div className="panel-header">
                {k.replace(/_/g, ' ')}
                <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>
                  {(v as unknown[]).length}
                </span>
              </div>
              <div style={{ padding: 0 }}>
                <ArrayReport data={v as Record<string, unknown>[]} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── DuplicatesReport — [{normalized_name, entries:[]}] ───────────────────────

type DuplicateGroup = { normalized_name: string; entries: Record<string, unknown>[] };

function DuplicatesReport({ data }: { data: DuplicateGroup[] }) {
  if (data.length === 0) return <div className="empty-box">No duplicates detected</div>;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      <div style={{ marginBottom: '0.25rem', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
        {data.length} duplicate group{data.length !== 1 ? 's' : ''} found
      </div>
      {data.map((group) => (
        <div key={group.normalized_name} className="panel" style={{ marginBottom: 0 }}>
          <div className="panel-header">
            <span style={{ fontFamily: 'monospace' }}>{group.normalized_name}</span>
            <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>
              {group.entries.length} matches
            </span>
          </div>
          <div style={{ padding: 0 }}>
            <ArrayReport data={group.entries} />
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── ObjectReport — plain key-value table ─────────────────────────────────────

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

// ─── Smart dispatcher ─────────────────────────────────────────────────────────

function renderReport(data: unknown): React.ReactNode {
  if (!data) return null;

  // Duplicates: [{normalized_name, entries}]
  if (
    Array.isArray(data) &&
    data.length > 0 &&
    typeof data[0] === 'object' &&
    data[0] !== null &&
    'entries' in (data[0] as object)
  ) {
    return <DuplicatesReport data={data as DuplicateGroup[]} />;
  }

  if (Array.isArray(data)) return <ArrayReport data={data as Record<string, unknown>[]} />;

  if (typeof data === 'object' && data !== null) {
    const obj = data as Record<string, unknown>;
    // If any value is an array → use sectioned view
    if (Object.values(obj).some((v) => Array.isArray(v))) {
      return <SectionedReport data={obj} />;
    }
    return <ObjectReport data={obj} />;
  }

  return <pre style={{ color: 'var(--text)', fontSize: '0.83rem' }}>{String(data)}</pre>;
}

// ─── Parameterised report panels ──────────────────────────────────────────────

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

// ─── Page ─────────────────────────────────────────────────────────────────────

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
