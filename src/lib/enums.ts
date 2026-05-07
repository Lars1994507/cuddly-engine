export const ASSET_TYPES = [
  'HelperFunction',
  'Validator',
  'Constant',
  'Type',
  'Enum',
  'UIElement',
  'FormattingFunction',
  'QueryHelper',
  'PermissionCheck',
  'LogicBlock',
] as const;

export type AssetType = (typeof ASSET_TYPES)[number];

export const STATUSES = [
  'Draft',
  'Active',
  'Deprecated',
  'Archived',
  'InReview',
  'Reusable',
] as const;

export type Status = (typeof STATUSES)[number];

export const UI_BACKEND_SCOPES = ['UI', 'Backend', 'Both'] as const;
export type UiBackendScope = (typeof UI_BACKEND_SCOPES)[number];

export function isAssetType(v: unknown): v is AssetType {
  return ASSET_TYPES.includes(v as AssetType);
}

export function isStatus(v: unknown): v is Status {
  return STATUSES.includes(v as Status);
}

export function isUiBackendScope(v: unknown): v is UiBackendScope {
  return UI_BACKEND_SCOPES.includes(v as UiBackendScope);
}
