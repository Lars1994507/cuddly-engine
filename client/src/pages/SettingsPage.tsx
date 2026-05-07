import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  fetchDemoStatus,
  loadDemoData,
  clearDemoData,
  clearAllData,
  type DemoStatus,
  type DemoCounts,
} from '../api';
import StatusBadge from '../components/StatusBadge';

const DEMO_CASTLE_ID = 'CSTL-BREW-GRIND-DEMO-V001';

const ENTITY_LABELS: [keyof DemoCounts, string][] = [
  ['castles', 'Castles'],
  ['castle_types', 'Castle Types'],
  ['blueprints', 'Blueprints'],
  ['castle_units', 'Castle Units'],
  ['castle_services', 'Castle Services'],
  ['composites', 'Composites'],
  ['compounds', 'Compounds'],
  ['atomic_assets', 'Atomic Assets'],
  ['local_modifications', 'Local Modifications'],
];

export default function SettingsPage() {
  const navigate = useNavigate();

  const [status, setStatus] = useState<DemoStatus | null>(null);
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);

  const refresh = useCallback(async () => {
    try {
      setStatus(await fetchDemoStatus());
    } catch {
      // DB may not be up yet; silently keep status null
    }
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);

  async function handleLoad() {
    setBusy(true);
    setFeedback(null);
    try {
      const res = await loadDemoData();
      await refresh();
      const total = Object.values(res.counts).reduce((a, b) => a + b, 0);
      setFeedback({ kind: 'ok', text: `${res.message} — ${total} entities created.` });
    } catch (err) {
      setFeedback({ kind: 'err', text: (err as Error).message });
    } finally {
      setBusy(false);
    }
  }

  async function handleClearDemo() {
    if (!confirm('Remove all demo data? This cannot be undone.')) return;
    setBusy(true);
    setFeedback(null);
    try {
      const res = await clearDemoData();
      await refresh();
      setFeedback({ kind: 'ok', text: res.message });
    } catch (err) {
      setFeedback({ kind: 'err', text: (err as Error).message });
    } finally {
      setBusy(false);
    }
  }

  async function handleClearAll() {
    if (!confirm('Remove ALL data from the database? This deletes every castle, entity, and relationship and cannot be undone.')) return;
    setBusy(true);
    setFeedback(null);
    try {
      const res = await clearAllData();
      await refresh();
      setFeedback({ kind: 'ok', text: res.message });
    } catch (err) {
      setFeedback({ kind: 'err', text: (err as Error).message });
    } finally {
      setBusy(false);
    }
  }

  const loaded = status?.loaded ?? false;
  const counts = status?.counts;

  return (
    <div className="page-container" style={{ maxWidth: 720 }}>
      <h1 className="page-title">Settings</h1>

      {/* ── Demo Data ─────────────────────────────────────────────────── */}
      <section className="settings-section">
        <h2 className="settings-section-title">Demo Data</h2>
        <p className="settings-description">
          Load the <strong>Brew &amp; Grind Coffee Shop</strong> demo castle — a pre-built
          hierarchy with shared nodes designed to test the Diagram tab. All demo entities have
          <code>-DEMO-</code> in their IDs so they stay isolated from any other data you have loaded.
        </p>

        {/* Status badge */}
        <div className="settings-status-row">
          <StatusBadge status={loaded ? 'Active' : 'Draft'} />
          <span style={{ marginLeft: '0.5rem', color: '#8b949e', fontSize: '0.82rem' }}>
            {loaded ? 'Demo data loaded' : 'Not loaded'}
          </span>
          {loaded && counts && (
            <span className="settings-status-detail">
              {ENTITY_LABELS.map(([key, label]) =>
                counts[key] > 0 ? (
                  <span key={key} className="settings-count-chip">
                    {counts[key]} {label}
                  </span>
                ) : null,
              )}
            </span>
          )}
        </div>

        {/* Shared-node callout */}
        {loaded && (
          <div className="settings-info-box">
            <strong>Diagram test notes:</strong>
            <ul>
              <li><code>AA-MENU-STATUS-ENUM-DEMO-V001</code> — shared across 2 Compounds (tests node deduplication)</li>
              <li><code>CMPD-PRICE-FORMAT-DEMO-V001</code> — shared across 2 Composites (tests edge deduplication)</li>
              <li><code>CS-AUTH-DEMO-V001</code> — shared across 2 Castle Units</li>
            </ul>
          </div>
        )}

        {/* Action buttons */}
        <div className="settings-button-row">
          <button
            className="btn btn-primary"
            onClick={handleLoad}
            disabled={busy}
          >
            {busy ? 'Loading…' : loaded ? 'Reload Demo Data' : 'Load Demo Data'}
          </button>

          {loaded && (
            <button
              className="btn btn-secondary"
              onClick={handleClearDemo}
              disabled={busy}
            >
              Clear Demo Data
            </button>
          )}

          {loaded && (
            <button
              className="btn btn-primary"
              style={{ background: '#1a56db' }}
              onClick={() => navigate(`/diagram/${DEMO_CASTLE_ID}`)}
            >
              Open in Diagram →
            </button>
          )}
        </div>

        {feedback && (
          <div className={`settings-feedback ${feedback.kind === 'err' ? 'settings-feedback-err' : 'settings-feedback-ok'}`}>
            {feedback.text}
          </div>
        )}
      </section>

      {/* ── CSV Source ────────────────────────────────────────────────── */}
      <section className="settings-section">
        <h2 className="settings-section-title">CSV Source</h2>
        <p className="settings-description">
          The demo data is defined in <code>db/demo/demo-data.csv</code>. Edit that file to
          customize the demo castle, then click <em>Reload Demo Data</em> to apply your changes.
          The CSV uses section headers like <code>[AtomicAsset]</code>, <code>[Compound]</code>,
          etc. — one section per entity type and one per relationship type.
        </p>
        <div className="settings-button-row">
          <a className="btn btn-secondary" href="/api/demo/csv" download="demo-data.csv">
            Download CSV
          </a>
        </div>
      </section>

      {/* ── Danger Zone ───────────────────────────────────────────────── */}
      <section className="settings-section settings-danger-section">
        <h2 className="settings-section-title settings-danger-title">Danger Zone</h2>
        <p className="settings-description">
          Permanently removes <strong>all</strong> castles, entities, and relationships from the
          database. This includes any data you loaded with the seed script, not just demo data.
        </p>
        <div className="settings-button-row">
          <button
            className="btn btn-danger"
            onClick={handleClearAll}
            disabled={busy}
          >
            Clear All Data
          </button>
        </div>
      </section>
    </div>
  );
}
