export interface Column {
  key: string;
  label: string;
}

export interface Field {
  key: string;
  label: string;
  type?: 'text' | 'date' | 'json-array';
}

export interface FormField {
  key: string;
  label: string;
  type?: 'text' | 'textarea' | 'select' | 'json-array';
  options?: string[];
  required?: boolean;
  placeholder?: string;
}

export interface RelConfig {
  label: string;
  apiSuffix: string;
  targetPath?: string;
  idField: string;
  nameField: string;
  secondaryField?: string;
  manageable?: boolean;
}

export interface FilterConfig {
  key: string;
  label: string;
  options?: string[];
}

export interface EntityConfig {
  key: string;
  label: string;
  singular: string;
  path: string;
  apiPath: string;
  idField: string;
  nameField: string;
  secondaryField?: string;
  columns: Column[];
  fields: Field[];
  formFields: FormField[];
  rels: RelConfig[];
  filters?: FilterConfig[];
  randomData?: () => Record<string, string>;
}

export const STATUS_OPTIONS = ['Draft', 'Active', 'Deprecated', 'Archived', 'InReview', 'Reusable'];

export const ASSET_TYPE_OPTIONS = [
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
];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

const CASTLE_TEMPLATES = [
  {
    slug: 'WAREHOUSE-INVENTORY',
    name: 'Warehouse Inventory System',
    purpose: 'Tracks warehouse stock levels, bin locations, inbound shipments, and reorder thresholds across multiple storage facilities.',
    build_notes: 'Requires barcode scanner integration and real-time inventory sync with supplier APIs.',
    review_notes: 'Pending review of reorder logic and low-stock alert thresholds.',
    reuse: 'Inventory query helpers and stock-level validators are candidates for promotion to shared Compounds.',
  },
  {
    slug: 'TENANT-BILLING-DASHBOARD',
    name: 'Tenant Billing Dashboard',
    purpose: 'Provides tenants with a self-service view of invoices, payment history, and subscription plan management.',
    build_notes: 'Stripe integration required for payment processing. Webhook handling needed for invoice events.',
    review_notes: 'Plan upgrade/downgrade flows need legal sign-off before going Active.',
    reuse: 'Invoice formatting utilities and plan comparison logic can be extracted as reusable Atomic Assets.',
  },
  {
    slug: 'USER-ONBOARDING-FLOW',
    name: 'User Onboarding Flow',
    purpose: 'Guides new users through account setup, role selection, initial configuration, and first-use tutorials.',
    build_notes: 'Step completion must be persisted so users can resume onboarding after session breaks.',
    review_notes: 'UX review scheduled for the role-selection step. Progress indicators need accessibility audit.',
    reuse: 'Step-validation logic and progress-tracker component are reusable across other multi-step flows.',
  },
  {
    slug: 'ADMIN-REPORTING-PORTAL',
    name: 'Admin Reporting Portal',
    purpose: 'Centralises operational reports, KPI dashboards, and data exports for internal administrators.',
    build_notes: 'Reports are generated on-demand; heavy queries should be offloaded to a background job queue.',
    review_notes: 'Data export compliance (GDPR redaction) needs sign-off from the data team.',
    reuse: 'Chart rendering components and CSV export helpers should be promoted to shared Composites.',
  },
  {
    slug: 'NOTIFICATION-CENTER',
    name: 'Notification Center',
    purpose: 'Delivers and manages in-app, email, and push notifications across user-configurable preference channels.',
    build_notes: 'Must support template-based notifications with variable interpolation and localisation.',
    review_notes: 'Rate-limiting rules for email dispatch are under review by the infrastructure team.',
    reuse: 'Template renderer and notification-preference resolver are strong candidates for shared Castle Services.',
  },
  {
    slug: 'ROLE-PERMISSION-MANAGER',
    name: 'Role & Permission Manager',
    purpose: 'Allows administrators to define roles, assign granular permissions, and audit access changes across the system.',
    build_notes: 'Permission changes must be logged with before/after snapshots for the audit trail.',
    review_notes: 'Super-admin safeguards (cannot remove own admin role) need thorough edge-case testing.',
    reuse: 'Permission-check helpers are used system-wide and should be maintained as Active Atomic Assets.',
  },
  {
    slug: 'PRODUCT-CATALOG-MANAGER',
    name: 'Product Catalog Manager',
    purpose: 'Manages the full product lifecycle including creation, categorisation, pricing, media, and publication status.',
    build_notes: 'Bulk import via CSV required. Image uploads must be validated for size and format before storage.',
    review_notes: 'SEO metadata fields are awaiting final specification from the marketing team.',
    reuse: 'Slug-generation and price-formatting utilities can be extracted and shared across catalog-related Castles.',
  },
  {
    slug: 'SUPPORT-TICKET-SYSTEM',
    name: 'Support Ticket System',
    purpose: 'Tracks customer support requests from submission through triage, assignment, and resolution with SLA enforcement.',
    build_notes: 'Email-to-ticket ingestion needed. SLA timers must pause when a ticket is awaiting customer response.',
    review_notes: 'Escalation rules and auto-close thresholds need input from the support operations lead.',
    reuse: 'SLA calculation logic and ticket-status state machine are reusable across other workflow Castles.',
  },
];

