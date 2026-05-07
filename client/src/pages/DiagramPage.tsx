import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ReactFlow,
  Controls,
  MiniMap,
  Background,
  BackgroundVariant,
  useNodesState,
  useEdgesState,
  MarkerType,
  Handle,
  Position,
  type NodeProps,
  type Node,
  type Edge,
  type OnInit,
  type ReactFlowInstance,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import dagre from '@dagrejs/dagre';

// ── API response types ─────────────────────────────────────────────────────────

interface ApiNode {
  id: string;
  label: string;
  type: string;
  status: string;
  subLabel?: string | null;
}

interface ApiEdge {
  source: string;
  target: string;
}

interface DiagramResponse {
  castle_record_id: string;
  castle_name: string;
  nodes: ApiNode[];
  edges: ApiEdge[];
}

interface CastleOption {
  castle_record_id: string;
  castle_name: string;
  status: string;
}

// ── Styling config ─────────────────────────────────────────────────────────────

const NODE_STYLES: Record<string, { fill: string; stroke: string; badge: string }> = {
  Castle:        { fill: '#1a2f4e', stroke: '#4a9eff', badge: 'Castle' },
  CastleType:    { fill: '#132912', stroke: '#3fb950', badge: 'Type' },
  Blueprint:     { fill: '#251a38', stroke: '#9c6fff', badge: 'Blueprint' },
  CastleUnit:    { fill: '#172436', stroke: '#58a6ff', badge: 'Unit' },
  CastleService: { fill: '#2a1f0e', stroke: '#f0883e', badge: 'Service' },
  Composite:     { fill: '#121e12', stroke: '#56d364', badge: 'Composite' },
  Compound:      { fill: '#261525', stroke: '#db61a2', badge: 'Compound' },
  AtomicAsset:   { fill: '#0e1e2c', stroke: '#79c0ff', badge: 'Atom' },
  LocalMod:      { fill: '#2a1212', stroke: '#f85149', badge: 'Mod' },
};

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  Active:     { bg: '#0d2e1a', color: '#3fb950' },
  Draft:      { bg: '#1c2128', color: '#8b949e' },
  InReview:   { bg: '#2a220a', color: '#d29922' },
  Reusable:   { bg: '#0d2e2e', color: '#39c5cf' },
  Deprecated: { bg: '#2d1b1b', color: '#f85149' },
  Archived:   { bg: '#2a1212', color: '#a0403e' },
};

const DEPTH_TYPES: Record<number, Set<string>> = {
  1: new Set(['Castle', 'CastleType', 'Blueprint']),
  2: new Set(['Castle', 'CastleType', 'Blueprint', 'CastleUnit', 'LocalMod']),
  3: new Set(['Castle', 'CastleType', 'Blueprint', 'CastleUnit', 'CastleService', 'LocalMod']),
  4: new Set(['Castle', 'CastleType', 'Blueprint', 'CastleUnit', 'CastleService', 'Composite', 'Compound', 'LocalMod']),
  5: new Set(['Castle', 'CastleType', 'Blueprint', 'CastleUnit', 'CastleService', 'Composite', 'Compound', 'AtomicAsset', 'LocalMod']),
};

const DEPTH_OPTIONS = [
  { value: 1, label: 'Level 1 — Castle + Type + Blueprint' },
  { value: 2, label: 'Level 2 — + Castle Units + Local Mods' },
  { value: 3, label: 'Level 3 — + Castle Services' },
  { value: 4, label: 'Level 4 — + Composites + Compounds' },
  { value: 5, label: 'Level 5 — Full detail (+ Atomic Assets)' },
];

const TYPE_TO_ROUTE: Record<string, string> = {
  Castle: 'castles',
  CastleType: 'castle-types',
  Blueprint: 'blueprints',
  CastleUnit: 'castle-units',
  CastleService: 'castle-services',
  Composite: 'composites',
  Compound: 'compounds',
  AtomicAsset: 'atomic-assets',
};

