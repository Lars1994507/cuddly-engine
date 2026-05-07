import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import type { EntityConfig, FormField } from '../config';
import { fetchById, createEntity, updateEntity } from '../api';

type Mode = 'create' | 'edit';

function initState(fields: FormField[], entity?: Record<string, unknown>): Record<string, string> {
  const s: Record<string, string> = {};
  for (const f of fields) {
    const raw = entity?.[f.key];
    if (f.type === 'json-array') {
      if (Array.isArray(raw)) {
        s[f.key] = (raw as string[]).join(', ');
      } else if (typeof raw === 'string' && raw !== '') {
        try {
          const arr = JSON.parse(raw) as unknown[];
          s[f.key] = Array.isArray(arr) ? arr.join(', ') : raw;
        } catch {
          s[f.key] = raw;
        }
      } else {
        s[f.key] = '';
      }
    } else if (f.type === 'select' && (raw === undefined || raw === null || raw === '')) {
      s[f.key] = f.options?.[0] ?? '';
    } else {
      s[f.key] = String(raw ?? '');
    }
  }
  return s;
}

function buildBody(
  fields: FormField[],
  state: Record<string, string>,
  mode: Mode,
  idField: string,
): Record<string, unknown> {
  const body: Record<string, unknown> = {};
  for (const f of fields) {
    if (mode === 'edit' && f.key === idField) continue;
    const val = state[f.key] ?? '';
    if (f.type === 'json-array') {
      body[f.key] = val.trim() === '' ? [] : val.split(',').map((s) => s.trim()).filter(Boolean);
    } else {
      body[f.key] = val;
    }
  }
  return body;
}

export default function EntityFormPage({
  config,
  mode,
}: {
  config: EntityConfig;
  mode: Mode;
}) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [values, setValues] = useState<Record<string, string>>(() =>
    initState(config.formFields),
  );
  const [loading, setLoading] = useState(mode === 'edit');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (mode === 'edit' && id) {
      setLoading(true);
      setError(null);
      fetchById(config.apiPath, id)
        .then((entity) => setValues(initState(config.formFields, entity)))
        .catch((err: unknown) => setError((err as Error).message))
        .finally(() => setLoading(false));
    }
  }, [config.apiPath, config.formFields, mode, id]);

  function set(key: string, val: string) {
    setValues((prev) => ({ ...prev, [key]: val }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    for (const f of config.formFields) {
      if (f.required && !(values[f.key] ?? '').trim()) {
        setError(`${f.label} is required`);
        return;
      }
    }
    setSaving(true);
    setError(null);
    try {
      const body = buildBody(config.formFields, values, mode, config.idField);
      let result: Record<string, unknown>;
      if (mode === 'create') {
        result = await createEntity(config.apiPath, body);
      } else {
        result = await updateEntity(config.apiPath, id!, body);
      }
      const newId = String(result[config.idField] ?? id ?? '');
      navigate(`${config.path}/${encodeURIComponent(newId)}`);
    } catch (err: unknown) {
      setError((err as Error).message);
      setSaving(false);
    }
  }

  function renderField(f: FormField) {
    const isReadonly = mode === 'edit' && f.key === config.idField;
    const val = values[f.key] ?? '';

    if (f.type === 'select' && f.options) {
      return (
        <select
          className="form-select"
          value={val}
          disabled={isReadonly}
          onChange={(e) => set(f.key, e.target.value)}
        >
          {f.options.map((opt) => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      );
    }
    if (f.type === 'textarea') {
      return (
        <textarea
          className="form-textarea"
          value={val}
          readOnly={isReadonly}
          placeholder={f.placeholder}
          onChange={(e) => set(f.key, e.target.value)}
        />
      );
    }
    if (f.type === 'json-array') {
      return (
        <>
          <input
            className="form-input"
            value={val}
            readOnly={isReadonly}
            placeholder={f.placeholder ?? 'Comma-separated values'}
            onChange={(e) => set(f.key, e.target.value)}
          />
          <div className="form-hint">Comma-separated list</div>
        </>
      );
    }
    return (
      <input
        className="form-input"
        value={val}
        readOnly={isReadonly}
        placeholder={f.placeholder}
        onChange={(e) => set(f.key, e.target.value)}
      />
    );
  }

  const title = mode === 'create' ? `New ${config.singular}` : `Edit ${config.singular}`;
  const isTextarea = (f: FormField) => f.type === 'textarea' || f.type === 'json-array';

  if (loading) return <div className="loading">Loading…</div>;

  return (
    <div className="form-page">
      <Link to={mode === 'edit' && id ? `${config.path}/${encodeURIComponent(id)}` : config.path} className="back-link">
        ← {mode === 'edit' ? String(values[config.nameField] || id) : config.label}
      </Link>

      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.75rem', flexWrap: 'wrap' }}>
          <div>
            <div className="page-title">{title}</div>
            <div className="page-subtitle">{config.singular} details</div>
          </div>
          {mode === 'create' && config.randomData && (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setValues((prev) => ({ ...prev, ...config.randomData!() }))}
            >
              Random
            </button>
          )}
        </div>
      </div>

      {error && <div className="error-box">{error}</div>}

      <form onSubmit={(e) => { void handleSubmit(e); }}>
        <div className="panel">
          <div className="panel-header">Fields</div>
          <div className="panel-body">
            <div className="form-grid">
              {config.formFields.map((f) => (
                <div
                  key={f.key}
                  className={`form-group${isTextarea(f) ? ' full' : ''}`}
                >
                  <label className="form-label">
                    {f.label}
                    {f.required && <span className="required"> *</span>}
                  </label>
                  {renderField(f)}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="form-actions">
          <button className="btn btn-primary" type="submit" disabled={saving}>
            {saving ? 'Saving…' : mode === 'create' ? `Create ${config.singular}` : 'Save Changes'}
          </button>
          <Link
            to={mode === 'edit' && id ? `${config.path}/${encodeURIComponent(id)}` : config.path}
            className="btn btn-secondary"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
