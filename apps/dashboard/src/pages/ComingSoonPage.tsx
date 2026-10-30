import { PageHeader, EmptyState } from '../components/ui';

export function ComingSoonPage({ title }: { title: string }) {
  return (
    <>
      <PageHeader title={title} />
      <EmptyState title="This section is on its way" />
    </>
  );
}
