import db from '../lib/db';
import { createAtomicAsset } from '../entities/atomicAsset';
import { createCompound, addAtomicAssetToCompound } from '../entities/compound';
import {
  createComposite,
  addCompoundToComposite,
  addAtomicAssetToComposite,
} from '../entities/composite';
import { createCastleService, addCompositeToService } from '../entities/castleService';
import { createCastleUnit, addServiceToUnit } from '../entities/castleUnit';
import {
  createBlueprint,
  addCastleUnitToBlueprint,
  addCastleServiceToBlueprint,
  addCompositeToBlueprint,
} from '../entities/blueprint';
import {
  createCastleType,
  addBlueprintToCastleType,
  addCastleUnitToCastleType,
  addCastleServiceToCastleType,
} from '../entities/castleType';
import {
  createCastle,
  addCastleUnitToCastle,
  addCastleServiceToCastle,
  createLocalModification,
} from '../entities/castle';

export async function clearAll() {
  // Delete entity tables in dependency order; ON DELETE CASCADE handles junction tables
  await db.query('DELETE FROM "Castle"');
  await db.query('DELETE FROM "CastleType"');
  await db.query('DELETE FROM "Blueprint"');
  await db.query('DELETE FROM "CastleUnit"');
  await db.query('DELETE FROM "CastleService"');
  await db.query('DELETE FROM "Composite"');
  await db.query('DELETE FROM "Compound"');
  await db.query('DELETE FROM "AtomicAsset"');
}

