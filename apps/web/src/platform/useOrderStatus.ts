import type { PublicOrderStatus } from '@platform/contracts';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { platform } from './api';

/**
 * Status of the order a buyer just paid for, read from the `tx_ref` the
 * payment page sends them back with. Keeps checking while it is pending,
 * since the provider can confirm a moment after the buyer lands.
 */
export function useOrderStatus() {
  const [params] = useSearchParams();
  const txRef = params.get('tx_ref') || params.get('trx_ref') || '';
  const [result, setResult] = useState<PublicOrderStatus | null>(null);
  const [failed, setFailed] = useState(!txRef);

  useEffect(() => {
    if (!txRef) return;
    let cancelled = false;
    let tries = 0;
    const check = () =>
      platform.orderStatus(txRef).then(
        r => {
          if (cancelled) return;
          setResult(r);
          if (r.status === 'pending' && ++tries < 10) setTimeout(check, 3000);
        },
        () => !cancelled && setFailed(true),
      );
    void check();
    return () => {
      cancelled = true;
    };
  }, [txRef]);

  const paid = result?.status === 'paid' || result?.status === 'shipped';
  const state = failed ? 'missing' : !result ? 'loading' : paid ? 'paid' : result.status === 'pending' ? 'pending' : 'unpaid';
  return { state, result } as const;
}
