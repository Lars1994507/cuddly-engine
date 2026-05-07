import {
  isAssetType,
  isStatus,
  isUiBackendScope,
  ASSET_TYPES,
  STATUSES,
  UI_BACKEND_SCOPES,
} from '../src/lib/enums';

describe('isAssetType', () => {
  it('returns true for every valid asset type', () => {
    for (const type of ASSET_TYPES) {
      expect(isAssetType(type)).toBe(true);
    }
  });

  it('returns false for unrecognised strings', () => {
    expect(isAssetType('Component')).toBe(false);
    expect(isAssetType('helper')).toBe(false);
    expect(isAssetType('HelperFunctions')).toBe(false);
    expect(isAssetType('')).toBe(false);
  });

  it('is case-sensitive', () => {
    expect(isAssetType('helperfunction')).toBe(false);
    expect(isAssetType('VALIDATOR')).toBe(false);
    expect(isAssetType('enum')).toBe(false);
  });

  it('returns false for non-string values', () => {
    expect(isAssetType(null)).toBe(false);
    expect(isAssetType(undefined)).toBe(false);
    expect(isAssetType(42)).toBe(false);
    expect(isAssetType(true)).toBe(false);
    expect(isAssetType({})).toBe(false);
    expect(isAssetType(['HelperFunction'])).toBe(false);
  });
});

describe('isStatus', () => {
  it('returns true for every valid status', () => {
    for (const status of STATUSES) {
      expect(isStatus(status)).toBe(true);
    }
  });

  it('returns false for unrecognised strings', () => {
    expect(isStatus('Published')).toBe(false);
    expect(isStatus('Enabled')).toBe(false);
    expect(isStatus('Active ')).toBe(false); // trailing space
    expect(isStatus(' Active')).toBe(false); // leading space
    expect(isStatus('')).toBe(false);
  });

  it('is case-sensitive', () => {
    expect(isStatus('active')).toBe(false);
    expect(isStatus('DRAFT')).toBe(false);
    expect(isStatus('inreview')).toBe(false);
    expect(isStatus('archived')).toBe(false);
  });

  it('returns false for non-string values', () => {
    expect(isStatus(null)).toBe(false);
    expect(isStatus(undefined)).toBe(false);
    expect(isStatus(0)).toBe(false);
    expect(isStatus(false)).toBe(false);
    expect(isStatus({})).toBe(false);
  });
});

describe('isUiBackendScope', () => {
  it('returns true for every valid scope', () => {
    for (const scope of UI_BACKEND_SCOPES) {
      expect(isUiBackendScope(scope)).toBe(true);
    }
  });

  it('returns false for unrecognised strings', () => {
    expect(isUiBackendScope('Frontend')).toBe(false);
    expect(isUiBackendScope('Server')).toBe(false);
    expect(isUiBackendScope('')).toBe(false);
    expect(isUiBackendScope('UI Backend')).toBe(false);
  });

  it('is case-sensitive', () => {
    expect(isUiBackendScope('ui')).toBe(false);
    expect(isUiBackendScope('backend')).toBe(false);
    expect(isUiBackendScope('both')).toBe(false);
  });

  it('returns false for non-string values', () => {
    expect(isUiBackendScope(null)).toBe(false);
    expect(isUiBackendScope(undefined)).toBe(false);
    expect(isUiBackendScope(1)).toBe(false);
    expect(isUiBackendScope(false)).toBe(false);
  });
});
