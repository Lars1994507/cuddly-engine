import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import ListPage from './pages/ListPage';
import DetailPage from './pages/DetailPage';
import EntityFormPage from './pages/EntityFormPage';
import BOMPage from './pages/BOMPage';
import BOMImpactPage from './pages/BOMImpactPage';
import ReportsPage from './pages/ReportsPage';
import RetrievalPage from './pages/RetrievalPage';
import DiagramPage from './pages/DiagramPage';
import SettingsPage from './pages/SettingsPage';
import { ENTITY_CONFIGS } from './config';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/castles" replace />} />
          {ENTITY_CONFIGS.map((cfg) => (
            <Route key={cfg.key} path={cfg.path.slice(1)}>
              <Route index element={<ListPage key={cfg.key} config={cfg} />} />
              <Route path="new" element={<EntityFormPage key={cfg.key + '-new'} config={cfg} mode="create" />} />
              <Route path=":id">
                <Route index element={<DetailPage key={cfg.key} config={cfg} />} />
                <Route path="edit" element={<EntityFormPage key={cfg.key + '-edit'} config={cfg} mode="edit" />} />
              </Route>
            </Route>
          ))}
          <Route path="bom">
            <Route index element={<BOMPage />} />
            <Route path=":id" element={<BOMPage />} />
          </Route>
          <Route path="bom-impact">
            <Route index element={<BOMImpactPage />} />
            <Route path=":entityType/:entityId" element={<BOMImpactPage />} />
          </Route>
          <Route path="reports" element={<ReportsPage />} />
          <Route path="retrieval" element={<RetrievalPage />} />
          <Route path="diagram">
            <Route index element={<DiagramPage />} />
            <Route path=":id" element={<DiagramPage />} />
          </Route>
          <Route path="settings" element={<SettingsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
