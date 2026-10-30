import { Link } from 'react-router-dom';
import { EmptyState, ErrorText, PageHeader, Spinner } from '../components/ui';
import { useArtworkAction, useArtworks } from '../lib/catalog';
import { date, money } from '../lib/format';
import { useWorkspace } from '../lib/auth';

export function SoldPage() {
  const sold = useArtworks({ status: 'sold' });
  const action = useArtworkAction();
  const { isOwner } = useWorkspace();
  const items = sold.data?.items ?? [];
  const totals = items.reduce<Record<string, number>>((acc, a) => {
    acc[a.currency] = (acc[a.currency] ?? 0) + (a.price?.effectiveCents ?? 0);
    return acc;
  }, {});

  return (
    <>
      <PageHeader
        title="Sold work"
        description={
          items.length
            ? `${items.length} sold · ${Object.entries(totals)
                .map(([c, v]) => money(v, c))
                .join(' + ')} at list price`
            : undefined
        }
      />
      <ErrorText error={action.error} />
      {sold.isLoading ? (
        <Spinner />
      ) : items.length === 0 ? (
        <EmptyState title="Nothing sold yet">When a painting sells online, or you mark it sold, it shows here.</EmptyState>
      ) : (
        <div className="card overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead className="border-b border-stone-200 text-left text-stone-500">
              <tr>
                <th className="px-4 py-3 font-medium">Artwork</th>
                <th className="px-4 py-3 font-medium">Sold on</th>
                <th className="px-4 py-3 font-medium">Price</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {items.map(a => (
                <tr key={a.id} className="border-b border-stone-100 last:border-0">
                  <td className="px-4 py-2">
                    <Link to={`/artworks/${a.id}`} className="flex items-center gap-3 hover:underline">
                      {a.images[0]?.urls.thumb && <img src={a.images[0].urls.thumb} alt="" className="h-10 w-10 rounded object-cover" />}
                      {a.title}
                    </Link>
                  </td>
                  <td className="px-4 py-2">{date(a.soldAt)}</td>
                  <td className="px-4 py-2">{money(a.price?.effectiveCents, a.currency)}</td>
                  <td className="px-4 py-2 text-right">
                    {isOwner && (
                      <button className="text-xs text-stone-500 hover:text-stone-900" onClick={() => action.mutate({ id: a.id, action: 'revert-sold' })}>
                        Revert sale
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
