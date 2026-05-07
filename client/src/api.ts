const BASE = '/api';

async function apiFetch<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`);
  if (!res.ok) throw new Error(`${res.status}: ${res.statusText}`);
  return res.json() as Promise<T>;
}

async function apiMutate<T>(
  method: string,
  path: string,
  body?: Record<string, unknown>,
): Promise<T> {
  const opts: RequestInit = { method };
  if (body !== undefined) {
    opts.headers = { 'Content-Type': 'application/json' };
    opts.body = JSON.stringify(body);
  }
  const res = await fetch(`${BASE}${path}`, opts);
  if (!res.ok) {
    let msg = `${res.status}: ${res.statusText}`;
    try {
      const j = (await res.json()) as { error?: string };
      if (j.error) msg = j.error;
    } catch { /* empty */ }
    throw new Error(msg);
  }
  if (res.status === 204) return undefined as T;
  try { return (await res.json()) as T; } catch { return undefined as T; }
}

export function fetchList(
  apiPath: string,
  params?: Record<string, string>,
): Promise<Record<string, unknown>[]> {
  const clean = Object.fromEntries(
    Object.entries(params ?? {}).filter(([, v]) => v !== undefined && v !== ''),
  );
  const qs = Object.keys(clean).length > 0 ? '?' + new URLSearchParams(clean).toString() : '';
  return apiFetch(`/${apiPath}${qs}`);
}

export function fetchById(
  apiPath: string,
  id: string,
): Promise<Record<string, unknown>> {
  return apiFetch(`/${apiPath}/${encodeURIComponent(id)}`);
}

export function fetchRelationship(
  apiPath: string,
  id: string,
  suffix: string,
): Promise<Record<string, unknown>[]> {
  return apiFetch(`/${apiPath}/${encodeURIComponent(id)}/${suffix}`);
}

export function fetchBOM(id: string): Promise<unknown> {
  return apiFetch(`/bom/${encodeURIComponent(id)}`);
}

export function fetchReport(
  reportPath: string,
  params?: Record<string, string>,
): Promise<unknown> {
  const clean = Object.fromEntries(
    Object.entries(params ?? {}).filter(([, v]) => v !== undefined && v !== ''),
  );
  const qs = Object.keys(clean).length > 0 ? '?' + new URLSearchParams(clean).toString() : '';
  return apiFetch(`/reports/${reportPath}${qs}`);
}

export function createEntity(
  apiPath: string,
  body: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  return apiMutate('POST', `/${apiPath}`, body);
}

export function updateEntity(
  apiPath: string,
  id: string,
  body: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  return apiMutate('PATCH', `/${apiPath}/${encodeURIComponent(id)}`, body);
}

export function archiveEntity(apiPath: string, id: string): Promise<void> {
  return apiMutate('DELETE', `/${apiPath}/${encodeURIComponent(id)}`);
}

export function addRelationship(
  apiPath: string,
  id: string,
  suffix: string,
  body: Record<string, unknown>,
): Promise<void> {
  return apiMutate('POST', `/${apiPath}/${encodeURIComponent(id)}/${suffix}`, body);
}

export function removeRelationship(
  apiPath: string,
  id: string,
  suffix: string,
  relId: string,
): Promise<void> {
  return apiMutate(
    'DELETE',
    `/${apiPath}/${encodeURIComponent(id)}/${suffix}/${encodeURIComponent(relId)}`,
  );
}

export function setCastleType(castleId: string, castleTypeId: string | null): Promise<void> {
  return apiMutate('PATCH', `/castles/${encodeURIComponent(castleId)}/castle-type`, {
    castle_type_id: castleTypeId,
  });
}

export function setCastleBlueprint(castleId: string, blueprintId: string | null): Promise<void> {
  return apiMutate('PATCH', `/castles/${encodeURIComponent(castleId)}/blueprint`, {
    blueprint_id: blueprintId,
  });
}

export function createLocalMod(
  castleId: string,
  body: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  return apiMutate('POST', `/castles/${encodeURIComponent(castleId)}/local-modifications`, body);
}

export function updateLocalMod(
  castleId: string,
  modId: string,
  body: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  return apiMutate(
    'PATCH',
    `/castles/${encodeURIComponent(castleId)}/local-modifications/${encodeURIComponent(modId)}`,
    body,
  );
}

export function deleteLocalMod(castleId: string, modId: string): Promise<void> {
  return apiMutate(
    'DELETE',
    `/castles/${encodeURIComponent(castleId)}/local-modifications/${encodeURIComponent(modId)}`,
  );
}

export function fetchDiagram(castleId: string): Promise<unknown> {
  return apiFetch(`/diagram/castle/${encodeURIComponent(castleId)}`);
}

export function fetchBOMImpact(entityType: string, entityId: string): Promise<unknown> {
  return apiFetch(
    `/bom/impact/${encodeURIComponent(entityType)}/${encodeURIComponent(entityId)}`,
  );
}

export function fetchRetrieval(params: Record<string, string>): Promise<unknown> {
  const qs = new URLSearchParams(params).toString();
  return apiFetch(`/retrieval/context${qs ? '?' + qs : ''}`);
}

export function fetchRetrievalForCastle(castleId: string): Promise<unknown> {
  return apiFetch(`/retrieval/castle/${encodeURIComponent(castleId)}`);
}

// ─── Demo / Settings ──────────────────────────────────────────────────────────

export interface DemoCounts {
  castles: number;
  castle_types: number;
  blueprints: number;
  castle_units: number;
  castle_services: number;
  composites: number;
  compounds: number;
  atomic_assets: number;
  local_modifications: number;
}

export interface DemoStatus {
  loaded: boolean;
  counts: DemoCounts;
}

export function fetchDemoStatus(): Promise<DemoStatus> {
  return apiFetch('/demo/status');
}

export function loadDemoData(): Promise<{ message: string; counts: DemoCounts }> {
  return apiMutate('POST', '/demo/load');
}

export function clearDemoData(): Promise<{ message: string }> {
  return apiMutate('POST', '/demo/clear');
}

export function clearAllData(): Promise<{ message: string }> {
  return apiMutate('POST', '/demo/clear-all');
}
