import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { fetchBOMImpact } from '../api';
import StatusBadge from '../components/StatusBadge';

// ── Config ─────────────────────────────────────────────────────────────────────

const ENTITY_TYPES = ['AtomicAsset', 'Compound', 'Composite', 'CastleService', 'CastleUnit'] as const;
type EntityTypeName = typeof ENTITY_TYPES[number];

interface EntitySource {
  apiPath: string;
  idField: string;
  nameField: string;
  secondary: string | null;
}

const ENTITY_SOURCE: Record<EntityTypeName, EntitySource> = {
  AtomicAsset:   { apiPath: 'atomic-assets',  idField: 'atomic_asset_id',    nameField: 'name', secondary: 'asset_type' },
  Compound:      { apiPath: 'compounds',       idField: 'compound_id',        nameField: 'name', secondary: null },
  Composite:     { apiPath: 'composites',      idField: 'composite_id',       nameField: 'name', secondary: 'ui_backend_scope' },
  CastleService: { apiPath: 'castle-services', idField: 'castle_service_id',  nameField: 'name', secondary: 'capability' },
  CastleUnit:    { apiPath: 'castle-units',    idField: 'castle_unit_id',     nameField: 'name', secondary: null },
};

const ROUTE_FOR_TYPE: Record<string, string> = {
  AtomicAsset:   'atomic-assets',
  Compound:      'compounds',
  Composite:     'composites',
  CastleService: 'castle-services',
  CastleUnit:    'castle-units',
  Castle:        'castles',
};

// Sections shown in result — ordered bottom-up from the entity being traced
const IMPACT_SECTIONS: { key: string; label: string; type: string }[] = [
  { key: 'compounds',      label: 'Compounds',      type: 'Compound' },
  { key: 'composites',     label: 'Composites',     type: 'Composite' },
  { key: 'castle_services',label: 'Castle Services',type: 'CastleService' },
  { key: 'castle_units',   label: 'Castle Units',   type: 'CastleUnit' },
  { key: 'castles',        label: 'Castles',        type: 'Castle' },
];

// ── Types ──────────────────────────────────────────────────────────────────────

interface BomNode {
  id: string;
  name: string;
  status: string;
  version: string | null;
  warning: string | null;
}

