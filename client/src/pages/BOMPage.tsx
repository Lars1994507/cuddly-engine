import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchBOM } from '../api';
import StatusBadge from '../components/StatusBadge';

// ── Types ──────────────────────────────────────────────────────────────────────

interface BOMNode { id: string; name: string; version?: string; status: string; warning?: string; }
interface BOMAtomicAsset extends BOMNode { asset_type: string; }
interface BOMCompound extends BOMNode { atomic_assets: BOMAtomicAsset[]; }
interface BOMComposite extends BOMNode { ui_backend_scope: string; compounds: BOMCompound[]; atomic_assets: BOMAtomicAsset[]; }
interface BOMCastleService extends BOMNode { capability: string; composites: BOMComposite[]; compounds: BOMCompound[]; atomic_assets: BOMAtomicAsset[]; }
interface BOMCastleUnit extends BOMNode { castle_services: BOMCastleService[]; }
interface BOMLocalMod { modification_id: string; modified_item: string; change_description: string; reason: string; review_status: string; promotion_recommendation: string; }
interface BOMResult extends BOMNode {
  castle_record_id: string;
  castle_name: string;
  castle_type: BOMNode | null;
  blueprint: BOMNode | null;
  castle_units: BOMCastleUnit[];
  local_modifications: BOMLocalMod[];
}

interface CastleOption {
  castle_record_id: string;
  castle_name: string;
  status: string;
}

// ── Tree components ────────────────────────────────────────────────────────────

function Toggle({ open, onClick }: { open: boolean; onClick: () => void }) {
  return <span className="bom-toggle" onClick={onClick}>{open ? '▼' : '▶'}</span>;
}

function Spacer() { return <span className="bom-spacer" />; }

function Row({ indent, open, onToggle, badge, name, id, status, warning }: {
  indent: number; open?: boolean; onToggle?: () => void;
  badge?: string; name: string; id: string; status: string; warning?: string;
}) {
  return (
    <div className="bom-row" style={{ paddingLeft: indent * 1.4 + 'rem' }}>
      {onToggle != null ? <Toggle open={open!} onClick={onToggle} /> : <Spacer />}
      {badge && <span className="bom-badge">{badge}</span>}
      <span className="bom-name">{name}</span>
      <span className="bom-id">{id}</span>
      <StatusBadge status={status} />
      {warning && <span className="bom-warning">⚠ {warning}</span>}
    </div>
  );
}

function AARow({ aa, depth }: { aa: BOMAtomicAsset; depth: number }) {
  return <Row indent={depth} badge={aa.asset_type} name={aa.name} id={aa.id} status={aa.status} warning={aa.warning} />;
}

function CompoundRow({ c, depth }: { c: BOMCompound; depth: number }) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <Row indent={depth} badge="Compound" name={c.name} id={c.id} status={c.status} warning={c.warning}
        open={open} onToggle={c.atomic_assets.length > 0 ? () => setOpen(o => !o) : undefined} />
      {open && c.atomic_assets.map(aa => <AARow key={aa.id} aa={aa} depth={depth + 1} />)}
    </div>
  );
}

function CompositeRow({ c, depth }: { c: BOMComposite; depth: number }) {
  const [open, setOpen] = useState(false);
  const hasKids = c.compounds.length > 0 || c.atomic_assets.length > 0;
  return (
    <div>
      <Row indent={depth} badge={`Composite · ${c.ui_backend_scope}`} name={c.name} id={c.id}
        status={c.status} warning={c.warning} open={open}
        onToggle={hasKids ? () => setOpen(o => !o) : undefined} />
      {open && (
        <>
          {c.compounds.map(cp => <CompoundRow key={cp.id} c={cp} depth={depth + 1} />)}
          {c.atomic_assets.map(aa => <AARow key={aa.id} aa={aa} depth={depth + 1} />)}
        </>
      )}
    </div>
  );
}

function ServiceRow({ s, depth }: { s: BOMCastleService; depth: number }) {
  const [open, setOpen] = useState(true);
  const hasKids = s.composites.length > 0 || s.compounds.length > 0 || s.atomic_assets.length > 0;
  return (
    <div>
      <Row indent={depth} badge="Service" name={s.name} id={s.id} status={s.status} warning={s.warning}
        open={open} onToggle={hasKids ? () => setOpen(o => !o) : undefined} />
      {open && (
        <>
          {s.composites.map(c => <CompositeRow key={c.id} c={c} depth={depth + 1} />)}
          {s.compounds.map(c => <CompoundRow key={c.id} c={c} depth={depth + 1} />)}
          {s.atomic_assets.map(aa => <AARow key={aa.id} aa={aa} depth={depth + 1} />)}
        </>
      )}
    </div>
  );
}

