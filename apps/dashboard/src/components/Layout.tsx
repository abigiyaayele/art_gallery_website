import {
  Brush,
  Building2,
  FolderTree,
  CircleDollarSign,
  Globe,
  Image,
  Inbox,
  LayoutDashboard,
  LogOut,
  Menu,
  Settings,
  ShoppingBag,
  Sparkles,
  Tag,
  Target,
  User,
  X,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useAuth, useWorkspace } from '../lib/auth';

const nav = [
  { to: '/', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/artworks', label: 'Artworks', icon: Brush },
  { to: '/categories', label: 'Categories', icon: FolderTree },
  { to: '/media', label: 'Images', icon: Image },
  { to: '/pricing', label: 'Pricing & discounts', icon: Tag },
  { to: '/sold', label: 'Sold work', icon: CircleDollarSign },
  { to: '/shop', label: 'Shop & orders', icon: ShoppingBag },
  { to: '/inquiries', label: 'Inquiries', icon: Inbox },
  { to: '/website', label: 'Website', icon: Globe },
  { to: '/profile', label: 'Profile', icon: User },
  { to: '/assistant', label: 'AI assistant', icon: Sparkles },
  { to: '/goals', label: 'Goals & journal', icon: Target },
  { to: '/settings', label: 'Settings', icon: Settings },
];

export function Layout() {
  const { session, logout, switchTenant } = useAuth();
  const { workspace } = useWorkspace();
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open]);

  const sidebar = (
    <nav className="flex h-full flex-col gap-1 overflow-y-auto p-3">
      <div className="mb-3 px-2 pt-2">
        <p className="text-xs uppercase tracking-wider text-stone-500">Workspace</p>
        {session && session.workspaces.length > 1 ? (
          <select className="input mt-1" value={workspace?.tenantId ?? ''} onChange={e => switchTenant(e.target.value)} aria-label="Switch workspace">
            {session.workspaces.map(w => (
              <option key={w.tenantId} value={w.tenantId}>
                {w.tenantName}
              </option>
            ))}
          </select>
        ) : (
          <p className="mt-1 font-semibold">{workspace?.tenantName ?? 'No workspace'}</p>
        )}
      </div>
      {workspace &&
        nav.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            onClick={() => setOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-md px-3 py-2 text-sm ${isActive ? 'bg-stone-900 text-white' : 'text-stone-700 hover:bg-stone-100'}`
            }
          >
            <item.icon size={16} />
            {item.label}
          </NavLink>
        ))}
      {session?.user.isPlatformAdmin && (
        <NavLink
          to="/admin/tenants"
          onClick={() => setOpen(false)}
          className={({ isActive }) =>
            `mt-3 flex items-center gap-3 rounded-md px-3 py-2 text-sm ${isActive ? 'bg-stone-900 text-white' : 'text-stone-700 hover:bg-stone-100'}`
          }
        >
          <Building2 size={16} />
          Tenants (admin)
        </NavLink>
      )}
      <div className="mt-auto border-t border-stone-200 px-2 pt-3 text-sm">
        <p className="truncate font-medium">{session?.user.name}</p>
        <p className="truncate text-stone-500">{session?.user.email}</p>
        <button className="mt-2 flex items-center gap-2 text-stone-600 hover:text-stone-900" onClick={logout}>
          <LogOut size={14} /> Sign out
        </button>
      </div>
    </nav>
  );

  return (
    <div className="min-h-screen lg:flex">
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-stone-200 bg-white px-4 py-3 lg:hidden">
        <span className="truncate font-semibold">{workspace?.tenantName ?? 'Dashboard'}</span>
        <button className="-mr-1 p-1" onClick={() => setOpen(true)} aria-label="Open menu" aria-expanded={open}>
          <Menu />
        </button>
      </header>
      {open && <div className="fixed inset-0 z-40 bg-stone-900/40 lg:hidden" onClick={() => setOpen(false)} aria-hidden />}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] border-r border-stone-200 bg-white transition-transform duration-200 lg:sticky lg:top-0 lg:z-auto lg:h-screen lg:w-64 lg:max-w-none lg:shrink-0 lg:translate-x-0 ${open ? 'translate-x-0 shadow-xl' : '-translate-x-full'}`}
      >
        <button className="absolute right-3 top-3 p-1 text-stone-500 hover:text-stone-900 lg:hidden" onClick={() => setOpen(false)} aria-label="Close menu">
          <X size={20} />
        </button>
        {sidebar}
      </aside>
      <main className="min-w-0 flex-1 px-4 py-6 md:px-8 md:py-8 lg:px-10">
        <div className="mx-auto max-w-6xl">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
