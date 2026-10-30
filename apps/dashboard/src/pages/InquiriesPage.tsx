import type { InquiryDto } from '@platform/contracts';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Mail } from 'lucide-react';
import { useState } from 'react';
import { Badge, EmptyState, ErrorText, PageHeader, Spinner } from '../components/ui';
import { api } from '../lib/api';
import { date } from '../lib/format';

type Status = InquiryDto['status'];
const kindLabel: Record<InquiryDto['kind'], string> = { contact: 'Message', commission: 'Commission request', purchase: 'Buying question' };

export function InquiriesPage() {
  const qc = useQueryClient();
  const [status, setStatus] = useState<Status>('new');
  const [open, setOpen] = useState<string | null>(null);
  const inquiries = useQuery({ queryKey: ['inquiries', status], queryFn: () => api<InquiryDto[]>(`/inquiries?status=${status}`) });
  const update = useMutation({
    mutationFn: ({ id, status }: { id: string; status: Status }) => api(`/inquiries/${id}`, { method: 'PATCH', json: { status } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['inquiries'] }),
  });

  return (
    <>
      <PageHeader title="Inquiries" description="Messages and commission requests sent from your website." />
      <div className="mb-4 flex gap-2">
        {(['new', 'replied', 'archived'] as const).map(s => (
          <button key={s} onClick={() => setStatus(s)} className={`capitalize ${status === s ? 'chip-active' : 'chip'}`}>
            {s}
          </button>
        ))}
      </div>
      <ErrorText error={inquiries.error ?? update.error} />
      {inquiries.isLoading ? (
        <Spinner />
      ) : !inquiries.data?.length ? (
        <EmptyState title={status === 'new' ? 'No new inquiries' : `Nothing ${status}`}>Messages from your contact and commission forms land here.</EmptyState>
      ) : (
        <ul className="space-y-3">
          {inquiries.data.map(q => {
            const expanded = open === q.id;
            const details = Object.entries(q.details);
            return (
              <li key={q.id} className="card">
                <button className="flex w-full items-start justify-between gap-4 text-left" onClick={() => setOpen(expanded ? null : q.id)}>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{q.name}</p>
                      <Badge tone={q.kind === 'commission' ? 'blue' : q.kind === 'purchase' ? 'green' : 'stone'}>{kindLabel[q.kind]}</Badge>
                    </div>
                    <p className="truncate text-sm text-stone-500">{q.subject || q.message}</p>
                  </div>
                  <span className="shrink-0 text-xs text-stone-500">{date(q.createdAt)}</span>
                </button>
                {expanded && (
                  <div className="mt-4 space-y-4 border-t border-stone-100 pt-4 text-sm">
                    <p className="whitespace-pre-line">{q.message}</p>
                    {details.length > 0 && (
                      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1">
                        {details.map(([k, v]) => (
                          <div key={k} className="contents">
                            <dt className="capitalize text-stone-500">{k}</dt>
                            <dd>{v}</dd>
                          </div>
                        ))}
                      </dl>
                    )}
                    <p className="text-stone-500">{q.email}{q.phone && ` · ${q.phone}`}</p>
                    <div className="flex flex-wrap gap-2">
                      <a
                        className="btn-primary"
                        href={`mailto:${q.email}?subject=${encodeURIComponent(`Re: ${q.subject || kindLabel[q.kind]}`)}`}
                        onClick={() => q.status === 'new' && update.mutate({ id: q.id, status: 'replied' })}
                      >
                        <Mail size={14} /> Reply by email
                      </a>
                      {q.status !== 'replied' && <button className="btn-secondary" onClick={() => update.mutate({ id: q.id, status: 'replied' })}>Mark replied</button>}
                      {q.status !== 'archived' && <button className="btn-secondary" onClick={() => update.mutate({ id: q.id, status: 'archived' })}>Archive</button>}
                      {q.status !== 'new' && <button className="btn-secondary" onClick={() => update.mutate({ id: q.id, status: 'new' })}>Move to new</button>}
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
