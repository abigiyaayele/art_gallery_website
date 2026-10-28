import React from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import Layout from './components/layout/Layout';
import ExhibitionPage from './pages/ExhibitionPage';
import ArchivePage from './pages/ArchivePage';
import ArtworkPage from './pages/ArtworkPage';
import CheckoutPage from './pages/CheckoutPage';
import AboutPage from './pages/AboutPage';
import NotFoundPage from './pages/NotFoundPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<ExhibitionPage />} />
          <Route path="archive" element={<ArchivePage />} />
          <Route path="art/:id" element={<ArtworkPage />} />
          <Route path="checkout/:id" element={<CheckoutPage />} />
          <Route path="about" element={<AboutPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
