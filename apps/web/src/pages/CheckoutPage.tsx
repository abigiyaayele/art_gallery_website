import React, { useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { getArtwork, formatPrice, currentPrice } from '../data/artworks';
import { PriceTag } from '../components/artwork/PriceTag';
import { BackBar } from '../components/layout/Layout';
import NotFoundPage from './NotFoundPage';
import type { FromState } from './ArtworkPage';
import { inputClass } from '../components/forms/Field';
import { startArtworkCheckout } from '../lib/payments';

export default function CheckoutPage() {
  const { id } = useParams();
  const state = (useLocation().state ?? {}) as FromState;
  const artwork = getArtwork(Number(id));
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  if (!artwork) return <NotFoundPage />;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = Object.fromEntries(new FormData(e.currentTarget)) as Record<string, string>;
    setSending(true);
    setError('');
    try {
      // Hand off to Chapa's hosted payment page; it returns to /payment/complete.
      window.location.href = await startArtworkCheckout({ ...form, artworkId: artwork.id });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Payment failed to start.');
      setSending(false);
    }
  };

  return (
    <main className="flex-1 flex flex-col relative overflow-hidden bg-bg min-h-0">
      <BackBar to={state.from ?? `/art/${artwork.id}`} label={`BACK TO ${state.fromLabel ?? 'STORY'}`} title="SECURE CHECKOUT" />

      <div className="flex-1 overflow-y-auto no-scrollbar flex justify-center">
        <div className="flex flex-col md:flex-row w-full max-w-6xl min-h-full md:border-x border-border-color/20">
          {/* Left Side: Item Summary */}
          <div className="w-full md:w-1/2 p-6 md:p-12 lg:p-16 flex flex-col border-b md:border-b-0 md:border-r border-border-color/20">
            <div className="mb-6 md:mb-8 text-text-muted text-xs tracking-widest uppercase">// ACQUISITION SUMMARY</div>
            <div className="flex md:flex-col gap-6 md:gap-0">
              <div className="relative w-28 sm:w-40 md:w-full aspect-square md:max-w-[400px] shrink-0 md:mb-8">
                <img src={artwork.image} alt={artwork.title} className="w-full h-full object-contain" draggable={false} />
              </div>
              <div className="space-y-3 md:space-y-4 min-w-0">
                <div>
                  <div className="text-text-muted text-xs mb-1">// TITLE</div>
                  <div className="text-text-strong font-bold text-base md:text-xl tracking-widest font-sans">{artwork.title}</div>
                </div>
                <div>
                  <div className="text-text-muted text-xs mb-1">// DIMENSION</div>
                  <div className="text-text-base">{artwork.dimensions}</div>
                </div>
                <div>
                  <div className="text-text-muted text-xs mb-1">// PRICE</div>
                  <PriceTag artwork={artwork} className="text-base md:text-xl" />
                </div>
              </div>
            </div>
          </div>

          {/* Right Side: Checkout Form */}
          <div className="w-full md:w-1/2 p-6 md:p-12 lg:p-16 flex flex-col bg-bg/50">
            <div className="max-w-md w-full mx-auto">
              {artwork.sold ? (
                <div className="space-y-6 text-center md:text-left">
                  <p className="text-text-strong font-bold tracking-widest">THIS PIECE HAS BEEN SOLD</p>
                  <p className="text-sm">It is no longer available, but the artist can paint something similar for you.</p>
                  <Link to={`/commission?inspired=${artwork.id}`} className="inline-block mr-3 mb-3 bg-action-bg text-action-text rounded-full px-8 py-3 hover:opacity-80 transition-opacity tracking-widest text-xs font-bold">
                    REQUEST A SIMILAR PAINTING
                  </Link>
                  <Link to="/" className="inline-block border border-border-color rounded-full px-8 py-3 hover:bg-text-strong hover:text-bg transition-colors tracking-widest text-xs font-bold">
                    BROWSE AVAILABLE WORK
                  </Link>
                </div>
              ) : (
                <>
                  <div className="mb-8 text-text-muted text-xs tracking-widest uppercase">// YOUR DETAILS</div>
                  <form className="space-y-6 font-sans" onSubmit={handleSubmit}>
                    <div className="space-y-4">
                      <h3 className="text-text-strong font-bold tracking-widest text-sm uppercase">Contact Information</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <input name="firstName" type="text" placeholder="First Name" required autoComplete="given-name" className={inputClass} />
                        <input name="lastName" type="text" placeholder="Last Name" required autoComplete="family-name" className={inputClass} />
                      </div>
                      <input name="email" type="email" placeholder="Email Address" required autoComplete="email" className={inputClass} />
                      <input name="phone" type="tel" placeholder="Phone (optional)" autoComplete="tel" className={inputClass} />
                    </div>

                    <div className="space-y-4 pt-4 border-t border-border-color/20">
                      <h3 className="text-text-strong font-bold tracking-widest text-sm uppercase">Shipping Address</h3>
                      <input name="address" type="text" placeholder="Address" required autoComplete="street-address" className={inputClass} />
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <input name="city" type="text" placeholder="City" required autoComplete="address-level2" className={inputClass} />
                        <input name="postalCode" type="text" placeholder="Postal Code" autoComplete="postal-code" className={inputClass} />
                      </div>
                      <input name="country" type="text" placeholder="Country" required autoComplete="country-name" className={inputClass} />
                    </div>

                    <div className="pt-6 space-y-4">
                      <button type="submit" disabled={sending} className="w-full bg-action-bg text-action-text rounded-full px-6 py-4 hover:opacity-80 transition-opacity tracking-widest text-xs font-bold uppercase disabled:opacity-50">
                        {sending ? 'REDIRECTING TO PAYMENT...' : `PAY ${formatPrice(currentPrice(artwork))}`}
                      </button>
                      {error && <p role="alert" className="text-red-400 text-sm text-center">{error}</p>}
                      <p className="text-center text-text-muted text-xs">
                        <svg className="inline-block w-3 h-3 mr-1 mb-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                          <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                        </svg>
                        You will pay securely on Chapa with Telebirr, CBE Birr, other local wallets or card.
                      </p>
                    </div>
                  </form>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
