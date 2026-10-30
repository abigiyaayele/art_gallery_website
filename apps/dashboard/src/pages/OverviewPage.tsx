import type { OverviewData } from '@platform/contracts';
import { useQuery } from '@tanstack/react-query';
import { ArrowUpRight, Brush, CircleDollarSign, Inbox, ShoppingBag, type LucideIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ErrorText, PageHeader, Spinner } from '../components/ui';
import { api } from '../lib/api';
import { date, money } from '../lib/format';
import { useWorkspace } from '../lib/auth';

const totals = (list: { currency: string; cents: number }[]) => (list.length ? list.map(t => money(t.cents, t.currency)).join(' + ') : money(0));

function Stat({ label, value, to, hint, icon: Icon }: { label: string; value: string | number; to?: string; hint?: string; icon: LucideIcon }) {
  const body = (
    <>
      <div className="flex items-center justify-between">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-stone-100 text-stone-600 transition group-hover:bg-accent-50 group-hover:text-accent-600">
          <Icon size={16} strokeWidth={1.75} />
        </span>
        {to && <ArrowUpRight size={16} className="text-stone-300 transition group-hover:text-stone-600" />}
      </div>
      <p className="display mt-4 text-4xl leading-none tabular-nums text-stone-900">{value}</p>
      <p className="mt-2 text-sm font-medium text-stone-700">{label}</p>
      {hint && <p className="mt-0.5 truncate text-xs text-stone-500">{hint}</p>}
    </>
  );
  return to ? (
    <Link to={to} className="card group block transition hover:-translate-y-0.5 hover:shadow-lift">
      {body}
    </Link>
  ) : (
    <div className="card group">{body}</div>
  );
}

/** Thirty days of visits as simple bars; days without visits show as gaps. */
function Visits({ views }: { views: OverviewData['views'] }) {
  const days = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(Date.now() - (13 - i) * 86_400_000).toISOString().slice(0, 10);
    return { day: d, views: views.find(v => v.day === d)?.views ?? 0 };
  });
  const max = Math.max(1, ...days.map(d => d.views));
  const total = days.reduce((n, d) => n + d.views, 0);
  return (
    <div className="card">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-2">
        <div>
          <p className="eyebrow">Website visits</p>
          <p className="display mt-1 text-4xl leading-none tabular-nums">{total}</p>
        </div>
        <span className="text-sm text-stone-500">page views, last 14 days</span>
      </div>
      <div className="flex h-36 items-end gap-1.5" role="img" aria-label={`${total} page views in the last 14 days`}>
        {days.map(d => (
          <div
            key={d.day}
            title={`${date(d.day)}: ${d.views}`}
            className={`flex-1 rounded-md transition-colors ${d.views ? 'bg-accent-500 hover:bg-accent-600' : 'bg-stone-100'}`}
            style={{ height: `${Math.max(4, (d.views / max) * 100)}%` }}
          />
        ))}
      </div>
      <div className="mt-2 flex justify-between text-[11px] text-stone-400">
        <span>{date(days[0].day)}</span>
        <span>Today</span>
      </div>
    </div>
  );
}

export function OverviewPage() {
  const { workspace } = useWorkspace();
  const overview = useQuery({ queryKey: ['overview'], queryFn: () => api<OverviewData>('/overview'), refetchInterval: 60_000 });
  const o = overview.data;

  return (
    <>
      <PageHeader
        eyebrow={new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
        title={`Welcome back${workspace ? `, ${workspace.tenantName}` : ''}`}
        description="How your work and your website are doing."
      />
      <ErrorText error={overview.error} />
      {!o ? (
        !overview.error && <Spinner />
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            <Stat label="Published works" value={o.artworks.available} to="/artworks" icon={Brush} hint={`${o.artworks.draft} drafts · ${o.artworks.onSale} on offer`} />
            <Stat label="Sold this month" value={o.soldThisMonth.count} to="/sold" icon={CircleDollarSign} hint={totals(o.soldThisMonth.totals)} />
            <Stat label="Orders to ship" value={o.orders.toShip} to="/shop" icon={ShoppingBag} hint={`${o.orders.pending} awaiting payment`} />
            <Stat label="New inquiries" value={o.inquiries.new} to="/inquiries" icon={Inbox} />
          </div>
          <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
            <Visits views={o.views} />
            <div className="card">
              <p className="eyebrow mb-4">Most visited pages</p>
              {o.topPages.length ? (
                <ul className="space-y-2 text-sm">
                  {o.topPages.map(p => (
                    <li key={p.path} className="flex justify-between gap-4 border-b border-stone-100 pb-2 last:border-0">
                      <span className="truncate text-stone-700">{p.path}</span>
                      <span className="tabular-nums text-stone-500">{p.views}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-stone-500">No visits recorded yet.</p>
              )}
            </div>
          </div>
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="card">
              <p className="eyebrow">Online revenue · last 30 days</p>
              <p className="display mt-3 text-5xl leading-none tabular-nums">{totals(o.revenue30d)}</p>
              <Link to="/shop" className="mt-4 inline-flex items-center gap-1 text-sm text-accent-600 hover:text-accent-700">
                View orders <ArrowUpRight size={14} />
              </Link>
            </div>
            <div className="card">
              <p className="eyebrow mb-4">Recent activity</p>
              {o.recent.length ? (
                <ul className="space-y-2 text-sm">
                  {o.recent.map((r, i) => (
                    <li key={i} className="flex justify-between gap-4 border-b border-stone-100 pb-2 last:border-0">
                      <span className="truncate">
                        <span className="text-stone-500">{{ sold: 'Sold', published: 'Published', order: 'Order', inquiry: 'Inquiry' }[r.kind]}:</span> {r.title}
                      </span>
                      <span className="shrink-0 text-stone-500">{date(r.at)}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-stone-500">Nothing yet.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
