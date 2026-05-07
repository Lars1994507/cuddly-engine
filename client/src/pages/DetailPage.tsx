import { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import type { EntityConfig, Field, RelConfig } from '../config';
import {
  fetchById,
  fetchRelationship,
  archiveEntity,
  addRelationship,
  removeRelationship,
  setCastleType,
  setCastleBlueprint,
  createLocalMod,
  updateLocalMod,
  deleteLocalMod,
} from '../api';
import StatusBadge from '../components/StatusBadge';

const REVIEW_STATUSES = ['Pending', 'Approved', 'Rejected'];
const PROMOTION_RECS = [
  'RemainLocal',
  'PromoteToCompound',
  'PromoteToComposite',
  'PromoteToService',
  'PromoteToBlueprint',
];

type LocalMod = Record<string, unknown>;

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

function AssignRow({
  label,
  currentId,
  inputValue,
  onInputChange,
  onSave,
  onClear,
  saving,
}: {
  label: string;
  currentId: string;
  inputValue: string;
  onInputChange: (v: string) => void;
  onSave: () => void;
  onClear: () => void;
  saving: boolean;
}) {
  return (
    <div className="assign-row">
      <div className="assign-label">{label}</div>
      <div className="assign-value">{currentId || '—'}</div>
      <input
        className="form-input"
        style={{ flex: 1, maxWidth: 320 }}
        value={inputValue}
        onChange={(e) => onInputChange(e.target.value)}
        placeholder={`New ${label} ID`}
      />
      <button className="btn btn-secondary" style={{ flexShrink: 0 }} onClick={onSave} disabled={saving}>
        {saving ? '…' : 'Set'}
      </button>
      <button className="btn btn-secondary" style={{ flexShrink: 0, color: '#6e7681' }} onClick={onClear} disabled={saving}>
        Clear
      </button>
    </div>
  );
}

function LocalModForm({
  mod,
  onSave,
  onCancel,
}: {
  mod: LocalMod | null;
  onSave: (data: Record<string, string>) => Promise<void>;
  onCancel: () => void;
}) {
  const isEdit = mod !== null;
  const [vals, setVals] = useState<Record<string, string>>({
    modification_id: isEdit ? String(mod!['modification_id'] ?? '') : '',
    modified_item: isEdit ? String(mod!['modified_item'] ?? '') : '',
    change_description: isEdit ? String(mod!['change_description'] ?? '') : '',
    reason: isEdit ? String(mod!['reason'] ?? '') : '',
    related_blueprint_id: isEdit ? String(mod!['related_blueprint_id'] ?? '') : '',
    related_castle_service_id: isEdit ? String(mod!['related_castle_service_id'] ?? '') : '',
    version_notes: isEdit ? String(mod!['version_notes'] ?? '') : '',
    review_status: isEdit ? String(mod!['review_status'] ?? 'Pending') : 'Pending',
    promotion_recommendation: isEdit ? String(mod!['promotion_recommendation'] ?? 'RemainLocal') : 'RemainLocal',
  });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  function set(k: string, v: string) { setVals((p) => ({ ...p, [k]: v })); }

  async function handleSave() {
    if (!vals.modification_id.trim()) { setErr('Modification ID is required'); return; }
    if (!vals.modified_item.trim()) { setErr('Modified Item is required'); return; }
    if (!vals.change_description.trim()) { setErr('Change Description is required'); return; }
    setSaving(true);
    setErr(null);
    try { await onSave(vals); }
    catch (e: unknown) { setErr((e as Error).message); setSaving(false); }
  }

  return (
    <div className="lmod-form">
      {err && <div className="error-box" style={{ marginBottom: '0.6rem' }}>{err}</div>}
      <div className="lmod-form-grid">
        <div className="form-group">
          <label className="form-label">Modification ID <span className="required">*</span></label>
          <input className="form-input" value={vals.modification_id} readOnly={isEdit}
            placeholder="LMOD-WORD-V001" onChange={(e) => set('modification_id', e.target.value)} />
        </div>
        <div className="form-group">
          <label className="form-label">Modified Item <span className="required">*</span></label>
          <input className="form-input" value={vals.modified_item}
            placeholder="What was modified" onChange={(e) => set('modified_item', e.target.value)} />
        </div>
        <div className="form-group full">
          <label className="form-label">Change Description <span className="required">*</span></label>
          <textarea className="form-textarea" style={{ minHeight: 60 }} value={vals.change_description}
            placeholder="Describe the change" onChange={(e) => set('change_description', e.target.value)} />
        </div>
        <div className="form-group full">
          <label className="form-label">Reason</label>
          <textarea className="form-textarea" style={{ minHeight: 60 }} value={vals.reason}
            placeholder="Why was this change made" onChange={(e) => set('reason', e.target.value)} />
        </div>
        <div className="form-group">
          <label className="form-label">Related Blueprint ID</label>
          <input className="form-input" value={vals.related_blueprint_id}
            placeholder="BP-WORD-V001" onChange={(e) => set('related_blueprint_id', e.target.value)} />
        </div>
        <div className="form-group">
          <label className="form-label">Related Castle Service ID</label>
          <input className="form-input" value={vals.related_castle_service_id}
            placeholder="CS-WORD-V001" onChange={(e) => set('related_castle_service_id', e.target.value)} />
        </div>
        <div className="form-group full">
          <label className="form-label">Version Notes</label>
          <textarea className="form-textarea" style={{ minHeight: 60 }} value={vals.version_notes}
            placeholder="Context for this version of the modification" onChange={(e) => set('version_notes', e.target.value)} />
        </div>
        <div className="form-group">
          <label className="form-label">Review Status</label>
          <select className="form-select" value={vals.review_status} onChange={(e) => set('review_status', e.target.value)}>
            {REVIEW_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Promotion Recommendation</label>
          <select className="form-select" value={vals.promotion_recommendation} onChange={(e) => set('promotion_recommendation', e.target.value)}>
            {PROMOTION_RECS.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
      </div>
      <div className="form-actions" style={{ marginTop: '0.75rem' }}>
        <button className="btn btn-primary" onClick={() => { void handleSave(); }} disabled={saving}>
          {saving ? 'Saving…' : isEdit ? 'Update' : 'Create'}
        </button>
        <button className="btn btn-secondary" onClick={onCancel}>Cancel</button>
      </div>
    </div>
  );
}

export default function DetailPage({ config }: { config: EntityConfig }) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [entity, setEntity] = useState<Record<string, unknown> | null>(null);
  const [rels, setRels] = useState<Record<string, Record<string, unknown>[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [relVersion, setRelVersion] = useState(0);

  // Archive state
  const [confirmArchive, setConfirmArchive] = useState(false);
  const [archiving, setArchiving] = useState(false);

  // Relationship add state
  const [addInput, setAddInput] = useState<Record<string, string>>({});
  const [addError, setAddError] = useState<Record<string, string>>({});
  const [addLoading, setAddLoading] = useState<Record<string, boolean>>({});
  const [removing, setRemoving] = useState<Set<string>>(new Set());

  // Castle type/blueprint assignment
  const [ctypeInput, setCtypeInput] = useState('');
  const [blueprintInput, setBlueprintInput] = useState('');
  const [assigningCtype, setAssigningCtype] = useState(false);
  const [assigningBlueprint, setAssigningBlueprint] = useState(false);

  // Local mod state
  const [showModForm, setShowModForm] = useState(false);
  const [editingMod, setEditingMod] = useState<LocalMod | null>(null);
  const [deletingMod, setDeletingMod] = useState<string | null>(null);

  const refreshRels = useCallback(() => setRelVersion((v) => v + 1), []);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setError(null);
    fetchById(config.apiPath, id)
      .then((data) => {
        setEntity(data);
        setCtypeInput(String(data['castle_type_id'] ?? ''));
        setBlueprintInput(String(data['blueprint_id'] ?? ''));
      })
      .catch((err: unknown) => setError((err as Error).message))
      .finally(() => setLoading(false));
  }, [config.apiPath, id]);

  useEffect(() => {
    if (!id || loading) return;
    Promise.all(
      config.rels.map((rel) =>
        fetchRelationship(config.apiPath, id, rel.apiSuffix)
          .then((items) => [rel.label, items] as const)
          .catch(() => [rel.label, []] as const),
      ),
    ).then((pairs) => setRels(Object.fromEntries(pairs)));
  }, [config.apiPath, config.rels, id, loading, relVersion]);

  async function handleArchive() {
    if (!id) return;
    setArchiving(true);
    try {
      await archiveEntity(config.apiPath, id);
      navigate(config.path);
    } catch (err: unknown) {
      setError((err as Error).message);
      setArchiving(false);
      setConfirmArchive(false);
    }
  }

  async function handleAddRel(rel: RelConfig) {
    if (!id) return;
    const val = (addInput[rel.label] ?? '').trim();
    if (!val) {
      setAddError((p) => ({ ...p, [rel.label]: 'ID is required' }));
      return;
    }
    setAddLoading((p) => ({ ...p, [rel.label]: true }));
    setAddError((p) => ({ ...p, [rel.label]: '' }));
    try {
      await addRelationship(config.apiPath, id, rel.apiSuffix, { [rel.idField]: val });
      setAddInput((p) => ({ ...p, [rel.label]: '' }));
      refreshRels();
    } catch (err: unknown) {
      setAddError((p) => ({ ...p, [rel.label]: (err as Error).message }));
    } finally {
      setAddLoading((p) => ({ ...p, [rel.label]: false }));
    }
  }

  async function handleRemoveRel(rel: RelConfig, relId: string) {
    if (!id) return;
    const key = `${rel.label}:${relId}`;
    setRemoving((p) => new Set(p).add(key));
    try {
      await removeRelationship(config.apiPath, id, rel.apiSuffix, relId);
      refreshRels();
    } catch (err: unknown) {
      setError((err as Error).message);
    } finally {
      setRemoving((p) => { const n = new Set(p); n.delete(key); return n; });
    }
  }

  async function handleAssignCtype() {
    if (!id) return;
    setAssigningCtype(true);
    try {
      await setCastleType(id, ctypeInput.trim() || null);
      setEntity((e) => e ? { ...e, castle_type_id: ctypeInput.trim() || null } : e);
    } catch (err: unknown) { setError((err as Error).message); }
    finally { setAssigningCtype(false); }
  }

  async function handleAssignBlueprint() {
    if (!id) return;
    setAssigningBlueprint(true);
    try {
      await setCastleBlueprint(id, blueprintInput.trim() || null);
      setEntity((e) => e ? { ...e, blueprint_id: blueprintInput.trim() || null } : e);
    } catch (err: unknown) { setError((err as Error).message); }
    finally { setAssigningBlueprint(false); }
  }

  async function handleCreateMod(data: Record<string, string>) {
    if (!id) return;
    await createLocalMod(id, data);
    setShowModForm(false);
    refreshRels();
  }

  async function handleUpdateMod(data: Record<string, string>) {
    if (!id || !editingMod) return;
    const modId = String(editingMod['modification_id']);
    const { modification_id: _, ...rest } = data;
    await updateLocalMod(id, modId, rest);
    setEditingMod(null);
    refreshRels();
  }

  async function handleDeleteMod(modId: string) {
    if (!id) return;
    setDeletingMod(modId);
    try {
      await deleteLocalMod(id, modId);
      refreshRels();
    } catch (err: unknown) { setError((err as Error).message); }
    finally { setDeletingMod(null); }
  }

  if (loading) return <div className="loading">Loading…</div>;
  if (error && !entity) return <div className="error-box">{error}</div>;
  if (!entity) return <div className="empty-box">Not found</div>;

  const name = String(entity[config.nameField] ?? id);
  const status = String(entity['status'] ?? '');

  return (
    <div>
      <Link to={config.path} className="back-link">← {config.label}</Link>

      {error && <div className="error-box" style={{ marginBottom: '0.75rem' }}>{error}</div>}

      <div className="detail-header">
        <div>
          <div className="detail-title">{name}</div>
          <div className="detail-id">{id}</div>
        </div>
        <StatusBadge status={status} />
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginLeft: 'auto' }}>
          {config.key === 'castles' && id && (
            <Link to={`/bom/${encodeURIComponent(id)}`} className="btn btn-accent">View BOM</Link>
          )}
          <Link to={`${config.path}/${encodeURIComponent(id ?? '')}/edit`} className="btn btn-secondary">
            Edit
          </Link>
          {!confirmArchive ? (
            <button className="btn btn-danger" onClick={() => setConfirmArchive(true)}>Archive</button>
          ) : (
            <div className="confirm-bar">
              <span>Archive this {config.singular}?</span>
              <button className="btn btn-danger" onClick={() => { void handleArchive(); }} disabled={archiving}>
                {archiving ? 'Archiving…' : 'Confirm'}
              </button>
              <button className="btn btn-secondary" onClick={() => setConfirmArchive(false)}>Cancel</button>
            </div>
          )}
        </div>
      </div>

      {/* Castle type/blueprint assignment */}
      {config.key === 'castles' && (
        <div className="panel" style={{ marginBottom: '1.1rem' }}>
          <div className="panel-header">Assignments</div>
          <AssignRow
            label="Castle Type"
            currentId={String(entity['castle_type_id'] ?? '')}
            inputValue={ctypeInput}
            onInputChange={setCtypeInput}
            onSave={() => { void handleAssignCtype(); }}
            onClear={() => { setCtypeInput(''); void (async () => { await setCastleType(id!, null); setEntity((e) => e ? { ...e, castle_type_id: null } : e); })(); }}
            saving={assigningCtype}
          />
          <AssignRow
            label="Blueprint"
            currentId={String(entity['blueprint_id'] ?? '')}
            inputValue={blueprintInput}
            onInputChange={setBlueprintInput}
            onSave={() => { void handleAssignBlueprint(); }}
            onClear={() => { setBlueprintInput(''); void (async () => { await setCastleBlueprint(id!, null); setEntity((e) => e ? { ...e, blueprint_id: null } : e); })(); }}
            saving={assigningBlueprint}
          />
        </div>
      )}

      {/* Fields */}
      <div className="panel">
        <div className="panel-header">Fields</div>
        <div className="panel-body">
          <div className="fields-grid">
            {config.fields.map((field) => (
              <div key={field.key}>
                <div className="field-label">{field.label}</div>
                {renderField(field, entity)}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Relationships */}
      {config.rels.map((rel) => {
        const items = rels[rel.label] ?? [];
        const isLocalMod = rel.apiSuffix === 'local-modifications';

        if (isLocalMod) {
          return (
            <div key={rel.label} className="panel">
              <div className="panel-header">
                {rel.label}
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <span style={{ fontWeight: 400, color: '#484f58' }}>{items.length}</span>
                  <button
                    className="btn btn-secondary"
                    style={{ fontSize: '0.75rem', padding: '0.2rem 0.6rem' }}
                    onClick={() => { setShowModForm(true); setEditingMod(null); }}
                  >
                    + New
                  </button>
                </div>
              </div>

              {showModForm && editingMod === null && (
                <LocalModForm
                  mod={null}
                  onSave={handleCreateMod}
                  onCancel={() => setShowModForm(false)}
                />
              )}

              {items.length === 0 && !showModForm ? (
                <div className="empty-box" style={{ padding: '1rem' }}>None</div>
              ) : (
                items.map((item) => {
                  const modId = String(item['modification_id'] ?? '');
                  const isEditing = editingMod?.['modification_id'] === modId;
                  return (
                    <div key={modId} className="lmod-item">
                      <div className="lmod-header">
                        <div>
                          <span className="rel-name no-link">{String(item['modified_item'] ?? modId)}</span>
                          <div className="rel-secondary">{String(item['change_description'] ?? '')}</div>
                        </div>
                        <div className="lmod-actions">
                          <StatusBadge status={String(item['review_status'] ?? '')} />
                          {item['status'] && <StatusBadge status={String(item['status'])} />}
                          <button
                            className="btn btn-secondary"
                            style={{ fontSize: '0.75rem', padding: '0.2rem 0.6rem' }}
                            onClick={() => { setEditingMod(isEditing ? null : item); setShowModForm(false); }}
                          >
                            {isEditing ? 'Cancel' : 'Edit'}
                          </button>
                          <button
                            className="btn btn-danger"
                            style={{ fontSize: '0.75rem', padding: '0.2rem 0.6rem' }}
                            disabled={deletingMod === modId}
                            onClick={() => { void handleDeleteMod(modId); }}
                          >
                            {deletingMod === modId ? '…' : 'Archive'}
                          </button>
                        </div>
                      </div>
                      {isEditing && (
                        <LocalModForm
                          mod={item}
                          onSave={handleUpdateMod}
                          onCancel={() => setEditingMod(null)}
                        />
                      )}
                    </div>
                  );
                })
              )}
            </div>
          );
        }

        return (
          <div key={rel.label} className="panel">
            <div className="panel-header">
              {rel.label}
              <span style={{ fontWeight: 400, color: '#484f58' }}>{items.length}</span>
            </div>

            {items.length === 0 ? (
              <div className="empty-box" style={{ padding: '1rem' }}>None</div>
            ) : (
              items.map((item) => {
                const relId = String(item[rel.idField] ?? '');
                const relName = String(item[rel.nameField] ?? relId);
                const relStatus = item['status'] ? String(item['status']) : '';
                const secondary = rel.secondaryField ? String(item[rel.secondaryField] ?? '') : '';
                const removeKey = `${rel.label}:${relId}`;
                return (
                  <div key={relId} className="rel-item">
                    <div>
                      {rel.targetPath ? (
                        <Link to={`${rel.targetPath}/${encodeURIComponent(relId)}`} className="rel-name">
                          {relName}
                        </Link>
                      ) : (
                        <span className="rel-name no-link">{relName}</span>
                      )}
                      {secondary && <div className="rel-secondary">{secondary}</div>}
                    </div>
                    <div className="rel-right">
                      {relStatus && <StatusBadge status={relStatus} />}
                      {rel.manageable && (
                        <button
                          className="btn-icon"
                          title={`Remove from ${rel.label}`}
                          disabled={removing.has(removeKey)}
                          onClick={() => { void handleRemoveRel(rel, relId); }}
                        >
                          {removing.has(removeKey) ? '…' : '×'}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}

            {rel.manageable && (
              <div className="rel-add-form">
                <input
                  className="search-input"
                  style={{ flex: 1 }}
                  placeholder={`Add by ${rel.idField}`}
                  value={addInput[rel.label] ?? ''}
                  onChange={(e) => setAddInput((p) => ({ ...p, [rel.label]: e.target.value }))}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); void handleAddRel(rel); } }}
                />
                <button
                  className="btn btn-secondary"
                  disabled={addLoading[rel.label]}
                  onClick={() => { void handleAddRel(rel); }}
                >
                  {addLoading[rel.label] ? '…' : 'Add'}
                </button>
                {addError[rel.label] && (
                  <span style={{ color: '#f85149', fontSize: '0.78rem' }}>{addError[rel.label]}</span>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