export async function seed() {
  await clearAll();

  // --- Step 1: Atomic Assets ---

  await createAtomicAsset({
    atomic_asset_id: 'AA-INVENTORY-STATUS-ENUM-V001',
    name: 'InventoryStatusEnum',
    asset_type: 'Enum',
    description: 'Enumeration of inventory status values: InStock, LowStock, OutOfStock, OnOrder',
    code_location: 'src/enums/inventoryStatus.ts',
    version: '1.0.0',
    status: 'Active',
  });

  await createAtomicAsset({
    atomic_asset_id: 'AA-WAREHOUSE-LOCATION-TYPE-V001',
    name: 'WarehouseLocationType',
    asset_type: 'Type',
    description: 'TypeScript type for warehouse location — zone, aisle, bin, and shelf identifiers',
    code_location: 'src/types/warehouseLocation.ts',
    version: '1.0.0',
    status: 'Active',
  });

  await createAtomicAsset({
    atomic_asset_id: 'AA-FORMAT-QUANTITY-V001',
    name: 'formatQuantity()',
    asset_type: 'FormattingFunction',
    description: 'Formats quantity numbers with units and decimal precision for display',
    code_location: 'src/utils/formatQuantity.ts',
    version: '1.0.0',
    status: 'Active',
  });

  await createAtomicAsset({
    atomic_asset_id: 'AA-VALIDATE-POSITIVE-NUMBER-V001',
    name: 'validatePositiveNumber()',
    asset_type: 'Validator',
    description: 'Validates that a value is a positive number; handles decimals and edge cases',
    code_location: 'src/validators/validatePositiveNumber.ts',
    version: '1.0.0',
    status: 'Active',
  });

  await createAtomicAsset({
    atomic_asset_id: 'AA-CAN-ADJUST-INVENTORY-V001',
    name: 'canAdjustInventory',
    asset_type: 'PermissionCheck',
    description: 'Permission check — returns true if the current user may perform inventory adjustments',
    code_location: 'src/permissions/canAdjustInventory.ts',
    version: '1.0.0',
    status: 'Active',
  });

  await createAtomicAsset({
    atomic_asset_id: 'AA-STOCK-STATUS-BADGE-V001',
    name: 'StockStatusBadge',
    asset_type: 'UIElement',
    description: 'Small UI badge component that displays stock status with color coding',
    code_location: 'src/components/StockStatusBadge.tsx',
    version: '1.0.0',
    status: 'Active',
  });

  await createAtomicAsset({
    atomic_asset_id: 'AA-INVENTORY-PERMISSION-CONSTANT-V001',
    name: 'InventoryPermissionConstant',
    asset_type: 'Constant',
    description: 'Constant strings for inventory permission keys used across role checks',
    code_location: 'src/constants/inventoryPermissions.ts',
    version: '1.0.0',
    status: 'Active',
  });

  // --- Step 2: Compounds ---

  await createCompound({
    compound_id: 'CMPD-DATE-RANGE-FILTER-V001',
    name: 'Date Range Filter Compound',
    description: 'Reusable date range filter with start/end pickers and status-based filtering',
    version: '1.0.0',
    status: 'Active',
  });
  await addAtomicAssetToCompound('CMPD-DATE-RANGE-FILTER-V001', 'AA-INVENTORY-STATUS-ENUM-V001');

  await createCompound({
    compound_id: 'CMPD-ROLE-CHECK-V001',
    name: 'Role Check Compound',
    description: 'Combines permission constant lookup, role evaluation, and access decision helper',
    version: '1.0.0',
    status: 'Active',
    testing_notes: 'Test with each user role: Admin, Manager, Viewer, WarehouseSupervisor',
  });
  await addAtomicAssetToCompound('CMPD-ROLE-CHECK-V001', 'AA-CAN-ADJUST-INVENTORY-V001');
  await addAtomicAssetToCompound('CMPD-ROLE-CHECK-V001', 'AA-INVENTORY-PERMISSION-CONSTANT-V001');

  await createCompound({
    compound_id: 'CMPD-QUANTITY-VALIDATION-V001',
    name: 'Quantity Validation Compound',
    description:
      'Validates positive number input, handles decimal precision, and formats output for quantity adjustment operations',
    version: '1.0.0',
    status: 'Active',
    testing_notes: 'Test edge cases: zero, negative, non-numeric, very large numbers',
  });
  await addAtomicAssetToCompound('CMPD-QUANTITY-VALIDATION-V001', 'AA-VALIDATE-POSITIVE-NUMBER-V001');
  await addAtomicAssetToCompound('CMPD-QUANTITY-VALIDATION-V001', 'AA-FORMAT-QUANTITY-V001');
  await addAtomicAssetToCompound('CMPD-QUANTITY-VALIDATION-V001', 'AA-INVENTORY-STATUS-ENUM-V001');

  await createCompound({
    compound_id: 'CMPD-PAGINATION-V001',
    name: 'Pagination Compound',
    description: 'Reusable pagination logic with page size, offset, and warehouse-aware navigation',
    version: '1.0.0',
    status: 'Active',
  });
  await addAtomicAssetToCompound('CMPD-PAGINATION-V001', 'AA-WAREHOUSE-LOCATION-TYPE-V001');

  await createCompound({
    compound_id: 'CMPD-STOCK-STATUS-FILTER-V001',
    name: 'Stock Status Filter Compound',
    description: 'Filter compound combining inventory status enum values with visual badge display',
    version: '1.0.0',
    status: 'Active',
  });
  await addAtomicAssetToCompound('CMPD-STOCK-STATUS-FILTER-V001', 'AA-STOCK-STATUS-BADGE-V001');
  await addAtomicAssetToCompound('CMPD-STOCK-STATUS-FILTER-V001', 'AA-INVENTORY-STATUS-ENUM-V001');

  // --- Step 3: Composites ---

  await createComposite({
    composite_id: 'COMP-INVENTORY-TABLE-V001',
    name: 'Inventory Table Composite',
    description:
      'Full data table with search, date range filter, stock status filter, pagination, badges, and row actions',
    version: '1.0.0',
    ui_backend_scope: 'Both',
    status: 'Active',
  });
  await addCompoundToComposite('COMP-INVENTORY-TABLE-V001', 'CMPD-DATE-RANGE-FILTER-V001');
  await addCompoundToComposite('COMP-INVENTORY-TABLE-V001', 'CMPD-STOCK-STATUS-FILTER-V001');
  await addCompoundToComposite('COMP-INVENTORY-TABLE-V001', 'CMPD-PAGINATION-V001');
  await addAtomicAssetToComposite('COMP-INVENTORY-TABLE-V001', 'AA-STOCK-STATUS-BADGE-V001');

  await createComposite({
    composite_id: 'COMP-ITEM-DETAIL-PAGE-V001',
    name: 'Item Detail Page Composite',
    description: 'Full item detail view with quantity display, status badge, and location information',
    version: '1.0.0',
    ui_backend_scope: 'Both',
    status: 'Active',
  });
  await addCompoundToComposite('COMP-ITEM-DETAIL-PAGE-V001', 'CMPD-QUANTITY-VALIDATION-V001');

  await createComposite({
    composite_id: 'COMP-WAREHOUSE-LOCATION-SELECTOR-V001',
    name: 'Warehouse Location Selector Composite',
    description:
      'UI component for selecting warehouse zone, aisle, bin, and shelf with type-safe location handling',
    version: '1.0.0',
    ui_backend_scope: 'UI',
    status: 'Active',
  });
  await addAtomicAssetToComposite(
    'COMP-WAREHOUSE-LOCATION-SELECTOR-V001',
    'AA-WAREHOUSE-LOCATION-TYPE-V001',
  );

  await createComposite({
    composite_id: 'COMP-QUANTITY-ADJUSTMENT-DRAWER-V001',
    name: 'Quantity Adjustment Drawer Composite',
    description:
      'Drawer layout with quantity input, reason selector, approval check, and audit log trigger',
    version: '1.0.0',
    ui_backend_scope: 'Both',
    status: 'Active',
  });
  await addCompoundToComposite('COMP-QUANTITY-ADJUSTMENT-DRAWER-V001', 'CMPD-QUANTITY-VALIDATION-V001');
  await addCompoundToComposite('COMP-QUANTITY-ADJUSTMENT-DRAWER-V001', 'CMPD-ROLE-CHECK-V001');
  await addAtomicAssetToComposite(
    'COMP-QUANTITY-ADJUSTMENT-DRAWER-V001',
    'AA-CAN-ADJUST-INVENTORY-V001',
  );

  await createComposite({
    composite_id: 'COMP-INVENTORY-DASHBOARD-WIDGET-V001',
    name: 'Inventory Dashboard Widget Composite',
    description:
      'Summary dashboard widget with stock status distribution, low-stock alerts, and quick filters',
    version: '1.0.0',
    ui_backend_scope: 'UI',
    status: 'Active',
  });
  await addCompoundToComposite(
    'COMP-INVENTORY-DASHBOARD-WIDGET-V001',
    'CMPD-STOCK-STATUS-FILTER-V001',
  );

  // --- Step 4: Castle Services ---

  await createCastleService({
    castle_service_id: 'CS-AUTH-V001',
    name: 'Auth Castle Service',
    capability:
      'Handles authentication — login, logout, session management, and token validation',
    backend_modules: ['auth.module.ts', 'session.service.ts', 'token.service.ts'],
    api_contracts: 'POST /auth/login, POST /auth/logout, GET /auth/me',
    database_interactions: 'Users, Sessions tables',
    status: 'Active',
  });

  await createCastleService({
    castle_service_id: 'CS-PERMISSION-V001',
    name: 'Permission Castle Service',
    capability:
      'Manages role-based access control — evaluates permissions for all inventory operations',
    backend_modules: ['permission.module.ts', 'role.service.ts'],
    api_contracts: 'GET /permissions/check, GET /roles',
    database_interactions: 'Roles, Permissions, UserRoles tables',
    status: 'Active',
  });

  await createCastleService({
    castle_service_id: 'CS-AUDIT-LOG-V001',
    name: 'Audit Log Castle Service',
    capability:
      'Records all significant events — stock adjustments, user changes, admin actions — for compliance',
    backend_modules: ['audit.module.ts', 'audit-log.service.ts'],
    api_contracts: 'POST /audit/log, GET /audit/events',
    database_interactions: 'AuditLogs table',
    status: 'Active',
  });

  await createCastleService({
    castle_service_id: 'CS-INVENTORY-V001',
    name: 'Inventory Castle Service',
    capability:
      'Manages inventory item records including API routes, schema, validation, and CRUD operations',
    backend_modules: [
      'inventory.module.ts',
      'inventory.service.ts',
      'inventory.controller.ts',
    ],
    api_contracts:
      'GET/POST/PUT/DELETE /inventory/items, GET /inventory/items/:id',
    database_interactions: 'Items, InventoryHistory tables',
    status: 'Active',
  });
  await addCompositeToService('CS-INVENTORY-V001', 'COMP-INVENTORY-TABLE-V001');
  await addCompositeToService('CS-INVENTORY-V001', 'COMP-ITEM-DETAIL-PAGE-V001');

  await createCastleService({
    castle_service_id: 'CS-WAREHOUSE-LOCATION-V001',
    name: 'Warehouse Location Castle Service',
    capability:
      'Manages warehouse location records including area structure, bin/shelf/zone logic',
    backend_modules: ['warehouse.module.ts', 'location.service.ts'],
    api_contracts: 'GET/POST/PUT /warehouse/locations, GET /warehouse/zones',
    database_interactions: 'WarehouseLocations, Zones tables',
    status: 'Active',
  });
  await addCompositeToService('CS-WAREHOUSE-LOCATION-V001', 'COMP-WAREHOUSE-LOCATION-SELECTOR-V001');

  await createCastleService({
    castle_service_id: 'CS-STOCK-ADJUSTMENT-V001',
    name: 'Stock Adjustment Castle Service',
    capability:
      'Manages quantity rules, approval thresholds, and adjustment history for stock changes',
    backend_modules: [
      'stock-adjustment.module.ts',
      'adjustment.service.ts',
      'approval.service.ts',
    ],
    api_contracts:
      'POST /stock/adjust, GET /stock/adjustments, GET /stock/adjustments/:id',
    database_interactions: 'StockAdjustments, ApprovalQueue tables',
    permission_rules:
      'canAdjustInventory required; supervisor approval above threshold',
    status: 'Active',
  });
  await addCompositeToService('CS-STOCK-ADJUSTMENT-V001', 'COMP-QUANTITY-ADJUSTMENT-DRAWER-V001');

  await createCastleService({
    castle_service_id: 'CS-REPORTING-V001',
    name: 'Reporting Castle Service',
    capability:
      'Generates stock reports, reconciliation summaries, and export views for inventory management',
    backend_modules: ['reporting.module.ts', 'report.service.ts', 'export.service.ts'],
    api_contracts:
      'GET /reports/stock, GET /reports/reconciliation, GET /reports/export',
    database_interactions: 'Reads from Items, StockAdjustments, WarehouseLocations',
    status: 'Active',
  });
  await addCompositeToService('CS-REPORTING-V001', 'COMP-INVENTORY-DASHBOARD-WIDGET-V001');

  // --- Step 5: Castle Units ---

  await createCastleUnit({
    castle_unit_id: 'CU-WAREHOUSING-INVENTORY-V001',
    name: 'Warehousing and Inventory Castle Unit',
    description:
      'Core unit for all inventory operations — item management, warehouse locations, and stock adjustments',
    permission_scope: 'inventory:read, inventory:write, stock:adjust, warehouse:read',
    domain_notes: 'Primary operational domain — all day-to-day inventory workflows live here',
    status: 'Active',
  });
  await addServiceToUnit('CU-WAREHOUSING-INVENTORY-V001', 'CS-INVENTORY-V001');
  await addServiceToUnit('CU-WAREHOUSING-INVENTORY-V001', 'CS-WAREHOUSE-LOCATION-V001');
  await addServiceToUnit('CU-WAREHOUSING-INVENTORY-V001', 'CS-STOCK-ADJUSTMENT-V001');
  await addServiceToUnit('CU-WAREHOUSING-INVENTORY-V001', 'CS-AUDIT-LOG-V001');

  await createCastleUnit({
    castle_unit_id: 'CU-ADMIN-V001',
    name: 'Admin Castle Unit',
    description: 'Handles user management, role settings, and system configuration',
    permission_scope: 'admin:read, admin:write, users:manage, roles:manage, system:configure',
    domain_notes: 'Restricted to admin users; includes audit log access for compliance',
    status: 'Active',
  });
  await addServiceToUnit('CU-ADMIN-V001', 'CS-AUTH-V001');
  await addServiceToUnit('CU-ADMIN-V001', 'CS-PERMISSION-V001');
  await addServiceToUnit('CU-ADMIN-V001', 'CS-AUDIT-LOG-V001');

  await createCastleUnit({
    castle_unit_id: 'CU-REPORTING-V001',
    name: 'Reporting Castle Unit',
    description:
      'Provides inventory dashboard, stock reports, and export views for management and analysis',
    permission_scope: 'reports:read, inventory:read, export:generate',
    domain_notes: 'Read-only access; generates summary reports and reconciliation',
    status: 'Active',
  });
  await addServiceToUnit('CU-REPORTING-V001', 'CS-REPORTING-V001');
  await addServiceToUnit('CU-REPORTING-V001', 'CS-INVENTORY-V001');

  await createCastleUnit({
    castle_unit_id: 'CU-USER-MANAGEMENT-V001',
    name: 'User Management Castle Unit',
    description: 'Manages user list, roles, and permission assignments across the system',
    permission_scope: 'users:read, users:write, roles:assign, permissions:view',
    domain_notes: 'Separate from Admin — focuses on user lifecycle and role assignment',
    status: 'Active',
  });
  await addServiceToUnit('CU-USER-MANAGEMENT-V001', 'CS-AUTH-V001');
  await addServiceToUnit('CU-USER-MANAGEMENT-V001', 'CS-PERMISSION-V001');

  // --- Step 6: Blueprint ---

  await createBlueprint({
    blueprint_id: 'BP-INVENTORY-INTERNAL-TENANT-V001',
    name: 'Inventory Application - Internal Tenant',
    category: 'Internal Operations',
    version: '1.0.0',
    purpose:
      'Standard blueprint for internal tenant inventory management with full CRUD, reporting, and user management',
    status: 'Active',
    frontend_structure:
      'React SPA with sidebar navigation, data tables, drawer panels, and dashboard widgets',
    backend_structure:
      'Express REST API with pg (node-postgres), module-per-domain structure',
    auth_assumptions: 'Internal SSO or local credentials; session-based auth',
    user_model_assumptions:
      'Users have roles (Admin, Manager, Viewer, WarehouseSupervisor); role-based permissions',
    navigation_assumptions:
      'Sidebar with: Inventory, Warehouse, Reports, Admin, Users',
    default_pages: [
      'Inventory List',
      'Item Detail',
      'Warehouse Locations',
      'Stock Adjustments',
      'Reports',
      'Admin',
      'User Management',
    ],
    default_components: [
      'InventoryTable',
      'ItemDetailPage',
      'WarehouseLocationSelector',
      'QuantityAdjustmentDrawer',
      'InventoryDashboardWidget',
    ],
    context_inventory_filters:
      'Exclude Archived and Deprecated assets; include only inventory-domain entities',
    initialization_rules:
      'Require at least one Admin user; seed default roles and permissions on first run',
    required_review_steps: [
      'Review auth assumptions with security team',
      'Confirm role model with product owner',
      'Validate data export compliance',
    ],
  });
  await addCastleUnitToBlueprint('BP-INVENTORY-INTERNAL-TENANT-V001', 'CU-WAREHOUSING-INVENTORY-V001');
  await addCastleUnitToBlueprint('BP-INVENTORY-INTERNAL-TENANT-V001', 'CU-ADMIN-V001');
  await addCastleUnitToBlueprint('BP-INVENTORY-INTERNAL-TENANT-V001', 'CU-REPORTING-V001');
  await addCastleUnitToBlueprint('BP-INVENTORY-INTERNAL-TENANT-V001', 'CU-USER-MANAGEMENT-V001');
  await addCastleServiceToBlueprint('BP-INVENTORY-INTERNAL-TENANT-V001', 'CS-AUTH-V001');
  await addCastleServiceToBlueprint('BP-INVENTORY-INTERNAL-TENANT-V001', 'CS-PERMISSION-V001');
  await addCastleServiceToBlueprint('BP-INVENTORY-INTERNAL-TENANT-V001', 'CS-AUDIT-LOG-V001');
  await addCastleServiceToBlueprint('BP-INVENTORY-INTERNAL-TENANT-V001', 'CS-INVENTORY-V001');
  await addCastleServiceToBlueprint('BP-INVENTORY-INTERNAL-TENANT-V001', 'CS-WAREHOUSE-LOCATION-V001');
  await addCastleServiceToBlueprint('BP-INVENTORY-INTERNAL-TENANT-V001', 'CS-STOCK-ADJUSTMENT-V001');
  await addCastleServiceToBlueprint('BP-INVENTORY-INTERNAL-TENANT-V001', 'CS-REPORTING-V001');
  await addCompositeToBlueprint('BP-INVENTORY-INTERNAL-TENANT-V001', 'COMP-INVENTORY-TABLE-V001');
  await addCompositeToBlueprint('BP-INVENTORY-INTERNAL-TENANT-V001', 'COMP-ITEM-DETAIL-PAGE-V001');
  await addCompositeToBlueprint(
    'BP-INVENTORY-INTERNAL-TENANT-V001',
    'COMP-WAREHOUSE-LOCATION-SELECTOR-V001',
  );
  await addCompositeToBlueprint(
    'BP-INVENTORY-INTERNAL-TENANT-V001',
    'COMP-QUANTITY-ADJUSTMENT-DRAWER-V001',
  );
  await addCompositeToBlueprint(
    'BP-INVENTORY-INTERNAL-TENANT-V001',
    'COMP-INVENTORY-DASHBOARD-WIDGET-V001',
  );

  // --- Step 7: Castle Type ---

  await createCastleType({
    castle_type_id: 'CT-INTERNAL-INVENTORY-V001',
    name: 'Internal Inventory Castle',
    description:
      'Castle type for internal-facing inventory management systems used by warehouse and operations teams',
    common_purpose:
      'Provide a complete inventory management solution for internal operational use',
    typical_use_cases: [
      'Warehouse stock tracking',
      'Inventory level monitoring',
      'Stock adjustment workflows',
      'Internal reporting and reconciliation',
    ],
    recommended_asset_filters:
      'Include: inventory, warehouse, stock domains; Exclude: customer-facing, e-commerce domains',
    status: 'Active',
  });
  await addBlueprintToCastleType('CT-INTERNAL-INVENTORY-V001', 'BP-INVENTORY-INTERNAL-TENANT-V001');
  await addCastleUnitToCastleType('CT-INTERNAL-INVENTORY-V001', 'CU-WAREHOUSING-INVENTORY-V001');
  await addCastleUnitToCastleType('CT-INTERNAL-INVENTORY-V001', 'CU-ADMIN-V001');
  await addCastleUnitToCastleType('CT-INTERNAL-INVENTORY-V001', 'CU-REPORTING-V001');
  await addCastleUnitToCastleType('CT-INTERNAL-INVENTORY-V001', 'CU-USER-MANAGEMENT-V001');
  await addCastleServiceToCastleType('CT-INTERNAL-INVENTORY-V001', 'CS-AUTH-V001');
  await addCastleServiceToCastleType('CT-INTERNAL-INVENTORY-V001', 'CS-PERMISSION-V001');
  await addCastleServiceToCastleType('CT-INTERNAL-INVENTORY-V001', 'CS-AUDIT-LOG-V001');
  await addCastleServiceToCastleType('CT-INTERNAL-INVENTORY-V001', 'CS-INVENTORY-V001');
  await addCastleServiceToCastleType('CT-INTERNAL-INVENTORY-V001', 'CS-WAREHOUSE-LOCATION-V001');
  await addCastleServiceToCastleType('CT-INTERNAL-INVENTORY-V001', 'CS-STOCK-ADJUSTMENT-V001');
  await addCastleServiceToCastleType('CT-INTERNAL-INVENTORY-V001', 'CS-REPORTING-V001');

  // --- Step 8: Castle ---

  await createCastle({
    castle_record_id: 'CSTL-STRUT-WAREHOUSE-INVENTORY-V001',
    castle_name: 'Strut Company Warehousing and Inventory Castle',
    version: '1.0.0',
    primary_purpose:
      'Complete warehousing and inventory management system for Strut Company internal operations',
    status: 'Active',
    build_notes:
      'Built on Internal Inventory Castle type with Inventory Application - Internal Tenant blueprint',
    review_notes:
      'Custom WarehouseSupervisor role and approval threshold require security and product review',
    reuse_recommendations:
      'Quantity Adjustment Drawer Composite and Role Check Compound are strong candidates for reuse in other inventory-adjacent castles',
    castle_type_id: 'CT-INTERNAL-INVENTORY-V001',
    blueprint_id: 'BP-INVENTORY-INTERNAL-TENANT-V001',
  });
  await addCastleUnitToCastle('CSTL-STRUT-WAREHOUSE-INVENTORY-V001', 'CU-WAREHOUSING-INVENTORY-V001');
  await addCastleUnitToCastle('CSTL-STRUT-WAREHOUSE-INVENTORY-V001', 'CU-ADMIN-V001');
  await addCastleUnitToCastle('CSTL-STRUT-WAREHOUSE-INVENTORY-V001', 'CU-REPORTING-V001');
  await addCastleUnitToCastle('CSTL-STRUT-WAREHOUSE-INVENTORY-V001', 'CU-USER-MANAGEMENT-V001');
  await addCastleServiceToCastle('CSTL-STRUT-WAREHOUSE-INVENTORY-V001', 'CS-AUTH-V001');
  await addCastleServiceToCastle('CSTL-STRUT-WAREHOUSE-INVENTORY-V001', 'CS-PERMISSION-V001');
  await addCastleServiceToCastle('CSTL-STRUT-WAREHOUSE-INVENTORY-V001', 'CS-AUDIT-LOG-V001');
  await addCastleServiceToCastle('CSTL-STRUT-WAREHOUSE-INVENTORY-V001', 'CS-INVENTORY-V001');
  await addCastleServiceToCastle('CSTL-STRUT-WAREHOUSE-INVENTORY-V001', 'CS-WAREHOUSE-LOCATION-V001');
  await addCastleServiceToCastle('CSTL-STRUT-WAREHOUSE-INVENTORY-V001', 'CS-STOCK-ADJUSTMENT-V001');
  await addCastleServiceToCastle('CSTL-STRUT-WAREHOUSE-INVENTORY-V001', 'CS-REPORTING-V001');

  // --- Step 9: Local Modifications ---

  await createLocalModification({
    modification_id: 'LMOD-CUSTOM-WAREHOUSE-NAMING-V001',
    castle_record_id: 'CSTL-STRUT-WAREHOUSE-INVENTORY-V001',
    modified_item: 'Warehouse Location Naming Scheme',
    change_description:
      'Custom naming convention for warehouse zones using Strut Company area codes (e.g., STRUT-A1-B3-S2)',
    reason:
      'Strut Company has an existing physical warehouse labeling system that must be preserved for operational continuity',
    related_asset_id: 'CS-WAREHOUSE-LOCATION-V001',
    related_asset_type: 'CastleService',
    review_status: 'Approved',
    promotion_recommendation: 'RemainLocal',
    testing_notes: 'Verify naming scheme validates correctly and displays in UI selectors',
  });

  await createLocalModification({
    modification_id: 'LMOD-WAREHOUSE-SUPERVISOR-ROLE-V001',
    castle_record_id: 'CSTL-STRUT-WAREHOUSE-INVENTORY-V001',
    modified_item: 'Custom Role: WarehouseSupervisor',
    change_description:
      'Added WarehouseSupervisor role with elevated permissions for stock adjustments above defined thresholds',
    reason:
      'Strut Company requires a mid-level role between Manager and Viewer for warehouse floor supervisors',
    related_asset_id: 'CS-PERMISSION-V001',
    related_asset_type: 'CastleService',
    review_status: 'Approved',
    promotion_recommendation: 'PromoteToService',
    testing_notes:
      'Ensure WarehouseSupervisor can approve adjustments but cannot modify system configuration',
  });

  await createLocalModification({
    modification_id: 'LMOD-QUANTITY-APPROVAL-THRESHOLD-V001',
    castle_record_id: 'CSTL-STRUT-WAREHOUSE-INVENTORY-V001',
    modified_item: 'Quantity Adjustment Approval Threshold',
    change_description:
      'Stock adjustments above a defined quantity threshold require WarehouseSupervisor approval before taking effect',
    reason:
      'Strut Company policy requires supervisory sign-off on large stock movements to prevent errors and fraud',
    related_asset_id: 'COMP-QUANTITY-ADJUSTMENT-DRAWER-V001',
    related_asset_type: 'Composite',
    review_status: 'Approved',
    promotion_recommendation: 'PromoteToComposite',
    testing_notes:
      'Test threshold boundary: at-threshold, above-threshold, below-threshold scenarios',
  });

  await createLocalModification({
    modification_id: 'LMOD-MATERIAL-TRACKING-V001',
    castle_record_id: 'CSTL-STRUT-WAREHOUSE-INVENTORY-V001',
    modified_item: 'Material Category Tracking',
    change_description:
      'Separate inventory tracking for raw materials, work-in-progress (WIP), and finished goods',
    reason:
      'Strut Company manufacturing process requires distinct visibility into each production stage of inventory',
    related_asset_id: 'CS-INVENTORY-V001',
    related_asset_type: 'CastleService',
    review_status: 'Pending',
    promotion_recommendation: 'PromoteToService',
    testing_notes:
      'Verify category separation in reports and that WIP items cannot be shipped directly',
  });

  await createLocalModification({
    modification_id: 'LMOD-MONTHLY-RECONCILIATION-REPORT-V001',
    castle_record_id: 'CSTL-STRUT-WAREHOUSE-INVENTORY-V001',
    modified_item: 'Custom Monthly Warehouse Reconciliation Report',
    change_description:
      'Monthly report comparing system inventory counts against physical warehouse counts with discrepancy highlighting',
    reason:
      'Strut Company audit requirements mandate monthly physical-to-system reconciliation with documented variance tracking',
    related_asset_id: 'CS-REPORTING-V001',
    related_asset_type: 'CastleService',
    review_status: 'Pending',
    promotion_recommendation: 'PromoteToService',
    testing_notes: 'Validate report includes all item categories and highlights variances above 5%',
  });
}

async function main() {
  console.log('Seeding Strut Company Warehousing and Inventory Castle...');
  await seed();
  console.log('Seed complete.');
}

if (require.main === module) {
  main()
    .catch((e) => {
      console.error('Seed failed:', e);
      process.exit(1);
    })
    .finally(() => {
      void db.end();
    });
}
