import type { PageSlug } from '@platform/contracts';
import React from 'react';
import { Route, Routes } from 'react-router-dom';
import { usePage } from '../../platform/SiteProvider';
import Layout from './components/layout/Layout';
import ExhibitionPage from './pages/ExhibitionPage';
import ArchivePage from './pages/ArchivePage';
import ArtworkPage from './pages/ArtworkPage';
import CheckoutPage from './pages/CheckoutPage';
import AboutPage from './pages/AboutPage';
import OffersPage from './pages/OffersPage';
import CommissionPage from './pages/CommissionPage';
import ContactPage from './pages/ContactPage';
import DepositPage from './pages/DepositPage';
import PaymentCompletePage from './pages/PaymentCompletePage';
import NotFoundPage from './pages/NotFoundPage';

/** Shows a page only while the artist has it switched on. */
function IfEnabled({ slug, children }: { slug: PageSlug; children: React.ReactElement }) {
  return usePage(slug)?.enabled ? children : <NotFoundPage />;
}

/** The atelier theme: a full-screen exhibition carousel with a monospace gallery feel. */
export default function AtelierSite() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<ExhibitionPage />} />
        <Route path="archive" element={<IfEnabled slug="gallery"><ArchivePage /></IfEnabled>} />
        <Route path="art/:id" element={<ArtworkPage />} />
        <Route path="checkout/:id" element={<CheckoutPage />} />
        <Route path="offers" element={<IfEnabled slug="offers"><OffersPage /></IfEnabled>} />
        <Route path="commission" element={<IfEnabled slug="commission"><CommissionPage /></IfEnabled>} />
        <Route path="commission/deposit" element={<DepositPage />} />
        <Route path="payment/complete" element={<PaymentCompletePage />} />
        <Route path="about" element={<IfEnabled slug="about"><AboutPage /></IfEnabled>} />
        <Route path="contact" element={<IfEnabled slug="contact"><ContactPage /></IfEnabled>} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