function randomCastleData(): Record<string, string> {
  const t = pick(CASTLE_TEMPLATES);
  const ver = `${Math.floor(Math.random() * 3) + 1}.${Math.floor(Math.random() * 5)}.0`;
  const vTag = `V${String(Math.floor(Math.random() * 5) + 1).padStart(3, '0')}`;
  return {
    castle_record_id: `CSTL-${t.slug}-${vTag}`,
    castle_name: t.name,
    version: ver,
    status: 'Draft',
    primary_purpose: t.purpose,
    build_notes: t.build_notes,
    review_notes: t.review_notes,
    reuse_recommendations: t.reuse,
  };
}

export const ENTITY_CONFIGS: EntityConfig[] = [
  {
    key: 'castles',
    label: 'Castles',
    singular: 'Castle',
    path: '/castles',
    apiPath: 'castles',
    idField: 'castle_record_id',
    nameField: 'castle_name',
    columns: [
      { key: 'castle_record_id', label: 'ID' },
      { key: 'castle_name', label: 'Name' },
      { key: 'version', label: 'Version' },
      { key: 'status', label: 'Status' },
      { key: 'castle_type_id', label: 'Castle Type' },
      { key: 'blueprint_id', label: 'Blueprint' },
    ],
    fields: [
      { key: 'castle_record_id', label: 'Castle Record ID' },
      { key: 'castle_name', label: 'Name' },
      { key: 'version', label: 'Version' },
      { key: 'status', label: 'Status' },
      { key: 'primary_purpose', label: 'Primary Purpose' },
      { key: 'description', label: 'Description' },
      { key: 'castle_type_id', label: 'Castle Type ID' },
      { key: 'blueprint_id', label: 'Blueprint ID' },
      { key: 'build_notes', label: 'Build Notes' },
      { key: 'review_notes', label: 'Review Notes' },
      { key: 'reuse_recommendations', label: 'Reuse Recommendations' },
      { key: 'created_at', label: 'Created', type: 'date' },
      { key: 'updated_at', label: 'Updated', type: 'date' },
    ],
    formFields: [
      { key: 'castle_record_id', label: 'Castle Record ID', required: true, placeholder: 'CSTL-WORD-V001' },
      { key: 'castle_name', label: 'Name', required: true },
      { key: 'version', label: 'Version', required: true, placeholder: '1.0.0' },
      { key: 'status', label: 'Status', type: 'select', options: STATUS_OPTIONS },
      { key: 'primary_purpose', label: 'Primary Purpose', required: true, type: 'textarea' },
      { key: 'description', label: 'Description', type: 'textarea' },
      { key: 'build_notes', label: 'Build Notes', type: 'textarea' },
      { key: 'review_notes', label: 'Review Notes', type: 'textarea' },
      { key: 'reuse_recommendations', label: 'Reuse Recommendations', type: 'textarea' },
    ],
    rels: [
      { label: 'Castle Units', apiSuffix: 'castle-units', targetPath: '/castle-units', idField: 'castle_unit_id', nameField: 'name', secondaryField: 'permission_scope', manageable: true },
      { label: 'Castle Services', apiSuffix: 'castle-services', targetPath: '/castle-services', idField: 'castle_service_id', nameField: 'name', secondaryField: 'capability', manageable: true },
      { label: 'Local Modifications', apiSuffix: 'local-modifications', idField: 'modification_id', nameField: 'modified_item', secondaryField: 'change_description' },
    ],
    filters: [
      { key: 'status', label: 'Status', options: STATUS_OPTIONS },
    ],
    randomData: randomCastleData,
  },
  {
    key: 'castle-types',
    label: 'Castle Types',
    singular: 'Castle Type',
    path: '/castle-types',
    apiPath: 'castle-types',
    idField: 'castle_type_id',
    nameField: 'name',
    columns: [
      { key: 'castle_type_id', label: 'ID' },
      { key: 'name', label: 'Name' },
      { key: 'status', label: 'Status' },
      { key: 'common_purpose', label: 'Common Purpose' },
    ],
    fields: [
      { key: 'castle_type_id', label: 'Castle Type ID' },
      { key: 'name', label: 'Name' },
      { key: 'description', label: 'Description' },
      { key: 'common_purpose', label: 'Common Purpose' },
      { key: 'typical_use_cases', label: 'Typical Use Cases', type: 'json-array' },
      { key: 'recommended_asset_filters', label: 'Recommended Asset Filters' },
      { key: 'status', label: 'Status' },
      { key: 'created_at', label: 'Created', type: 'date' },
      { key: 'updated_at', label: 'Updated', type: 'date' },
    ],
    formFields: [
      { key: 'castle_type_id', label: 'Castle Type ID', required: true, placeholder: 'CT-WORD-V001' },
      { key: 'name', label: 'Name', required: true },
      { key: 'description', label: 'Description', required: true, type: 'textarea' },
      { key: 'common_purpose', label: 'Common Purpose', required: true, type: 'textarea' },
      { key: 'typical_use_cases', label: 'Typical Use Cases', type: 'json-array', placeholder: 'UseCase1, UseCase2' },
      { key: 'recommended_asset_filters', label: 'Recommended Asset Filters', type: 'textarea' },
      { key: 'status', label: 'Status', type: 'select', options: STATUS_OPTIONS },
    ],
    rels: [
      { label: 'Compatible Blueprints', apiSuffix: 'blueprints', targetPath: '/blueprints', idField: 'blueprint_id', nameField: 'name', secondaryField: 'category', manageable: true },
      { label: 'Default Castle Units', apiSuffix: 'castle-units', targetPath: '/castle-units', idField: 'castle_unit_id', nameField: 'name', manageable: true },
      { label: 'Default Castle Services', apiSuffix: 'castle-services', targetPath: '/castle-services', idField: 'castle_service_id', nameField: 'name', secondaryField: 'capability', manageable: true },
    ],
    filters: [
      { key: 'status', label: 'Status', options: STATUS_OPTIONS },
    ],
  },
  {
    key: 'blueprints',
    label: 'Blueprints',
    singular: 'Blueprint',
    path: '/blueprints',
    apiPath: 'blueprints',
    idField: 'blueprint_id',
    nameField: 'name',
    secondaryField: 'category',
    columns: [
      { key: 'blueprint_id', label: 'ID' },
      { key: 'name', label: 'Name' },
      { key: 'category', label: 'Category' },
      { key: 'version', label: 'Version' },
      { key: 'status', label: 'Status' },
    ],
    fields: [
      { key: 'blueprint_id', label: 'Blueprint ID' },
      { key: 'name', label: 'Name' },
      { key: 'category', label: 'Category' },
      { key: 'version', label: 'Version' },
      { key: 'status', label: 'Status' },
      { key: 'purpose', label: 'Purpose' },
      { key: 'what_it_is_for', label: 'What It Is For' },
      { key: 'what_it_is_not_for', label: 'What It Is Not For' },
      { key: 'frontend_structure', label: 'Frontend Structure' },
      { key: 'backend_structure', label: 'Backend Structure' },
      { key: 'auth_assumptions', label: 'Auth Assumptions' },
      { key: 'user_model_assumptions', label: 'User Model Assumptions' },
      { key: 'navigation_assumptions', label: 'Navigation Assumptions' },
      { key: 'default_pages', label: 'Default Pages', type: 'json-array' },
      { key: 'default_components', label: 'Default Components', type: 'json-array' },
      { key: 'context_inventory_filters', label: 'Context Inventory Filters' },
      { key: 'initialization_rules', label: 'Initialization Rules' },
      { key: 'placeholder_rules', label: 'Placeholder Rules' },
      { key: 'required_review_steps', label: 'Required Review Steps', type: 'json-array' },
      { key: 'created_at', label: 'Created', type: 'date' },
      { key: 'updated_at', label: 'Updated', type: 'date' },
    ],
    formFields: [
      { key: 'blueprint_id', label: 'Blueprint ID', required: true, placeholder: 'BP-WORD-V001' },
      { key: 'name', label: 'Name', required: true },
      { key: 'category', label: 'Category', required: true, placeholder: 'SaaS, E-Commerce, Dashboard…' },
      { key: 'version', label: 'Version', required: true, placeholder: '1.0.0' },
      { key: 'status', label: 'Status', type: 'select', options: STATUS_OPTIONS },
      { key: 'purpose', label: 'Purpose', required: true, type: 'textarea' },
      { key: 'what_it_is_for', label: 'What It Is For', type: 'textarea' },
      { key: 'what_it_is_not_for', label: 'What It Is Not For', type: 'textarea' },
      { key: 'frontend_structure', label: 'Frontend Structure', type: 'textarea' },
      { key: 'backend_structure', label: 'Backend Structure', type: 'textarea' },
      { key: 'auth_assumptions', label: 'Auth Assumptions', type: 'textarea' },
      { key: 'user_model_assumptions', label: 'User Model Assumptions', type: 'textarea' },
      { key: 'navigation_assumptions', label: 'Navigation Assumptions', type: 'textarea' },
      { key: 'default_pages', label: 'Default Pages', type: 'json-array', placeholder: 'Dashboard, Settings, Profile' },
      { key: 'default_components', label: 'Default Components', type: 'json-array', placeholder: 'Navbar, Sidebar, Footer' },
      { key: 'context_inventory_filters', label: 'Context Inventory Filters', type: 'textarea' },
      { key: 'initialization_rules', label: 'Initialization Rules', type: 'textarea' },
      { key: 'placeholder_rules', label: 'Placeholder Rules', type: 'textarea' },
      { key: 'required_review_steps', label: 'Required Review Steps', type: 'json-array', placeholder: 'Review auth, Review billing' },
    ],
    rels: [
      { label: 'Default Castle Units', apiSuffix: 'castle-units', targetPath: '/castle-units', idField: 'castle_unit_id', nameField: 'name', manageable: true },
      { label: 'Default Castle Services', apiSuffix: 'castle-services', targetPath: '/castle-services', idField: 'castle_service_id', nameField: 'name', secondaryField: 'capability', manageable: true },
      { label: 'Compatible Composites', apiSuffix: 'composites', targetPath: '/composites', idField: 'composite_id', nameField: 'name', secondaryField: 'ui_backend_scope', manageable: true },
    ],
    filters: [
      { key: 'status', label: 'Status', options: STATUS_OPTIONS },
      { key: 'category', label: 'Category' },
    ],
  },
  {
    key: 'castle-units',
    label: 'Castle Units',
    singular: 'Castle Unit',
    path: '/castle-units',
    apiPath: 'castle-units',
    idField: 'castle_unit_id',
    nameField: 'name',
    columns: [
      { key: 'castle_unit_id', label: 'ID' },
      { key: 'name', label: 'Name' },
      { key: 'status', label: 'Status' },
      { key: 'permission_scope', label: 'Permission Scope' },
    ],
    fields: [
      { key: 'castle_unit_id', label: 'Castle Unit ID' },
      { key: 'name', label: 'Name' },
      { key: 'description', label: 'Description' },
      { key: 'permission_scope', label: 'Permission Scope' },
      { key: 'domain_notes', label: 'Domain Notes' },
      { key: 'status', label: 'Status' },
      { key: 'created_at', label: 'Created', type: 'date' },
      { key: 'updated_at', label: 'Updated', type: 'date' },
    ],
    formFields: [
      { key: 'castle_unit_id', label: 'Castle Unit ID', required: true, placeholder: 'CU-WORD-V001' },
      { key: 'name', label: 'Name', required: true },
      { key: 'description', label: 'Description', required: true, type: 'textarea' },
      { key: 'permission_scope', label: 'Permission Scope', required: true, placeholder: 'admin, member, public…' },
      { key: 'domain_notes', label: 'Domain Notes', type: 'textarea' },
      { key: 'status', label: 'Status', type: 'select', options: STATUS_OPTIONS },
    ],
    rels: [
      { label: 'Castle Services', apiSuffix: 'services', targetPath: '/castle-services', idField: 'castle_service_id', nameField: 'name', secondaryField: 'capability', manageable: true },
      { label: 'Composites', apiSuffix: 'composites', targetPath: '/composites', idField: 'composite_id', nameField: 'name', secondaryField: 'ui_backend_scope', manageable: true },
    ],
    filters: [
      { key: 'status', label: 'Status', options: STATUS_OPTIONS },
    ],
  },
  {
    key: 'castle-services',
    label: 'Castle Services',
    singular: 'Castle Service',
    path: '/castle-services',
    apiPath: 'castle-services',
    idField: 'castle_service_id',
    nameField: 'name',
    secondaryField: 'capability',
    columns: [
      { key: 'castle_service_id', label: 'ID' },
      { key: 'name', label: 'Name' },
      { key: 'capability', label: 'Capability' },
      { key: 'status', label: 'Status' },
    ],
    fields: [
      { key: 'castle_service_id', label: 'Castle Service ID' },
      { key: 'name', label: 'Name' },
      { key: 'capability', label: 'Capability' },
      { key: 'backend_modules', label: 'Backend Modules', type: 'json-array' },
      { key: 'api_contracts', label: 'API Contracts' },
      { key: 'database_interactions', label: 'Database Interactions' },
      { key: 'frontend_visibility', label: 'Frontend Visibility' },
      { key: 'admin_controls', label: 'Admin Controls' },
      { key: 'observability', label: 'Observability' },
      { key: 'logging', label: 'Logging' },
      { key: 'health_checks', label: 'Health Checks' },
      { key: 'permission_rules', label: 'Permission Rules' },
      { key: 'status', label: 'Status' },
      { key: 'created_at', label: 'Created', type: 'date' },
      { key: 'updated_at', label: 'Updated', type: 'date' },
    ],
    formFields: [
      { key: 'castle_service_id', label: 'Castle Service ID', required: true, placeholder: 'CS-WORD-V001' },
      { key: 'name', label: 'Name', required: true },
      { key: 'capability', label: 'Capability', required: true, placeholder: 'Auth, Billing, Notifications…' },
      { key: 'backend_modules', label: 'Backend Modules', type: 'json-array', placeholder: 'auth, notifications, billing' },
      { key: 'api_contracts', label: 'API Contracts', type: 'textarea' },
      { key: 'database_interactions', label: 'Database Interactions', type: 'textarea' },
      { key: 'frontend_visibility', label: 'Frontend Visibility' },
      { key: 'admin_controls', label: 'Admin Controls' },
      { key: 'observability', label: 'Observability' },
      { key: 'logging', label: 'Logging' },
      { key: 'health_checks', label: 'Health Checks' },
      { key: 'permission_rules', label: 'Permission Rules', type: 'textarea' },
      { key: 'status', label: 'Status', type: 'select', options: STATUS_OPTIONS },
    ],
    rels: [
      { label: 'Composites', apiSuffix: 'composites', targetPath: '/composites', idField: 'composite_id', nameField: 'name', secondaryField: 'ui_backend_scope', manageable: true },
      { label: 'Compounds', apiSuffix: 'compounds', targetPath: '/compounds', idField: 'compound_id', nameField: 'name', manageable: true },
      { label: 'Atomic Assets (Direct)', apiSuffix: 'atomic-assets', targetPath: '/atomic-assets', idField: 'atomic_asset_id', nameField: 'name', secondaryField: 'asset_type', manageable: true },
    ],
    filters: [
      { key: 'status', label: 'Status', options: STATUS_OPTIONS },
    ],
  },
  {
    key: 'composites',
    label: 'Composites',
    singular: 'Composite',
    path: '/composites',
    apiPath: 'composites',
    idField: 'composite_id',
    nameField: 'name',
    secondaryField: 'ui_backend_scope',
    columns: [
      { key: 'composite_id', label: 'ID' },
      { key: 'name', label: 'Name' },
      { key: 'ui_backend_scope', label: 'Scope' },
      { key: 'version', label: 'Version' },
      { key: 'status', label: 'Status' },
    ],
    fields: [
      { key: 'composite_id', label: 'Composite ID' },
      { key: 'name', label: 'Name' },
      { key: 'description', label: 'Description' },
      { key: 'version', label: 'Version' },
      { key: 'ui_backend_scope', label: 'UI/Backend Scope' },
      { key: 'usage_references', label: 'Usage References', type: 'json-array' },
      { key: 'approval_status', label: 'Approval Status' },
      { key: 'reuse_notes', label: 'Reuse Notes' },
      { key: 'status', label: 'Status' },
      { key: 'created_at', label: 'Created', type: 'date' },
      { key: 'updated_at', label: 'Updated', type: 'date' },
    ],
    formFields: [
      { key: 'composite_id', label: 'Composite ID', required: true, placeholder: 'COMP-WORD-V001' },
      { key: 'name', label: 'Name', required: true },
      { key: 'description', label: 'Description', required: true, type: 'textarea' },
      { key: 'version', label: 'Version', required: true, placeholder: '1.0.0' },
      { key: 'ui_backend_scope', label: 'UI/Backend Scope', required: true, type: 'select', options: ['UI', 'Backend', 'Both'] },
      { key: 'usage_references', label: 'Usage References', type: 'json-array', placeholder: 'ref1, ref2' },
      { key: 'approval_status', label: 'Approval Status', placeholder: 'Pending, Approved, Rejected…' },
      { key: 'reuse_notes', label: 'Reuse Notes', type: 'textarea' },
      { key: 'status', label: 'Status', type: 'select', options: STATUS_OPTIONS },
    ],
    rels: [
      { label: 'Compounds', apiSuffix: 'compounds', targetPath: '/compounds', idField: 'compound_id', nameField: 'name', manageable: true },
      { label: 'Atomic Assets (Direct)', apiSuffix: 'atomic-assets', targetPath: '/atomic-assets', idField: 'atomic_asset_id', nameField: 'name', secondaryField: 'asset_type', manageable: true },
    ],
    filters: [
      { key: 'status', label: 'Status', options: STATUS_OPTIONS },
      { key: 'ui_backend_scope', label: 'Scope', options: ['UI', 'Backend', 'Both'] },
    ],
  },
  {
    key: 'compounds',
    label: 'Compounds',
    singular: 'Compound',
    path: '/compounds',
    apiPath: 'compounds',
    idField: 'compound_id',
    nameField: 'name',
    columns: [
      { key: 'compound_id', label: 'ID' },
      { key: 'name', label: 'Name' },
      { key: 'version', label: 'Version' },
      { key: 'status', label: 'Status' },
    ],
    fields: [
      { key: 'compound_id', label: 'Compound ID' },
      { key: 'name', label: 'Name' },
      { key: 'description', label: 'Description' },
      { key: 'version', label: 'Version' },
      { key: 'testing_notes', label: 'Testing Notes' },
      { key: 'status', label: 'Status' },
      { key: 'created_at', label: 'Created', type: 'date' },
      { key: 'updated_at', label: 'Updated', type: 'date' },
    ],
    formFields: [
      { key: 'compound_id', label: 'Compound ID', required: true, placeholder: 'CMPD-WORD-V001' },
      { key: 'name', label: 'Name', required: true },
      { key: 'description', label: 'Description', required: true, type: 'textarea' },
      { key: 'version', label: 'Version', required: true, placeholder: '1.0.0' },
      { key: 'testing_notes', label: 'Testing Notes', type: 'textarea' },
      { key: 'status', label: 'Status', type: 'select', options: STATUS_OPTIONS },
    ],
    rels: [
      { label: 'Atomic Assets', apiSuffix: 'atomic-assets', targetPath: '/atomic-assets', idField: 'atomic_asset_id', nameField: 'name', secondaryField: 'asset_type', manageable: true },
    ],
    filters: [
      { key: 'status', label: 'Status', options: STATUS_OPTIONS },
    ],
  },
  {
    key: 'atomic-assets',
    label: 'Atomic Assets',
    singular: 'Atomic Asset',
    path: '/atomic-assets',
    apiPath: 'atomic-assets',
    idField: 'atomic_asset_id',
    nameField: 'name',
    secondaryField: 'asset_type',
    columns: [
      { key: 'atomic_asset_id', label: 'ID' },
      { key: 'name', label: 'Name' },
      { key: 'asset_type', label: 'Type' },
      { key: 'version', label: 'Version' },
      { key: 'status', label: 'Status' },
    ],
    fields: [
      { key: 'atomic_asset_id', label: 'Atomic Asset ID' },
      { key: 'name', label: 'Name' },
      { key: 'asset_type', label: 'Asset Type' },
      { key: 'description', label: 'Description' },
      { key: 'code_location', label: 'Code Location' },
      { key: 'version', label: 'Version' },
      { key: 'dependencies', label: 'Dependencies', type: 'json-array' },
      { key: 'validation_notes', label: 'Validation Notes' },
      { key: 'approved_pattern_notes', label: 'Approved Pattern Notes' },
      { key: 'status', label: 'Status' },
      { key: 'created_at', label: 'Created', type: 'date' },
      { key: 'updated_at', label: 'Updated', type: 'date' },
    ],
    formFields: [
      { key: 'atomic_asset_id', label: 'Atomic Asset ID', required: true, placeholder: 'AA-WORD-V001' },
      { key: 'name', label: 'Name', required: true },
      { key: 'asset_type', label: 'Asset Type', required: true, type: 'select', options: ASSET_TYPE_OPTIONS },
      { key: 'description', label: 'Description', required: true, type: 'textarea' },
      { key: 'code_location', label: 'Code Location', required: true, placeholder: 'src/utils/format.ts' },
      { key: 'version', label: 'Version', required: true, placeholder: '1.0.0' },
      { key: 'dependencies', label: 'Dependencies', type: 'json-array', placeholder: 'dep1, dep2' },
      { key: 'validation_notes', label: 'Validation Notes', type: 'textarea' },
      { key: 'approved_pattern_notes', label: 'Approved Pattern Notes', type: 'textarea' },
      { key: 'status', label: 'Status', type: 'select', options: STATUS_OPTIONS },
    ],
    rels: [],
    filters: [
      { key: 'status', label: 'Status', options: STATUS_OPTIONS },
      {
        key: 'asset_type',
        label: 'Type',
        options: ASSET_TYPE_OPTIONS,
      },
    ],
  },
];
