import { Sun, Moon, Menu, X } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { ZoomProvider } from './ZoomContext';

type Theme = 'green' | 'dark' | 'light';

export const navItems = [
  { to: '/', label: 'EXHIBITION' },
  { to: '/archive', label: 'ARCHIVE' },
  { to: '/offers', label: 'OFFERS' },
  { to: '/about', label: 'ABOUT' },
];

function navLabel(index: number, label: string) {
  return `${String(index + 1).padStart(3, '0')}/${label}`;
}

export default function Layout() {
  const [theme, setTheme] = useState<Theme>(() => {
    try {
      return (localStorage.getItem('theme') as Theme) || 'green';
    } catch {
      return 'green';
    }
  });
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    document.documentElement.classList.remove('light-theme', 'dark-theme');
    if (theme === 'light') {
      document.documentElement.classList.add('light-theme');
    } else if (theme === 'dark') {
      document.documentElement.classList.add('dark-theme');
    }
    try {
      localStorage.setItem('theme', theme);
    } catch {
      // Storage can be unavailable (private mode); the theme still applies for this visit.
    }
  }, [theme]);

  // Close the mobile menu whenever the route changes.
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  const toggleTheme = () => {
    setTheme(t => {
      if (t === 'green') return 'dark';
      if (t === 'dark') return 'light';
      return 'green';
    });
  };

  return (
    <ZoomProvider>
      <div className="h-dvh bg-bg text-text-base font-sans flex flex-col overflow-hidden selection:bg-text-strong selection:text-bg transition-colors duration-500">
        {/* Header */}
        <header className="flex justify-between items-center px-4 py-4 md:p-6 shrink-0 z-50">
          <Link to="/" className="flex items-center gap-3">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="text-text-muted">
              <path d="M2 12h20M12 2v20M4.93 4.93l14.14 14.14M19.07 4.93L4.93 19.07" />
            </svg>
            <div className="text-xs leading-tight tracking-widest text-text-strong uppercase">
              Seifu<br/>arts
            </div>
          </Link>

          <nav className="hidden lg:flex border border-border-color rounded-full px-6 py-2 gap-6 xl:gap-8 text-xs tracking-widest">
            {navItems.map((item, i) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) => `transition-colors whitespace-nowrap ${isActive ? 'text-text-strong' : 'text-text-muted hover:text-text-base'}`}
              >
                {navLabel(i, item.label)}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-3 md:gap-4">
            <button onClick={toggleTheme} aria-label="Change theme" className="w-10 h-10 border border-border-color rounded-full flex items-center justify-center text-text-muted hover:text-text-strong hover:border-text-muted transition-colors">
              {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            </button>
            <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} aria-label="Menu" className="lg:hidden w-10 h-10 border border-border-color rounded-full flex items-center justify-center text-text-muted hover:text-text-strong hover:border-text-muted transition-colors">
              {isMobileMenuOpen ? <X size={16} /> : <Menu size={16} />}
            </button>
          </div>
        </header>

        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.nav
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="fixed inset-0 z-40 bg-bg flex flex-col items-center justify-center gap-6 md:gap-8 text-lg md:text-xl tracking-widest uppercase"
            >
              {navItems.map((item, i) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/'}
                  className={({ isActive }) => `transition-colors ${isActive ? 'text-text-strong' : 'text-text-muted'}`}
                >
                  {navLabel(i, item.label)}
                </NavLink>
              ))}
            </motion.nav>
          )}
        </AnimatePresence>

        <Outlet />
      </div>
    </ZoomProvider>
  );
}

/** Scrollable page body used by every page except the full-screen exhibition. */
export function PageMain({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <main className={`flex-1 overflow-y-auto overflow-x-hidden w-full z-10 no-scrollbar ${className}`}>
      {children}
    </main>
  );
}

/** Thin top bar with a back link and a label, used on detail and checkout pages. */
export function BackBar({ to, label, title }: { to: string; label: string; title: string }) {
  return (
    <div className="flex justify-between gap-4 px-4 md:px-6 py-4 text-xs tracking-widest shrink-0 text-text-strong uppercase border-b border-border-color/20">
      <Link to={to} className="flex items-center gap-2 hover:text-accent transition-colors">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 12H5M12 19l-7-7 7-7"/>
        </svg>
        {label}
      </Link>
      <span className="truncate">{title}</span>
    </div>
  );
}