interface ImpactResult {
  entity_id: string;
  entity_type: string;
  compounds: BomNode[] | null;
  composites: BomNode[] | null;
  castle_services: BomNode[] | null;
  castle_units: BomNode[] | null;
  castles: BomNode[] | null;
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function ImpactSection({ label, nodes, type, isCastle }: {
  label: string;
  nodes: BomNode[] | null;
  type: string;
  isCastle: boolean;
}) {
  if (!nodes || nodes.length === 0) return null;
  const route = ROUTE_FOR_TYPE[type];

  return (
    <div style={{ marginBottom: '0.75rem' }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: '0.5rem',
        padding: '0.45rem 1rem',
        background: isCastle ? '#1a2f4e44' : '#161b22',
        borderLeft: isCastle ? '3px solid #4a9eff' : '3px solid #30363d',
        borderBottom: '1px solid #21262d',
      }}>
        <span style={{
          fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase',
          letterSpacing: '0.07em', color: isCastle ? '#4a9eff' : '#8b949e',
        }}>
          {label}
        </span>
        <span style={{
          fontSize: '0.65rem', background: isCastle ? '#1a2f4e' : '#21262d',
          color: isCastle ? '#79c0ff' : '#6e7681', borderRadius: 8,
          padding: '1px 7px', fontWeight: 600,
        }}>
          {nodes.length}
        </span>
      </div>
      {nodes.map(n => (
        <div
          key={n.id}
          style={{
            display: 'flex', alignItems: 'center', gap: '0.75rem',
            padding: '0.5rem 1rem 0.5rem 1.5rem',
            borderBottom: '1px solid #21262d',
            background: isCastle ? '#0d1f33' : 'transparent',
          }}
        >
          <div style={{ flex: 1, minWidth: 0 }}>
            {route ? (
              <a
                href={`/${route}/${n.id}`}
                style={{ fontWeight: 500, fontSize: '0.85rem', color: '#58a6ff', textDecoration: 'none' }}
              >
                {n.name}
              </a>
            ) : (
              <span style={{ fontWeight: 500, fontSize: '0.85rem' }}>{n.name}</span>
            )}
            <div style={{ fontFamily: 'monospace', fontSize: '0.7rem', color: '#484f58', marginTop: 1 }}>{n.id}</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
            {n.version && (
              <span style={{ fontSize: '0.7rem', color: '#6e7681' }}>v{n.version}</span>
            )}
            <StatusBadge status={n.status} />
            {n.warning && (
              <span style={{ fontSize: '0.72rem', color: '#d29922' }}>⚠ {n.warning}</span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function BOMImpactPage() {
  const { entityType: urlType, entityId: urlId } = useParams<{ entityType?: string; entityId?: string }>();
  const navigate = useNavigate();

  const [entityType, setEntityType] = useState<EntityTypeName>(
    (urlType as EntityTypeName) ?? 'AtomicAsset',
  );
  const [entityId, setEntityId] = useState(urlId ?? '');
  const [entities, setEntities] = useState<Record<string, string>[]>([]);
  const [loadingEntities, setLoadingEntities] = useState(false);
  const [result, setResult] = useState<ImpactResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Populate entity dropdown when type changes
  useEffect(() => {
    const src = ENTITY_SOURCE[entityType];
    setEntities([]);
    setEntityId('');
    setResult(null);
    setLoadingEntities(true);
    fetch(`/api/${src.apiPath}`)
      .then(r => r.json())
      .then((rows: unknown) => setEntities(rows as Record<string, string>[]))
      .catch(() => setEntities([]))
      .finally(() => setLoadingEntities(false));
  }, [entityType]);

  // If navigated directly with URL params, run trace
  useEffect(() => {
    if (urlType && urlId) {
      setEntityType(urlType as EntityTypeName);
      setEntityId(urlId);
      setLoading(true);
      setError(null);
      setResult(null);
      fetchBOMImpact(urlType, urlId)
        .then(d => setResult(d as ImpactResult))
        .catch((err: unknown) => setError((err as Error).message))
        .finally(() => setLoading(false));
    }
  }, [urlType, urlId]);

  function handleTrace() {
    if (!entityId.trim()) return;
    navigate(`/bom-impact/${encodeURIComponent(entityType)}/${encodeURIComponent(entityId)}`);
    setLoading(true);
    setError(null);
    setResult(null);
    fetchBOMImpact(entityType, entityId)
      .then(d => setResult(d as ImpactResult))
      .catch((err: unknown) => setError((err as Error).message))
      .finally(() => setLoading(false));
  }

  const src = ENTITY_SOURCE[entityType];

  // Total affected entities across all levels
  const totalAffected = result
    ? (result.compounds?.length ?? 0) +
      (result.composites?.length ?? 0) +
      (result.castle_services?.length ?? 0) +
      (result.castle_units?.length ?? 0) +
      (result.castles?.length ?? 0)
    : 0;

  const selectedEntity = entityId
    ? entities.find(e => e[src.idField] === entityId)
    : null;

  return (
    <div>
      <div className="page-header">
        <div className="page-title">BOM Impact Tracing</div>
        <div className="page-subtitle">
          Select an asset to trace every Castle it affects — bottom-up through the full hierarchy
        </div>
      </div>

      {/* Selector row */}
      <div className="controls" style={{ marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        {/* Entity type */}
        <select
          className="filter-select"
          value={entityType}
          onChange={e => setEntityType(e.target.value as EntityTypeName)}
        >
          {ENTITY_TYPES.map(t => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>

        {/* Entity picker */}
        <select
          className="filter-select"
          style={{ minWidth: 380, flex: 1, maxWidth: 560 }}
          value={entityId}
          onChange={e => setEntityId(e.target.value)}
          disabled={loadingEntities || entities.length === 0}
        >
          <option value="">
            {loadingEntities ? 'Loading…' : entities.length === 0 ? 'No entities found' : `— select a ${entityType} —`}
          </option>
          {entities.map(e => {
            const id = e[src.idField] as string;
            const name = e[src.nameField] as string;
            const sec = src.secondary ? (e[src.secondary] as string) : null;
            return (
              <option key={id} value={id}>
                {name}{sec ? ` · ${sec}` : ''}
              </option>
            );
          })}
        </select>

        <button
          className="btn btn-primary"
          onClick={handleTrace}
          disabled={!entityId.trim() || loading}
        >
          Trace Impact
        </button>
      </div>

      {error && <div className="error-box">{error}</div>}
      {loading && <div className="loading">Tracing impact…</div>}

      {result && !loading && (
        <>
          {/* Entity being traced */}
          <div className="panel" style={{ marginBottom: '1rem' }}>
            <div className="panel-header">Tracing</div>
            <div style={{ padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: '0.95rem', marginBottom: 2 }}>
                  {selectedEntity?.[src.nameField] ?? result.entity_id}
                </div>
                {selectedEntity && src.secondary && selectedEntity[src.secondary] && (
                  <div style={{ fontSize: '0.78rem', color: '#8b949e', marginBottom: 3 }}>
                    {selectedEntity[src.secondary] as string}
                  </div>
                )}
                <div style={{ fontFamily: 'monospace', fontSize: '0.72rem', color: '#484f58' }}>
                  {result.entity_id}
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
                <span style={{
                  fontSize: '0.72rem', fontWeight: 600, padding: '2px 10px',
                  background: '#1c2128', color: '#8b949e',
                  borderRadius: 4, border: '1px solid #30363d',
                }}>
                  {result.entity_type}
                </span>
                {totalAffected === 0 ? (
                  <span style={{ fontSize: '0.75rem', color: '#6e7681' }}>Not used anywhere</span>
                ) : (
                  <span style={{ fontSize: '0.75rem', color: '#3fb950' }}>
                    {totalAffected} entity{totalAffected !== 1 ? 'ies' : ''} affected ·{' '}
                    {result.castles?.length ?? 0} castle{(result.castles?.length ?? 0) !== 1 ? 's' : ''}
                  </span>
                )}
              </div>
            </div>
          </div>

          {totalAffected === 0 ? (
            <div className="panel">
              <div className="empty-box" style={{ padding: '1.5rem' }}>
                This {result.entity_type} is not used in any Compound, Composite, Castle Service, Castle Unit, or Castle.
              </div>
            </div>
          ) : (
            <div className="panel">
              <div className="panel-header">
                Impact Chain
                <span style={{ fontWeight: 400, fontSize: '0.72rem', color: '#6e7681' }}>
                  bottom-up · {totalAffected} total
                </span>
              </div>
              {IMPACT_SECTIONS.map(sec => (
                <ImpactSection
                  key={sec.key}
                  label={sec.label}
                  nodes={(result as unknown as Record<string, BomNode[] | null>)[sec.key]}
                  type={sec.type}
                  isCastle={sec.key === 'castles'}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
