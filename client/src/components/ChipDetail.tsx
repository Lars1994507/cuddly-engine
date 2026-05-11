import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import type { EntityConfig, Field } from '../config';
import { ENTITY_CONFIGS } from '../config';
import { fetchById, fetchRelationship } from '../api';
import StatusBadge from './StatusBadge';

function renderCompact(field: Field, entity: Record<string, unknown>): string | null {
  const raw = entity[field.key];
  if (raw === undefined || raw === null || raw === '') return null;
  if (field.type === 'date') return new Date(String(raw)).toLocaleDateString();
  if (field.type === 'json-array') {
    let arr: unknown[] = [];
    try { arr = typeof raw === 'string' ? (JSON.parse(raw) as unknown[]) : (raw as unknown[]); } catch { /* empty */ }
    return Array.isArray(arr) && arr.length > 0 ? arr.map(String).join(', ') : null;
  }
  return String(raw);
}

export default function ChipDetail({
  config,
  id,
  onClose,
}: {
  config: EntityConfig;
  id: string;
  onClose: () => void;
}) {
  const [entity, setEntity] = useState<Record<string, unknown> | null>(null);
  const [rels, setRels] = useState<Record<string, Record<string, unknown>[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedChipKey, setExpandedChipKey] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    setEntity(null);
    setRels({});
    let cancelled = false;

    async function load() {
      try {
        const data = await fetchById(config.apiPath, id);
        if (cancelled) return;
        setEntity(data);
        const pairs = await Promise.all(
          config.rels.map((rel) =>
            fetchRelationship(config.apiPath, id, rel.apiSuffix)
              .then((items) => [rel.label, items] as const)
              .catch(() => [rel.label, []] as const),
          ),
        );
        if (cancelled) return;
        setRels(Object.fromEntries(pairs));
      } catch (err: unknown) {
        if (!cancelled) setError((err as Error).message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => { cancelled = true; };
  }, [config.apiPath, id]);

  if (loading) return <div className="chip-detail chip-detail-status">Loading…</div>;
  if (error || !entity) return <div className="chip-detail chip-detail-status chip-detail-error">{error ?? 'Not found'}</div>;

  const name = String(entity[config.nameField] ?? id);
  const status = String(entity['status'] ?? '');

  return (
    <div className="chip-detail">
      <div className="chip-detail-header">
        <div className="chip-detail-title">
          <span>{name}</span>
          <span className="chip-detail-id">{id}</span>
        </div>
        <div className="chip-detail-actions">
          {status && <StatusBadge status={status} />}
          <Link to={`${config.path}/${encodeURIComponent(id)}`} className="btn btn-secondary btn-sm">
            Full page ↗
          </Link>
          <button className="btn-icon" onClick={onClose} title="Close">×</button>
        </div>
      </div>

      <div className="chip-detail-body">
        <div className="chip-detail-fields">
          {config.fields
            .filter((f) => f.key !== 'status')
            .map((field) => {
              const val = renderCompact(field, entity);
              if (!val) return null;
              return (
                <div key={field.key} className="chip-detail-field">
                  <span className="chip-detail-field-label">{field.label}</span>
                  <span className="chip-detail-field-value">{val}</span>
                </div>
              );
            })}
        </div>

        {config.rels.map((rel) => {
          const items = rels[rel.label] ?? [];
          if (items.length === 0) return null;
          const relEntityConfig = rel.targetPath
            ? ENTITY_CONFIGS.find((c) => c.path === rel.targetPath) ?? null
            : null;
          const expandedItem = expandedChipKey
            ? items.find((item) => `${rel.label}:${String(item[rel.idField] ?? '')}` === expandedChipKey)
            : undefined;
          const expandedRelId = expandedItem ? String(expandedItem[rel.idField] ?? '') : '';
          return (
            <div key={rel.label} className="chip-detail-section">
              <div className="chip-detail-section-label">
                {rel.label}
                <span className="chip-detail-section-count">{items.length}</span>
              </div>
              <div className="chip-detail-section-items">
                {items.map((item) => {
                  const relId = String(item[rel.idField] ?? '');
                  const relName = String(item[rel.nameField] ?? relId);
                  const chipKey = `${rel.label}:${relId}`;
                  const isActive = expandedChipKey === chipKey;
                  if (relEntityConfig) {
                    return (
                      <button
                        key={relId}
                        className={`chip-detail-pill chip-detail-pill-btn${isActive ? ' chip-active' : ''}`}
                        onClick={() => setExpandedChipKey(isActive ? null : chipKey)}
                      >
                        {relName}
                      </button>
                    );
                  }
                  return <span key={relId} className="chip-detail-pill">{relName}</span>;
                })}
              </div>
              {relEntityConfig && expandedRelId && (
                <ChipDetail
                  config={relEntityConfig}
                  id={expandedRelId}
                  onClose={() => setExpandedChipKey(null)}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
