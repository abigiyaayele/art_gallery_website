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

const groups = [
  {
    label: 'Studio',
    items: [
      { to: '/', label: 'Overview', icon: LayoutDashboard, end: true },
      { to: '/artworks', label: 'Artworks', icon: Brush },
      { to: '/categories', label: 'Categories', icon: FolderTree },
      { to: '/media', label: 'Images', icon: Image },
    ],
  },
  {
    label: 'Sales',
    items: [
      { to: '/pricing', label: 'Pricing & discounts', icon: Tag },
      { to: '/sold', label: 'Sold work', icon: CircleDollarSign },
      { to: '/shop', label: 'Shop & orders', icon: ShoppingBag },
      { to: '/inquiries', label: 'Inquiries', icon: Inbox },
    ],
  },
  {
    label: 'Website',
    items: [
      { to: '/website', label: 'Website', icon: Globe },
      { to: '/profile', label: 'Profile', icon: User },
    ],
  },
  {
    label: 'Practice',
    items: [
      { to: '/assistant', label: 'AI assistant', icon: Sparkles },
      { to: '/goals', label: 'Goals & journal', icon: Target },
      { to: '/settings', label: 'Settings', icon: Settings },
    ],
  },
];

const linkClass = ({ isActive }: { isActive: boolean }) =>
  `group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition ${
    isActive ? 'bg-white font-medium text-stone-900 shadow-soft ring-1 ring-stone-200/80' : 'text-stone-600 hover:bg-white/60 hover:text-stone-900'
  }`;

const initials = (name?: string) =>
  (name ?? '?')
    .split(/\s+/)
    .map(w => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

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
    <nav className="flex h-full flex-col overflow-y-auto px-3 pb-3 pt-5">
      <div className="mb-6 flex items-center gap-3 px-2">
        <span className="display flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-stone-900 text-xl text-stone-50">
          {initials(workspace?.tenantName)}
        </span>
        <div className="min-w-0 flex-1">
          <p className="eyebrow">Studio</p>
          {session && session.workspaces.length > 1 ? (
            <select
              className="-ml-1 w-full truncate rounded bg-transparent font-medium text-stone-900 outline-none"
              value={workspace?.tenantId ?? ''}
              onChange={e => switchTenant(e.target.value)}
              aria-label="Switch workspace"
            >
              {session.workspaces.map(w => (
                <option key={w.tenantId} value={w.tenantId}>
                  {w.tenantName}
                </option>
              ))}
            </select>
          ) : (
            <p className="truncate font-medium text-stone-900">{workspace?.tenantName ?? 'No workspace'}</p>
          )}
        </div>
      </div>
      {workspace &&
        groups.map(group => (
          <div key={group.label} className="mb-4">
            <p className="eyebrow mb-1.5 px-3 text-stone-400">{group.label}</p>
            <div className="space-y-0.5">
              {group.items.map(item => (
                <NavLink key={item.to} to={item.to} end={item.end} onClick={() => setOpen(false)} className={linkClass}>
                  {({ isActive }) => (
                    <>
                      <item.icon size={16} strokeWidth={isActive ? 2 : 1.75} className={isActive ? 'text-accent-500' : 'text-stone-400 group-hover:text-stone-600'} />
                      {item.label}
                    </>
                  )}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      {session?.user.isPlatformAdmin && (
        <div className="mb-4">
          <p className="eyebrow mb-1.5 px-3 text-stone-400">Platform</p>
          <NavLink to="/admin/tenants" onClick={() => setOpen(false)} className={linkClass}>
            <Building2 size={16} strokeWidth={1.75} className="text-stone-400" />
            Tenants
          </NavLink>
        </div>
      )}
      <div className="mt-auto flex items-center gap-3 rounded-xl border border-stone-200/80 bg-white/70 p-3 text-sm">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent-100 text-xs font-semibold text-accent-700">
          {initials(session?.user.name)}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium">{session?.user.name}</p>
          <p className="truncate text-xs text-stone-500">{session?.user.email}</p>
        </div>
        <button className="rounded-md p-1.5 text-stone-400 hover:bg-stone-100 hover:text-stone-900" onClick={logout} aria-label="Sign out" title="Sign out">
          <LogOut size={15} />
        </button>
      </div>
    </nav>
  );

  return (
    <div className="min-h-screen lg:flex">
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-stone-200/80 bg-paper/85 px-4 py-3 backdrop-blur lg:hidden">
        <span className="flex min-w-0 items-center gap-2.5">
          <span className="display flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-stone-900 text-base text-stone-50">{initials(workspace?.tenantName)}</span>
          <span className="truncate font-medium">{workspace?.tenantName ?? 'Dashboard'}</span>
        </span>
        <button className="-mr-1 p-1" onClick={() => setOpen(true)} aria-label="Open menu" aria-expanded={open}>
          <Menu />
        </button>
      </header>
      {open && <div className="fixed inset-0 z-40 bg-stone-950/30 backdrop-blur-[2px] lg:hidden" onClick={() => setOpen(false)} aria-hidden />}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] border-r border-stone-200/80 bg-canvas transition-transform duration-200 lg:sticky lg:top-0 lg:z-auto lg:h-screen lg:w-[17rem] lg:max-w-none lg:shrink-0 lg:translate-x-0 ${open ? 'translate-x-0 shadow-xl' : '-translate-x-full'}`}
      >
        <button className="absolute right-3 top-3 p-1 text-stone-500 hover:text-stone-900 lg:hidden" onClick={() => setOpen(false)} aria-label="Close menu">
          <X size={20} />
        </button>
        {sidebar}
      </aside>
      <main className="min-w-0 flex-1 px-4 py-8 md:px-8 md:py-10 lg:px-12 lg:py-12">
        <div className="mx-auto max-w-6xl">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