const SUBLABEL_NAME: Record<string, string> = {
  CastleService: 'Capability',
  AtomicAsset: 'Asset Type',
  Composite: 'Scope',
  LocalMod: 'Recommendation',
};

const DETAIL_SKIP = new Set([
  'castle_type_id', 'blueprint_id', 'created_at', 'updated_at',
  'castle_record_id', 'castle_unit_id', 'castle_service_id',
  'composite_id', 'compound_id', 'atomic_asset_id',
]);

// ── Dagre layout ───────────────────────────────────────────────────────────────

const NODE_W = 210;
const NODE_H = 66;

function computeLayout(apiNodes: ApiNode[], apiEdges: ApiEdge[]): Map<string, { x: number; y: number }> {
  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({ rankdir: 'TB', nodesep: 50, ranksep: 70, marginx: 20, marginy: 20 });
  apiNodes.forEach(n => g.setNode(n.id, { width: NODE_W, height: NODE_H }));
  apiEdges.forEach(e => {
    try { g.setEdge(e.source, e.target); } catch { /* skip invalid edges */ }
  });
  dagre.layout(g);
  const out = new Map<string, { x: number; y: number }>();
  apiNodes.forEach(n => {
    const p = g.node(n.id);
    if (p) out.set(n.id, { x: p.x - NODE_W / 2, y: p.y - NODE_H / 2 });
  });
  return out;
}

// ── Custom node ────────────────────────────────────────────────────────────────

type NodeData = {
  label: string;
  entityType: string;
  status: string;
  subLabel?: string | null;
};

