import type { OrderDto, OrderStatus } from '@platform/contracts';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { useState } from 'react';
import { Badge, EmptyState, ErrorText, PageHeader, Spinner } from '../components/ui';
import { api } from '../lib/api';
import { date, money } from '../lib/format';

const tones: Record<OrderStatus, 'stone' | 'green' | 'amber' | 'red' | 'blue'> = {
  pending: 'amber',
  paid: 'green',
  shipped: 'blue',
  failed: 'red',
  expired: 'stone',
  refunded: 'stone',
};

const filters: { value: OrderStatus | ''; label: string }[] = [
  { value: '', label: 'All' },
  { value: 'paid', label: 'To ship' },
  { value: 'pending', label: 'Awaiting payment' },
  { value: 'shipped', label: 'Shipped' },
  { value: 'failed', label: 'Failed' },
];

export function ShopPage() {
  const qc = useQueryClient();
  const [status, setStatus] = useState<OrderStatus | ''>('');
  const orders = useQuery({ queryKey: ['orders', status], queryFn: () => api<OrderDto[]>(`/orders${status ? `?status=${status}` : ''}`) });
  const update = useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'shipped' | 'refunded' }) => api(`/orders/${id}`, { method: 'PATCH', json: { status } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['orders'] }),
  });

  return (
    <>
      <PageHeader
        title="Shop & orders"
        description="Payments made on your website. A paid artwork is marked sold automatically."
        actions={<Link to="/settings#payments" className="btn-secondary">Payment settings</Link>}
      />
      <div className="mb-4 flex flex-wrap gap-2">
        {filters.map(f => (
          <button key={f.value} onClick={() => setStatus(f.value)} className={status === f.value ? 'chip-active' : 'chip'}>
            {f.label}
          </button>
        ))}
      </div>
      <ErrorText error={orders.error ?? update.error} />
      {orders.isLoading ? (
        <Spinner />
      ) : !orders.data?.length ? (
        <EmptyState title="No orders yet">When someone buys a piece or pays a deposit on your site, it appears here.</EmptyState>
      ) : (
        <div className="card overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead className="eyebrow border-b border-stone-200 bg-stone-50 text-left">
              <tr>
                <th className="px-4 py-3">Order</th>
                <th className="px-4 py-3">Buyer</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {orders.data.map(o => (
                <tr key={o.id} className="align-top">
                  <td className="px-4 py-3">
                    <p className="font-medium">{o.kind === 'deposit' ? 'Commission deposit' : o.artworkTitle}</p>
                    <p className="text-xs text-stone-500">{date(o.createdAt)} · {o.txRef}</p>
                    {o.note && <p className="mt-1 text-xs text-stone-600">“{o.note}”</p>}
                  </td>
                  <td className="px-4 py-3">
                    <p>{o.buyer.name}</p>
                    <a href={`mailto:${o.buyer.email}`} className="text-xs text-stone-500 hover:underline">{o.buyer.email}</a>
                    {o.buyer.phone && <p className="text-xs text-stone-500">{o.buyer.phone}</p>}
                    {Object.keys(o.shipping).length > 0 && <p className="mt-1 text-xs text-stone-500">{Object.values(o.shipping).filter(Boolean).join(', ')}</p>}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">{money(o.amountCents, o.currency)}</td>
                  <td className="px-4 py-3"><Badge tone={tones[o.status]}>{o.status === 'paid' && o.kind === 'artwork' ? 'paid · to ship' : o.status}</Badge></td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    {o.status === 'paid' && o.kind === 'artwork' && (
                      <button className="btn-secondary" disabled={update.isPending} onClick={() => update.mutate({ id: o.id, status: 'shipped' })}>Mark shipped</button>
                    )}
                    {(o.status === 'paid' || o.status === 'shipped') && (
                      <button
                        className="ml-2 text-xs text-stone-500 underline"
                        onClick={() => confirm('Record this order as refunded? Refund the buyer in your Chapa dashboard first.') && update.mutate({ id: o.id, status: 'refunded' })}
                      >
                        Refunded
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
