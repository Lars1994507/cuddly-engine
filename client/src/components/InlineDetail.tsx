import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import type { EntityConfig, Field } from '../config';
import { ENTITY_CONFIGS } from '../config';
import { fetchById, fetchRelationship } from '../api';
import StatusBadge from './StatusBadge';
import ChipDetail from './ChipDetail';

function renderField(field: Field, entity: Record<string, unknown>) {
  const raw = entity[field.key];
  if (field.key === 'status') return <StatusBadge status={String(raw ?? '')} />;
  if (raw === undefined || raw === null || raw === '') {
    return <span className="field-value empty">—</span>;
  }
  if (field.type === 'date') {
    return <span className="field-value">{new Date(String(raw)).toLocaleString()}</span>;
  }
  if (field.type === 'json-array') {
    let arr: unknown[] = [];
    try {
      arr = typeof raw === 'string' ? (JSON.parse(raw) as unknown[]) : (raw as unknown[]);
    } catch { /* empty */ }
    if (!Array.isArray(arr) || arr.length === 0) {
      return <span className="field-value empty">—</span>;
    }
    return (
      <div className="tag-list">
        {arr.map((v, i) => <span key={i} className="tag">{String(v)}</span>)}
      </div>
    );
  }
  return <span className="field-value">{String(raw)}</span>;
}

export default function InlineDetail({
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
  const [codePreviewKey, setCodePreviewKey] = useState<string | null>(null);

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

  if (loading) return <div className="inline-detail-status">Loading…</div>;
  if (error || !entity) return <div className="inline-detail-status error">{error ?? 'Not found'}</div>;

  const name = String(entity[config.nameField] ?? id);
  const status = String(entity['status'] ?? '');
  const encodedId = encodeURIComponent(id);

  return (
    <div className="inline-detail">
      <div className="inline-detail-header">
        <div className="inline-detail-title">
          {name}
          <span className="inline-detail-id">{id}</span>
        </div>
        <div className="inline-detail-actions">
          <StatusBadge status={status} />
          {config.key === 'castles' && (
            <Link to={`/bom/${encodedId}`} className="btn btn-accent btn-sm">BOM</Link>
          )}
          <Link to={`${config.path}/${encodedId}/edit`} className="btn btn-secondary btn-sm">Edit</Link>
          <Link to={`${config.path}/${encodedId}`} className="btn btn-secondary btn-sm">Full page ↗</Link>
          <button className="btn-icon" title="Close" onClick={onClose}>×</button>
        </div>
      </div>

      <div className="inline-detail-body">
        <div className="inline-section">
          <div className="inline-section-label">Fields</div>
          <div className="fields-grid">
            {config.fields.map((field) => (
              <div key={field.key}>
                <div className="field-label">{field.label}</div>
                {renderField(field, entity)}
              </div>
            ))}
          </div>
        </div>

        {config.rels.map((rel) => {
          const items = rels[rel.label] ?? [];
          const relEntityConfig = rel.targetPath
            ? ENTITY_CONFIGS.find((c) => c.path === rel.targetPath) ?? null
            : null;
          const expandedItem = expandedChipKey
            ? items.find((item) => `${rel.label}:${String(item[rel.idField] ?? '')}` === expandedChipKey)
            : undefined;
          const expandedRelId = expandedItem ? String(expandedItem[rel.idField] ?? '') : '';
          const codePreviewOpen = codePreviewKey !== null && items.some((item) => `${rel.label}:${String(item[rel.idField] ?? '')}` === codePreviewKey);

          return (
            <div key={rel.label} className="inline-section">
              <div className="inline-section-label">
                {rel.label}
                <span className="inline-section-count">{items.length}</span>
              </div>
              {items.length === 0 ? (
                <span className="field-value empty">None</span>
              ) : (
                <>
                  <div className="inline-rel-chips">
                    {items.map((item) => {
                      const relId = String(item[rel.idField] ?? '');
                      const relName = String(item[rel.nameField] ?? relId);
                      const relStatus = item['status'] ? String(item['status']) : '';
                      const secondary = rel.secondaryField ? String(item[rel.secondaryField] ?? '') : '';
                      const chipKey = `${rel.label}:${relId}`;
                      const isActive = expandedChipKey === chipKey;
                      const isStale = relStatus === 'Deprecated' || relStatus === 'Archived';
                      const isCodeOpen = codePreviewKey === chipKey;
                      return (
                        <div key={relId} className={`inline-rel-chip${isActive ? ' chip-active' : ''}${isStale ? ' chip-stale' : ''}`}>
                          {relEntityConfig ? (
                            <button
                              className="chip-expand-btn"
                              onClick={() => setExpandedChipKey(isActive ? null : chipKey)}
                            >
                              {relName}
                            </button>
                          ) : (
                            <span className="inline-rel-name no-link">{relName}</span>
                          )}
                          <span className="chip-id-mono">{relId}</span>
                          {rel.targetPath && (
                            <Link
                              to={`${rel.targetPath}/${encodeURIComponent(relId)}`}
                              className="chip-nav-link"
                              title="Open full page"
                            >
                              ↗
                            </Link>
                          )}
                          <button
                            className={`code-preview-btn${isCodeOpen ? ' code-preview-active' : ''}`}
                            title="Preview source"
                            onClick={() => setCodePreviewKey(isCodeOpen ? null : chipKey)}
                          >&lt;/&gt;</button>
                          {secondary && <span className="inline-rel-secondary">{secondary}</span>}
                          {relStatus && <StatusBadge status={relStatus} />}
                        </div>
                      );
                    })}
                  </div>
                  {codePreviewOpen && (
                    <div className="code-preview-dropdown">
                      <span className="code-preview-placeholder">placeholder</span>
                    </div>
                  )}
                  {relEntityConfig && expandedRelId && (
                    <ChipDetail
                      config={relEntityConfig}
                      id={expandedRelId}
                      onClose={() => setExpandedChipKey(null)}
                    />
                  )}
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
