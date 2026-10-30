import type { ReactNode } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Spinner } from './components/ui';
import { useAuth } from './lib/auth';
import { TenantsPage } from './pages/admin/TenantsPage';
import { ArtworkEditorPage } from './pages/ArtworkEditorPage';
import { ArtworksPage } from './pages/ArtworksPage';
import { CategoriesPage } from './pages/CategoriesPage';
import { MediaPage } from './pages/MediaPage';
import { PricingPage } from './pages/PricingPage';
import { SoldPage } from './pages/SoldPage';
import { ComingSoonPage } from './pages/ComingSoonPage';
import { LoginPage } from './pages/LoginPage';
import { SettingsPage } from './pages/SettingsPage';

function RequireAuth({ children }: { children: ReactNode }) {
  const { session, loading } = useAuth();
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner />
      </div>
    );
  }
  return session ? children : <Navigate to="/login" replace />;
}

export function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        element={
          <RequireAuth>
            <Layout />
          </RequireAuth>
        }
      >
        <Route index element={<ComingSoonPage title="Overview" />} />
        <Route path="artworks" element={<ArtworksPage />} />
        <Route path="artworks/:id" element={<ArtworkEditorPage />} />
        <Route path="categories" element={<CategoriesPage />} />
        <Route path="media" element={<MediaPage />} />
        <Route path="pricing" element={<PricingPage />} />
        <Route path="sold" element={<SoldPage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="admin/tenants" element={<TenantsPage />} />
        <Route path="*" element={<ComingSoonPage title="Coming soon" />} />
      </Route>
    </Routes>
  );
}