function EntityNode({ data, selected }: NodeProps) {
  const d = data as NodeData;
  const s = NODE_STYLES[d.entityType] ?? NODE_STYLES['Castle'];
  const sc = STATUS_COLORS[d.status] ?? STATUS_COLORS['Draft'];

  return (
    <>
      <Handle
        type="target"
        position={Position.Top}
        style={{ background: s.stroke, border: 'none', width: 8, height: 8 }}
      />
      <div
        style={{
          background: s.fill,
          border: `2px solid ${selected ? '#fff' : s.stroke}`,
          borderRadius: 8,
          padding: '7px 11px',
          width: NODE_W - 4,
          boxShadow: selected ? `0 0 0 3px ${s.stroke}66, 0 4px 20px ${s.stroke}44` : `0 2px 8px #00000044`,
          transition: 'box-shadow 0.15s, border-color 0.15s',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: d.subLabel ? 3 : 0 }}>
          <span style={{
            fontSize: '0.58rem', fontWeight: 700, color: s.stroke,
            background: `${s.stroke}1a`, border: `1px solid ${s.stroke}55`,
            borderRadius: 3, padding: '1px 5px', flexShrink: 0, letterSpacing: '0.03em',
          }}>
            {s.badge}
          </span>
          <span style={{
            fontSize: '0.8rem', color: '#e6edf3', fontWeight: 600,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', lineHeight: 1.25,
          }}>
            {d.label}
          </span>
          <span style={{
            marginLeft: 'auto', flexShrink: 0,
            fontSize: '0.62rem', fontWeight: 600, padding: '1px 6px',
            background: sc.bg, color: sc.color,
            borderRadius: 8, border: `1px solid ${sc.color}44`,
          }}>
            {d.status}
          </span>
        </div>
        {d.subLabel && (
          <div style={{
            fontSize: '0.68rem', color: '#7d8590',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {d.subLabel}
          </div>
        )}
      </div>
      <Handle
        type="source"
        position={Position.Bottom}
        style={{ background: s.stroke, border: 'none', width: 8, height: 8 }}
      />
    </>
  );
}

const nodeTypes = { entity: EntityNode };

// ── Detail panel ───────────────────────────────────────────────────────────────

function DetailPanel({ node, onClose }: { node: ApiNode | null; onClose: () => void }) {
  const [details, setDetails] = useState<Record<string, unknown> | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  useEffect(() => {
    if (!node) { setDetails(null); return; }
    const route = TYPE_TO_ROUTE[node.type];
    if (!route) { setDetails(null); return; }
    setLoadingDetails(true);
    setDetails(null);
    fetch(`/api/${route}/${encodeURIComponent(node.id)}`)
      .then(r => (r.ok ? r.json() : null))
      .then((d: Record<string, unknown> | null) => setDetails(d))
      .catch(() => setDetails(null))
      .finally(() => setLoadingDetails(false));
  }, [node?.id, node?.type]);

  if (!node) return null;

  const s = NODE_STYLES[node.type] ?? NODE_STYLES['Castle'];
  const sc = STATUS_COLORS[node.status] ?? STATUS_COLORS['Draft'];
  const route = TYPE_TO_ROUTE[node.type];

  const extraFields = details
    ? Object.entries(details).filter(
        ([k, v]) =>
          !DETAIL_SKIP.has(k) &&
          k !== 'name' &&
          k !== 'status' &&
          v !== null &&
          v !== undefined &&
          v !== '',
      )
    : [];

  return (
    <div
      style={{
        position: 'absolute', top: 0, right: 0, width: 300, height: '100%',
        background: '#0d1117', borderLeft: `2px solid ${s.stroke}44`,
        zIndex: 10, display: 'flex', flexDirection: 'column',
        boxShadow: '-4px 0 20px #00000066',
      }}
    >
      {/* Header */}
      <div style={{
        padding: '14px 16px 12px',
        borderBottom: `1px solid ${s.stroke}33`,
        background: `${s.fill}cc`,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ flex: 1, minWidth: 0, marginRight: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              <span style={{
                fontSize: '0.6rem', fontWeight: 700, color: s.stroke,
                background: `${s.stroke}22`, border: `1px solid ${s.stroke}55`,
                borderRadius: 3, padding: '1px 6px',
              }}>
                {node.type}
              </span>
              <span style={{
                fontSize: '0.68rem', fontWeight: 600, padding: '1px 8px',
                background: sc.bg, color: sc.color, borderRadius: 8,
                border: `1px solid ${sc.color}44`,
              }}>
                {node.status}
              </span>
            </div>
            <div style={{
              fontSize: '0.95rem', fontWeight: 700, color: '#f0f6fc',
              lineHeight: 1.3, wordBreak: 'break-word',
            }}>
              {node.label}
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none', border: '1px solid #30363d', color: '#8b949e',
              cursor: 'pointer', fontSize: '1rem', padding: '2px 8px',
              borderRadius: 4, lineHeight: 1, flexShrink: 0,
            }}
          >
            ×
          </button>
        </div>
      </div>

      {/* Scrollable body */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '14px 16px' }}>
        {/* ID */}
        <Field label="ID">
          <span style={{ fontFamily: 'monospace', fontSize: '0.72rem', color: '#8b949e', wordBreak: 'break-all' }}>
            {node.id}
          </span>
        </Field>

        {/* SubLabel */}
        {node.subLabel && (
          <Field label={SUBLABEL_NAME[node.type] ?? 'Details'}>
            {node.subLabel}
          </Field>
        )}

        {/* Extra fields from entity API */}
        {loadingDetails && (
          <div style={{ fontSize: '0.75rem', color: '#6e7681', marginTop: 8 }}>Loading details…</div>
        )}
        {extraFields.length > 0 && (
          <>
            <div style={{ height: 1, background: '#21262d', margin: '10px 0' }} />
            {extraFields.map(([k, v]) => (
              <Field key={k} label={k.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}>
                {String(v)}
              </Field>
            ))}
          </>
        )}
      </div>

      {/* Footer: View in app */}
      {route && (
        <div style={{ padding: '12px 16px', borderTop: '1px solid #21262d' }}>
          <a
            href={`/${route}/${node.id}`}
            style={{
              display: 'block', textAlign: 'center', padding: '7px 0',
              background: `${s.stroke}18`, border: `1px solid ${s.stroke}66`,
              borderRadius: 6, color: s.stroke, fontSize: '0.8rem',
              textDecoration: 'none', fontWeight: 600,
              transition: 'background 0.15s',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = `${s.stroke}30`)}
            onMouseLeave={e => (e.currentTarget.style.background = `${s.stroke}18`)}
          >
            View Full Details →
          </a>
        </div>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{
        fontSize: '0.62rem', color: '#6e7681', textTransform: 'uppercase',
        letterSpacing: '0.06em', marginBottom: 3, fontWeight: 600,
      }}>
        {label}
      </div>
      <div style={{ fontSize: '0.8rem', color: '#cdd9e5', lineHeight: 1.4 }}>
        {children}
      </div>
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────

export default function DiagramPage() {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();

  const [castles, setCastles] = useState<CastleOption[]>([]);
  const [selectedId, setSelectedId] = useState(id ?? '');
  const [depth, setDepth] = useState(3);
  const [apiData, setApiData] = useState<DiagramResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<ApiNode | null>(null);
  const rfInstance = useRef<ReactFlowInstance | null>(null);

  const [nodes, setNodes, onNodesChange] = useNodesState<Node<NodeData>>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

  // Load castle dropdown
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

  // Fetch diagram data when URL param changes
  useEffect(() => {
    if (!id) return;
    setSelectedId(id);
    setLoading(true);
    setError(null);
    setApiData(null);
    setSelectedNode(null);
    fetch(`/api/diagram/castle/${encodeURIComponent(id)}`)
      .then(r => {
        if (!r.ok) throw new Error(`${r.status}: ${r.statusText}`);
        return r.json() as Promise<DiagramResponse>;
      })
      .then(d => setApiData(d))
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  // Compute full-graph layout once
  const allPositions = useMemo(() => {
    if (!apiData) return new Map<string, { x: number; y: number }>();
    return computeLayout(apiData.nodes, apiData.edges);
  }, [apiData]);

  // Build React Flow nodes/edges from current depth + positions
  useEffect(() => {
    if (!apiData) { setNodes([]); setEdges([]); return; }

    const allowed = DEPTH_TYPES[depth];
    const visible = new Set(apiData.nodes.filter(n => allowed.has(n.type)).map(n => n.id));

    const flowNodes: Node<NodeData>[] = apiData.nodes
      .filter(n => visible.has(n.id))
      .map(n => ({
        id: n.id,
        type: 'entity',
        position: allPositions.get(n.id) ?? { x: 0, y: 0 },
        data: { label: n.label, entityType: n.type, status: n.status, subLabel: n.subLabel },
      }));

    const flowEdges: Edge[] = apiData.edges
      .filter(e => visible.has(e.source) && visible.has(e.target))
      .map(e => ({
        id: `${e.source}→${e.target}`,
        source: e.source,
        target: e.target,
        type: 'smoothstep',
        markerEnd: { type: MarkerType.ArrowClosed, color: '#4a9eff66' },
        style: { stroke: '#4a9eff55', strokeWidth: 1.5 },
      }));

    setNodes(flowNodes);
    setEdges(flowEdges);

    // Refit the view after nodes settle
    setTimeout(() => rfInstance.current?.fitView({ padding: 0.18, duration: 400 }), 60);
  }, [apiData, depth, allPositions]);

  const handleLoad = useCallback(() => {
    const trimmed = selectedId.trim();
    if (trimmed) navigate(`/diagram/${encodeURIComponent(trimmed)}`);
  }, [selectedId, navigate]);

  const handleNodeClick = useCallback(
    (_evt: React.MouseEvent, node: Node) => {
      const apiNode = apiData?.nodes.find(n => n.id === node.id) ?? null;
      setSelectedNode(apiNode);
    },
    [apiData],
  );

  const handlePaneClick = useCallback(() => setSelectedNode(null), []);

  const handleInit: OnInit = useCallback(instance => {
    rfInstance.current = instance;
  }, []);

  return (
    <div>
      <div className="page-header">
        <div className="page-title">Relationship Diagram</div>
        <div className="page-subtitle">
          Interactive entity graph — click nodes for details, drag to reposition, scroll to zoom
        </div>
      </div>

      {/* Controls bar */}
      <div className="controls" style={{ marginBottom: '1.25rem' }}>
        <select
          className="filter-select"
          style={{ minWidth: 380 }}
          value={selectedId}
          onChange={e => setSelectedId(e.target.value)}
        >
          <option value="">— select a castle —</option>
          {castles.map(c => (
            <option key={c.castle_record_id} value={c.castle_record_id}>
              {c.castle_name}
            </option>
          ))}
        </select>

        <select
          className="filter-select"
          value={depth}
          onChange={e => setDepth(Number(e.target.value))}
        >
          {DEPTH_OPTIONS.map(o => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>

        <button
          className="btn btn-primary"
          onClick={handleLoad}
          disabled={!selectedId.trim()}
        >
          Load Diagram
        </button>
      </div>

      {error && <div className="error-box">{error}</div>}
      {loading && <div className="loading">Fetching relationships from database…</div>}

      {/* Interactive graph */}
      {apiData && !loading && (
        <div className="panel" style={{ overflow: 'hidden' }}>
          <div className="panel-header">
            <span>{apiData.castle_name}</span>
            <span style={{ fontWeight: 400, fontSize: '0.72rem', color: '#6e7681' }}>
              {nodes.length} nodes · {edges.length} edges · depth {depth}
            </span>
          </div>

          {/* Graph area with detail panel overlay */}
          <div style={{ position: 'relative', height: 620 }}>
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onNodeClick={handleNodeClick}
              onPaneClick={handlePaneClick}
              onInit={handleInit}
              nodeTypes={nodeTypes}
              fitView
              fitViewOptions={{ padding: 0.18 }}
              style={{ background: '#0d1117' }}
              minZoom={0.2}
              maxZoom={2.5}
            >
              <Controls
                style={{
                  background: '#161b22',
                  border: '1px solid #30363d',
                  borderRadius: 6,
                  boxShadow: '0 2px 8px #00000044',
                }}
              />
              <MiniMap
                style={{ background: '#161b22', border: '1px solid #30363d', borderRadius: 6 }}
                nodeColor={n => NODE_STYLES[(n.data as NodeData).entityType]?.stroke ?? '#4a9eff'}
                maskColor="#0d111766"
              />
              <Background variant={BackgroundVariant.Dots} color="#21262d" gap={18} size={1} />
            </ReactFlow>

            {/* Slide-in detail panel */}
            <DetailPanel node={selectedNode} onClose={() => setSelectedNode(null)} />
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="panel" style={{ marginTop: '1rem' }}>
        <div className="panel-header">Node types</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', padding: '0.75rem 1rem' }}>
          {Object.entries(NODE_STYLES).map(([type, s]) => (
            <div
              key={type}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.4rem',
                background: s.fill, border: `1px solid ${s.stroke}`,
                borderRadius: 4, padding: '3px 10px', fontSize: '0.75rem', color: '#e6edf3',
              }}
            >
              <span style={{ fontSize: '0.7rem', color: s.stroke, fontWeight: 600 }}>{s.badge}</span>
              <span>{type}</span>
            </div>
          ))}
        </div>
        <div style={{ padding: '0 1rem 0.75rem', fontSize: '0.73rem', color: '#6e7681' }}>
          Click any node to view its details · drag nodes to reposition · scroll to zoom ·
          use the depth selector above to control visible hierarchy layers
        </div>
      </div>
    </div>
  );
}
