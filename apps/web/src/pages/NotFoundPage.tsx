import React from 'react';
import { Link } from 'react-router-dom';
import { PageMain } from '../components/layout/Layout';

export default function NotFoundPage() {
  return (
    <PageMain className="flex flex-col items-center justify-center text-center px-4 gap-6">
      <p className="font-mono text-6xl text-text-faint">404</p>
      <p className="text-text-strong tracking-widest text-sm">THIS PAGE COULD NOT BE FOUND</p>
      <Link to="/" className="border border-border-color rounded-full px-8 py-3 hover:bg-text-strong hover:text-bg transition-colors tracking-widest text-xs font-bold">
        RETURN TO EXHIBITION
      </Link>
    </PageMain>
  );
}
