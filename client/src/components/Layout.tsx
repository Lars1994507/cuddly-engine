import { NavLink, Outlet } from 'react-router-dom';
import { ENTITY_CONFIGS } from '../config';

export default function Layout() {
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="sidebar-logo">CastleInventoryAX</div>
          <div className="sidebar-tagline">Asset Inventory System</div>
        </div>

        <div className="sidebar-section">
          <div className="sidebar-section-label">Catalogue</div>
          {ENTITY_CONFIGS.map((cfg) => (
            <NavLink
              key={cfg.key}
              to={cfg.path}
              className={({ isActive }) => 'sidebar-link' + (isActive ? ' active' : '')}
            >
              {cfg.label}
            </NavLink>
          ))}
        </div>

        <div className="sidebar-section">
          <div className="sidebar-section-label">Tools</div>
          <NavLink to="/bom" className={({ isActive }) => 'sidebar-link' + (isActive ? ' active' : '')}>
            BOM Viewer
          </NavLink>
          <NavLink to="/bom-impact" className={({ isActive }) => 'sidebar-link' + (isActive ? ' active' : '')}>
            BOM Impact
          </NavLink>
          <NavLink to="/retrieval" className={({ isActive }) => 'sidebar-link' + (isActive ? ' active' : '')}>
            AI Retrieval
          </NavLink>
          <NavLink to="/diagram" className={({ isActive }) => 'sidebar-link' + (isActive ? ' active' : '')}>
            Diagram
          </NavLink>
          <NavLink to="/reports" className={({ isActive }) => 'sidebar-link' + (isActive ? ' active' : '')}>
            Reports
          </NavLink>
        </div>

        <div className="sidebar-section">
          <div className="sidebar-section-label">System</div>
          <NavLink to="/settings" className={({ isActive }) => 'sidebar-link' + (isActive ? ' active' : '')}>
            Settings
          </NavLink>
        </div>
      </aside>

      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}
