import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { platform } from '../../../platform/api';
import { useCatalog } from '../data';
import { PageMain } from '../components/layout/Layout';
import { Field, inputClass } from '../components/forms/Field';

export default function DepositPage() {
  const { allArtworks, paymentsEnabled } = useCatalog();
  const currency = allArtworks[0]?.currency ?? 'USD';
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const text = (key: string) => String(form.get(key) ?? '').trim();
    setSending(true);
    setError('');
    try {
      const started = await platform.deposit({
        buyer: { name: `${text('firstName')} ${text('lastName')}`.trim(), email: text('email') },
        amountCents: Math.round(Number(text('amount')) * 100),
        currency,
        note: text('note'),
      });
      // Hand off to the hosted payment page; it returns to /payment/complete.
      window.location.href = started.checkoutUrl;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Payment failed to start.');
      setSending(false);
    }
  };

  if (!paymentsEnabled) {
    return (
      <PageMain className="flex flex-col items-center justify-center text-center px-4 gap-6">
        <p className="text-text-strong tracking-widest text-lg font-bold">ONLINE DEPOSITS ARE NOT OPEN YET</p>
        <p className="max-w-md text-sm">Contact the studio and the artist will tell you how to pay your deposit.</p>
        <Link to="/contact" className="border border-border-color rounded-full px-8 py-3 hover:bg-text-strong hover:text-bg transition-colors tracking-widest text-xs font-bold">
          CONTACT THE STUDIO
        </Link>
      </PageMain>
    );
  }

  return (
    <PageMain>
      <div className="max-w-xl mx-auto px-4 md:px-8 py-8 md:py-16 space-y-8">
        <header className="text-center space-y-4">
          <p className="text-text-muted text-xs tracking-widest uppercase">// Commission deposit</p>
          <h1 className="font-cursive text-5xl md:text-6xl text-text-strong leading-none">Pay your deposit</h1>
          <p className="text-sm md:text-base">
            Received a quote for your painting? Pay the deposit amount from your quote to book your place in the studio schedule.
            Haven't asked yet? <Link to="/commission" className="text-text-strong underline underline-offset-4">Request a painting first</Link>.
          </p>
        </header>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4 font-sans">
          <Field label="First name"><input name="firstName" required className={inputClass} /></Field>
          <Field label="Last name"><input name="lastName" required className={inputClass} /></Field>
          <Field label="Email" className="sm:col-span-2" hint="Use the same email as your commission request.">
            <input name="email" type="email" required className={inputClass} />
          </Field>
          <Field label={`Deposit amount (${currency})`} className="sm:col-span-2">
            <input name="amount" type="number" min="1" step="0.01" required className={inputClass} />
          </Field>
          <Field label="Quote reference or note (optional)" className="sm:col-span-2">
            <input name="note" className={inputClass} />
          </Field>
          <div className="sm:col-span-2 space-y-4 pt-2">
            <button type="submit" disabled={sending} className="w-full bg-action-bg text-action-text rounded-full px-10 py-4 hover:opacity-80 transition-opacity tracking-widest text-xs font-bold uppercase disabled:opacity-50">
              {sending ? 'REDIRECTING TO PAYMENT...' : 'PAY DEPOSIT SECURELY'}
            </button>
            {error && <p role="alert" className="text-red-400 text-sm text-center">{error}</p>}
          </div>
        </form>
      </div>
    </PageMain>
  );
}
