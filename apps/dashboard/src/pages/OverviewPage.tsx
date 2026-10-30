import type { OverviewData } from '@platform/contracts';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { ErrorText, PageHeader, Spinner } from '../components/ui';
import { api } from '../lib/api';
import { date, money } from '../lib/format';
import { useWorkspace } from '../lib/auth';

const totals = (list: { currency: string; cents: number }[]) => (list.length ? list.map(t => money(t.cents, t.currency)).join(' + ') : money(0));

function Stat({ label, value, to, hint }: { label: string; value: string | number; to?: string; hint?: string }) {
  const body = (
    <>
      <p className="text-sm text-stone-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold tabular-nums">{value}</p>
      {hint && <p className="mt-1 text-xs text-stone-500">{hint}</p>}
    </>
  );
  return to ? <Link to={to} className="card block hover:border-stone-400">{body}</Link> : <div className="card">{body}</div>;
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
      <div className="mb-4 flex items-baseline justify-between">
        <h2 className="font-semibold">Website visits</h2>
        <span className="text-sm text-stone-500">{total} page views in 14 days</span>
      </div>
      <div className="flex h-32 items-end gap-1" role="img" aria-label={`${total} page views in the last 14 days`}>
        {days.map(d => (
          <div key={d.day} title={`${date(d.day)}: ${d.views}`} className="flex-1 rounded-t bg-stone-800" style={{ height: `${Math.max(2, (d.views / max) * 100)}%`, opacity: d.views ? 1 : 0.15 }} />
        ))}
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
      <PageHeader title={`Welcome back${workspace ? `, ${workspace.tenantName}` : ''}`} description="How your work and your website are doing." />
      <ErrorText error={overview.error} />
      {!o ? (
        !overview.error && <Spinner />
      ) : (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Stat label="Published works" value={o.artworks.available} to="/artworks" hint={`${o.artworks.draft} drafts · ${o.artworks.onSale} on offer`} />
            <Stat label="Sold this month" value={o.soldThisMonth.count} to="/sold" hint={totals(o.soldThisMonth.totals)} />
            <Stat label="Orders to ship" value={o.orders.toShip} to="/shop" hint={`${o.orders.pending} awaiting payment`} />
            <Stat label="New inquiries" value={o.inquiries.new} to="/inquiries" />
          </div>
          <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
            <Visits views={o.views} />
            <div className="card">
              <h2 className="mb-3 font-semibold">Most visited pages</h2>
              {o.topPages.length ? (
                <ul className="space-y-2 text-sm">
                  {o.topPages.map(p => (
                    <li key={p.path} className="flex justify-between gap-4">
                      <span className="truncate font-mono text-stone-600">{p.path}</span>
                      <span className="tabular-nums">{p.views}</span>
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
              <h2 className="mb-1 font-semibold">Online revenue, last 30 days</h2>
              <p className="text-2xl font-semibold tabular-nums">{totals(o.revenue30d)}</p>
            </div>
            <div className="card">
              <h2 className="mb-3 font-semibold">Recent activity</h2>
              {o.recent.length ? (
                <ul className="space-y-2 text-sm">
                  {o.recent.map((r, i) => (
                    <li key={i} className="flex justify-between gap-4">
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
