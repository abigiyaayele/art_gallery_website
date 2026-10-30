import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Trash2 } from 'lucide-react';
import { useState } from 'react';
import { ErrorText, PageHeader } from '../components/ui';
import { api } from '../lib/api';
import { useCategories } from '../lib/catalog';

export function CategoriesPage() {
  const categories = useCategories();
  const qc = useQueryClient();
  const [name, setName] = useState('');
  const refresh = () => qc.invalidateQueries({ queryKey: ['categories'] });
  const add = useMutation({
    mutationFn: () => api('/categories', { method: 'POST', json: { name, sortOrder: categories.data?.length ?? 0 } }),
    onSuccess: () => {
      setName('');
      refresh();
    },
  });
  const remove = useMutation({ mutationFn: (id: string) => api(`/categories/${id}`, { method: 'DELETE' }), onSuccess: refresh });

  return (
    <>
      <PageHeader title="Categories" description="Group your work, e.g. by series or subject. Visitors can filter by category on your website." />
      <div className="card max-w-xl space-y-4">
        <ul className="divide-y divide-stone-100">
          {categories.data?.map(c => (
            <li key={c.id} className="flex items-center justify-between py-2 text-sm">
              <span>
                {c.name} <span className="font-mono text-stone-400">/{c.slug}</span>
              </span>
              <button className="text-stone-400 hover:text-red-600" onClick={() => remove.mutate(c.id)} aria-label={`Delete ${c.name}`}>
                <Trash2 size={16} />
              </button>
            </li>
          ))}
        </ul>
        <form
          className="flex gap-2"
          onSubmit={e => {
            e.preventDefault();
            add.mutate();
          }}
        >
          <input className="input" placeholder="New category" required value={name} onChange={e => setName(e.target.value)} />
          <button className="btn-secondary">Add</button>
        </form>
        <ErrorText error={add.error ?? remove.error} />
      </div>
    </>
  );
}