function UnitRow({ u, depth }: { u: BOMCastleUnit; depth: number }) {
  const [open, setOpen] = useState(true);
  return (
    <div>
      <Row indent={depth} badge="Unit" name={u.name} id={u.id} status={u.status} warning={u.warning}
        open={open} onToggle={u.castle_services.length > 0 ? () => setOpen(o => !o) : undefined} />
      {open && u.castle_services.map(s => <ServiceRow key={s.id} s={s} depth={depth + 1} />)}
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function BOMPage() {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();

  const [castles, setCastles] = useState<CastleOption[]>([]);
  const [selectedId, setSelectedId] = useState(id ?? '');
  const [bom, setBOM] = useState<BOMResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Populate castle dropdown
  useEffect(() => {
    fetch('/api/reports/castles')
      .then(r => r.json())
      .then((rows: unknown) =>
        setCastles(
          (rows as Record<string, string>[]).map(c => ({
            castle_record_id: c['castle_record_id'],
            castle_name: c['castle_name'],
            status: c['status'],
          })),
        ),
      )
      .catch(() => {});
  }, []);

  // Load BOM when URL param changes
  useEffect(() => {
    if (!id) return;
    setSelectedId(id);
    setLoading(true);
    setError(null);
    fetchBOM(id)
      .then(data => setBOM(data as BOMResult))
      .catch((err: unknown) => setError((err as Error).message))
      .finally(() => setLoading(false));
  }, [id]);

  function handleLoad() {
    const trimmed = selectedId.trim();
    if (trimmed) navigate(`/bom/${encodeURIComponent(trimmed)}`);
  }

  const unitCount = bom?.castle_units.length ?? 0;
  const serviceCount = bom?.castle_units.reduce((n, u) => n + u.castle_services.length, 0) ?? 0;

  return (
    <div>
      <div className="page-header">
        <div className="page-title">BOM Viewer</div>
        <div className="page-subtitle">Full Asset Bill of Materials — expand units and services to explore the hierarchy</div>
      </div>

      {/* Castle selector */}
      <div className="controls" style={{ marginBottom: '1.5rem' }}>
        <select
          className="filter-select"
          style={{ minWidth: 420, flex: 1, maxWidth: 600 }}
          value={selectedId}
          onChange={e => setSelectedId(e.target.value)}
        >
          <option value="">— select a castle —</option>
          {castles.map(c => (
            <option key={c.castle_record_id} value={c.castle_record_id}>
              {c.castle_name}
              {c.status !== 'Active' ? ` (${c.status})` : ''}
            </option>
          ))}
        </select>
        <button
          className="btn btn-primary"
          onClick={handleLoad}
          disabled={!selectedId.trim()}
        >
          Load BOM
        </button>
      </div>

      {error && <div className="error-box">{error}</div>}
      {loading && <div className="loading">Loading BOM…</div>}

      {bom && !loading && (
        <div className="panel">
          <div className="panel-header">
            <span>{bom.castle_name}</span>
            <span style={{ fontWeight: 400, color: '#6e7681', fontSize: '0.75rem' }}>
              {unitCount} units · {serviceCount} services · {bom.local_modifications.length} mods
            </span>
          </div>

          {/* Castle meta bar */}
          <div style={{
            padding: '0.75rem 1.1rem', borderBottom: '1px solid #21262d',
            display: 'flex', gap: '2rem', flexWrap: 'wrap', alignItems: 'center',
          }}>
            <div>
              <div style={{ fontSize: '0.68rem', color: '#6e7681', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 }}>Castle</div>
              <div style={{ fontFamily: 'monospace', fontSize: '0.78rem', color: '#8b949e' }}>{bom.castle_record_id}</div>
            </div>
            {bom.castle_type && (
              <div>
                <div style={{ fontSize: '0.68rem', color: '#6e7681', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 }}>Type</div>
                <div style={{ fontSize: '0.83rem' }}>{bom.castle_type.name}</div>
              </div>
            )}
            {bom.blueprint && (
              <div>
                <div style={{ fontSize: '0.68rem', color: '#6e7681', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 }}>Blueprint</div>
                <div style={{ fontSize: '0.83rem' }}>{bom.blueprint.name}</div>
              </div>
            )}
            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <StatusBadge status={bom.status} />
              {bom.warning && <span className="bom-warning">⚠ {bom.warning}</span>}
            </div>
          </div>

          {/* BOM tree */}
          <div className="bom-root">
            {bom.castle_units.length === 0 ? (
              <div className="empty-box" style={{ padding: '1rem 1.1rem' }}>No castle units recorded.</div>
            ) : (
              bom.castle_units.map(u => <UnitRow key={u.id} u={u} depth={0} />)
            )}
          </div>

          {/* Local Modifications */}
          {bom.local_modifications.length > 0 && (
            <div style={{ borderTop: '1px solid #21262d', padding: '0.6rem 1.1rem' }}>
              <div style={{ fontSize: '0.68rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#6e7681', marginBottom: '0.5rem' }}>
                Local Modifications ({bom.local_modifications.length})
              </div>
              {bom.local_modifications.map(mod => (
                <div key={mod.modification_id} style={{
                  display: 'flex', gap: '1rem', justifyContent: 'space-between',
                  alignItems: 'flex-start', padding: '0.4rem 0', borderBottom: '1px solid #21262d',
                }}>
                  <div>
                    <div style={{ fontWeight: 500, fontSize: '0.83rem' }}>{mod.modified_item}</div>
                    <div style={{ fontSize: '0.75rem', color: '#6e7681' }}>{mod.change_description}</div>
                    <div style={{ fontSize: '0.72rem', color: '#484f58', marginTop: 2 }}>
                      Recommendation: {mod.promotion_recommendation}
                    </div>
                  </div>
                  <StatusBadge status={mod.review_status} />
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
