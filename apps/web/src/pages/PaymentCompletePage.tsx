import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { formatPrice } from '../data/artworks';
import { PaymentResult, verifyPayment } from '../lib/payments';
import { PageMain } from '../components/layout/Layout';

export default function PaymentCompletePage() {
  const [params] = useSearchParams();
  const txRef = params.get('tx_ref') || params.get('trx_ref') || '';
  const [result, setResult] = useState<PaymentResult | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!txRef) {
      setFailed(true);
      return;
    }
    verifyPayment(txRef).then(setResult).catch(() => setFailed(true));
  }, [txRef]);

  let title = 'CHECKING YOUR PAYMENT...';
  let message = 'This only takes a moment.';
  if (failed) {
    title = 'WE COULD NOT FIND THIS PAYMENT';
    message = 'If money left your account, contact the studio with your receipt and we will sort it out.';
  } else if (result?.status === 'paid') {
    title = 'THANK YOU!';
    message = result.kind === 'artwork'
      ? `Your payment of ${formatPrice(result.amount)} for "${result.artworkTitle}" is confirmed. We will email you about shipping.`
      : `Your commission deposit of ${formatPrice(result.amount)} is confirmed. The artist will be in touch to start your painting.`;
  } else if (result) {
    title = 'PAYMENT NOT COMPLETED';
    message = 'The payment was not completed. No money was taken. You can try again whenever you are ready.';
  }

  return (
    <PageMain className="flex flex-col items-center justify-center text-center px-4 gap-6">
      <p className="text-text-strong tracking-widest text-lg md:text-2xl font-bold">{title}</p>
      <p className="max-w-md text-sm md:text-base">{message}</p>
      <div className="flex flex-col sm:flex-row gap-4">
        <Link to="/" className="border border-border-color rounded-full px-8 py-3 hover:bg-text-strong hover:text-bg transition-colors tracking-widest text-xs font-bold">
          RETURN TO EXHIBITION
        </Link>
        <Link to="/contact" className="border border-border-color rounded-full px-8 py-3 hover:bg-text-strong hover:text-bg transition-colors tracking-widest text-xs font-bold">
          CONTACT THE STUDIO
        </Link>
      </div>
    </PageMain>
  );
}
