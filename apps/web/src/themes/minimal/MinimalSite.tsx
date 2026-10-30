import type { PageSlug } from '@platform/contracts';
import { Menu, X } from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';
import { Link, NavLink, Outlet, Route, Routes, useLocation, useParams, useSearchParams } from 'react-router-dom';
import { formatMoney, platform } from '../../platform/api';
import { readForm, sendInquiry } from '../../platform/forms';
import { useBlocks, usePage, useSite } from '../../platform/SiteProvider';
import { useOrderStatus } from '../../platform/useOrderStatus';
import { ArtworkGrid, Blocks, Container, Heading, Price, button, ghostButton, input } from './ui';

const routes: [PageSlug, string][] = [
  ['home', '/'],
  ['gallery', '/works'],
  ['offers', '/offers'],
  ['about', '/about'],
  ['commission', '/commission'],
  ['contact', '/contact'],
];

function Layout() {
  const { site } = useSite();
  const [open, setOpen] = useState(false);
  const location = useLocation();
  useEffect(() => {
    setOpen(false);
    window.scrollTo(0, 0);
  }, [location.pathname]);

  const nav = routes.flatMap(([slug, to]) => {
    const page = site.pages.find(p => p.slug === slug);
    return page?.enabled && slug !== 'home' ? [{ to, label: page.title || slug }] : [];
  });
  const title = site.branding.siteTitle || site.tenant.name;

  return (
    <div className="flex min-h-dvh flex-col bg-bg font-sans text-text-base">
      <header className="border-b border-border-color">
        <Container className="flex h-16 items-center justify-between gap-6">
          <Link to="/" className="flex items-center gap-3 text-text-strong">
            {site.branding.logoUrl && <img src={site.branding.logoUrl} alt="" className="h-8 w-8 object-contain" />}
            <span className="font-cursive text-xl">{title}</span>
          </Link>
          <nav className="hidden gap-6 text-sm md:flex">
            {nav.map(n => (
              <NavLink key={n.to} to={n.to} className={({ isActive }) => (isActive ? 'text-text-strong underline underline-offset-8' : 'hover:text-text-strong')}>
                {n.label}
              </NavLink>
            ))}
          </nav>
          <button className="md:hidden" aria-label="Menu" onClick={() => setOpen(o => !o)}>{open ? <X size={20} /> : <Menu size={20} />}</button>
        </Container>
        {open && (
          <nav className="flex flex-col gap-4 border-t border-border-color px-4 py-4 text-sm md:hidden">
            {nav.map(n => <NavLink key={n.to} to={n.to}>{n.label}</NavLink>)}
          </nav>
        )}
      </header>
      <main className="flex-1 py-10 md:py-16">
        <Outlet />
      </main>
      <footer className="border-t border-border-color py-8 text-sm text-text-muted">
        <Container className="flex flex-col justify-between gap-4 sm:flex-row">
          <span>© {new Date().getFullYear()} {site.profile.displayName}</span>
          <span className="flex gap-4">
            {site.profile.socialLinks.map(l => <a key={l.url} href={l.url} target="_blank" rel="noreferrer" className="hover:text-text-strong">{l.label}</a>)}
            {site.profile.email && <a href={`mailto:${site.profile.email}`} className="hover:text-text-strong">{site.profile.email}</a>}
          </span>
        </Container>
      </footer>
    </div>
  );
}

function NotFound() {
  return (
    <Container className="space-y-6 py-16 text-center">
      <Heading as="h1">Page not found</Heading>
      <Link to="/" className={ghostButton}>Back home</Link>
    </Container>
  );
}

function IfEnabled({ slug, children }: { slug: PageSlug; children: React.ReactElement }) {
  return usePage(slug)?.enabled ? children : <NotFound />;
}

function HomePage() {
  const { site } = useSite();
  const blocks = usePage('home')?.blocks ?? [];
  return (
    <Container>
      {blocks.length ? <Blocks blocks={blocks} /> : <Heading as="h1">{site.profile.displayName}</Heading>}
    </Container>
  );
}

function WorksPage() {
  const { artworks } = useSite();
  const [params, setParams] = useSearchParams();
  const collection = params.get('collection') ?? '';
  const collections = useMemo(() => [...new Set(artworks.map(a => a.collection).filter(Boolean))], [artworks]);
  const shown = collection ? artworks.filter(a => a.collection === collection) : artworks;
  return (
    <Container className="space-y-8">
      <Heading as="h1">{usePage('gallery')?.title || 'Works'}</Heading>
      {collections.length > 1 && (
        <div className="flex flex-wrap gap-2 text-sm">
          {['', ...collections].map(c => (
            <button key={c} onClick={() => setParams(c ? { collection: c } : {})} className={`border px-3 py-1 ${c === collection ? 'border-text-strong text-text-strong' : 'border-border-color'}`}>
              {c || 'All'}
            </button>
          ))}
        </div>
      )}
      <ArtworkGrid artworks={shown} />
    </Container>
  );
}

function OffersPage() {
  const { artworks } = useSite();
  const blocks = usePage('offers')?.blocks ?? [];
  return (
    <Container className="space-y-12">
      <Blocks blocks={blocks} />
      <ArtworkGrid artworks={artworks.filter(a => !a.sold && a.price?.onSale)} />
    </Container>
  );
}

function ArtworkPage() {
  const { slug } = useParams();
  const { artworks, site } = useSite();
  const artwork = artworks.find(a => a.slug === slug);
  const [active, setActive] = useState(0);
  if (!artwork) return <NotFound />;
  const image = artwork.images[active] ?? artwork.images[0];
  const canBuy = !artwork.sold && artwork.price && site.shop.paymentsEnabled;

  return (
    <Container className="grid gap-10 md:grid-cols-2">
      <div className="space-y-3">
        {image && <img src={image.urls.large} alt={image.alt || artwork.title} className="w-full bg-text-faint object-contain" />}
        {artwork.images.length > 1 && (
          <div className="flex gap-2">
            {artwork.images.map((img, i) => (
              <button key={img.id} onClick={() => setActive(i)} className={`h-16 w-16 overflow-hidden border ${i === active ? 'border-text-strong' : 'border-transparent'}`}>
                <img src={img.urls.thumb} alt="" className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>
      <div className="space-y-6">
        <div className="space-y-2">
          {artwork.collection && <p className="text-sm text-text-muted">{artwork.collection}</p>}
          <Heading as="h1">{artwork.title}</Heading>
          <Price artwork={artwork} className="text-lg" />
        </div>
        <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-1 text-sm">
          {artwork.medium && <><dt className="text-text-muted">Medium</dt><dd>{artwork.medium}</dd></>}
          {artwork.dimensions && <><dt className="text-text-muted">Size</dt><dd>{artwork.dimensions}</dd></>}
          {artwork.year && <><dt className="text-text-muted">Year</dt><dd>{artwork.year}</dd></>}
        </dl>
        {artwork.description && <p className="leading-relaxed">{artwork.description}</p>}
        {artwork.story && <p className="whitespace-pre-line leading-relaxed">{artwork.story}</p>}
        <div className="flex flex-wrap gap-3">
          {canBuy ? (
            <Link to={`/checkout/${artwork.slug}`} className={button}>Buy now</Link>
          ) : !artwork.sold ? (
            <Link to={`/contact?artwork=${artwork.slug}`} className={button}>Ask about this work</Link>
          ) : null}
          {artwork.sold && pageEnabled(site, 'commission') && <Link to={`/commission?inspired=${artwork.slug}`} className={ghostButton}>Commission something similar</Link>}
        </div>
      </div>
    </Container>
  );
}

function pageEnabled(site: ReturnType<typeof useSite>['site'], slug: PageSlug) {
  return Boolean(site.pages.find(p => p.slug === slug)?.enabled);
}

function AboutPage() {
  const { profile } = useSite().site;
  const blocks = usePage('about')?.blocks ?? [];
  return (
    <Container className="space-y-16">
      <section className={`grid items-start gap-10 ${profile.photoUrl ? 'md:grid-cols-[2fr_3fr]' : ''}`}>
        {profile.photoUrl && <img src={profile.photoUrl} alt={profile.displayName} className="aspect-[4/5] w-full object-cover" />}
        <div className="space-y-4">
          <Heading as="h1">{profile.displayName}</Heading>
          {profile.tagline && <p className="text-lg text-text-strong">{profile.tagline}</p>}
          {profile.bio.split(/\n{2,}/).filter(Boolean).map((p, i) => <p key={i} className="leading-relaxed">{p}</p>)}
          {profile.statement && <blockquote className="border-l-2 border-accent pl-4 italic">{profile.statement}</blockquote>}
        </div>
      </section>
      <Blocks blocks={blocks} />
    </Container>
  );
}

type Status = 'idle' | 'sending' | 'sent' | 'error';

function StatusLine({ status, sent }: { status: Status; sent: string }) {
  if (status === 'sent') return <p role="status" className="text-sm text-accent">{sent}</p>;
  if (status === 'error') return <p role="alert" className="text-sm text-red-600">Something went wrong. Please try again.</p>;
  return null;
}

function Honeypot() {
  return <input name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 opacity-0" />;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5 text-sm">
      <span className="text-text-muted">{label}</span>
      {children}
    </label>
  );
}

function ContactPage() {
  const { site, artworks } = useSite();
  const { profile } = site;
  const intro = useBlocks('contact', 'text')[0];
  const [params] = useSearchParams();
  const artwork = artworks.find(a => a.slug === params.get('artwork'));
  const [status, setStatus] = useState<Status>('idle');

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formEl = e.currentTarget;
    const text = readForm(formEl);
    setStatus('sending');
    try {
      await sendInquiry({
        kind: artwork ? 'purchase' : 'contact',
        name: text('name'),
        email: text('email'),
        subject: text('subject'),
        message: text('message'),
        artworkSlug: artwork?.slug,
        website: text('website'),
      });
      formEl.reset();
      setStatus('sent');
    } catch {
      setStatus('error');
    }
  };

  return (
    <Container className="grid gap-12 md:grid-cols-[2fr_3fr]">
      <div className="space-y-4">
        <Heading as="h1">{intro?.heading || 'Contact'}</Heading>
        {intro?.body && <p>{intro.body}</p>}
        <ul className="space-y-1 text-sm">
          {profile.email && <li><a href={`mailto:${profile.email}`} className="underline underline-offset-4">{profile.email}</a></li>}
          {profile.phone && <li>{profile.phone}</li>}
          {profile.address && <li className="whitespace-pre-line">{profile.address}</li>}
          {profile.hours && <li className="text-text-muted">{profile.hours}</li>}
        </ul>
      </div>
      <form onSubmit={submit} className="relative grid gap-4">
        <Field label="Name"><input name="name" required className={input} /></Field>
        <Field label="Email"><input name="email" type="email" required className={input} /></Field>
        <Field label="Subject"><input name="subject" defaultValue={artwork ? `About "${artwork.title}"` : ''} className={input} /></Field>
        <Field label="Message"><textarea name="message" rows={6} required className={input} /></Field>
        <Honeypot />
        <div className="space-y-3">
          <button disabled={status === 'sending'} className={button}>{status === 'sending' ? 'Sending…' : 'Send message'}</button>
          <StatusLine status={status} sent="Thank you, your message has been sent." />
        </div>
      </form>
    </Container>
  );
}

function CommissionPage() {
  const { artworks, site } = useSite();
  const intro = useBlocks('commission', 'text')[0];
  const [params] = useSearchParams();
  const inspired = artworks.find(a => a.slug === params.get('inspired'));
  const [status, setStatus] = useState<Status>('idle');

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formEl = e.currentTarget;
    const text = readForm(formEl);
    setStatus('sending');
    try {
      await sendInquiry({
        kind: 'commission',
        name: text('name'),
        email: text('email'),
        phone: text('phone'),
        subject: `Commission request from ${text('name')}`,
        message: text('idea'),
        details: { size: text('size'), budget: text('budget'), deadline: text('deadline') },
        artworkSlug: inspired?.slug,
        website: text('website'),
      });
      formEl.reset();
      setStatus('sent');
    } catch {
      setStatus('error');
    }
  };

  return (
    <Container className="max-w-2xl space-y-8">
      <div className="space-y-3">
        <Heading as="h1">{intro?.heading || 'Commission a work'}</Heading>
        {intro?.body && <p>{intro.body}</p>}
      </div>
      <form onSubmit={submit} className="relative grid gap-4 sm:grid-cols-2">
        <Field label="Name"><input name="name" required className={input} /></Field>
        <Field label="Email"><input name="email" type="email" required className={input} /></Field>
        <Field label="Phone (optional)"><input name="phone" className={input} /></Field>
        <Field label="Size"><input name="size" placeholder="e.g. 60 x 80 cm" className={input} /></Field>
        <Field label="Budget"><input name="budget" className={input} /></Field>
        <Field label="Needed by"><input name="deadline" type="date" className={input} /></Field>
        <div className="sm:col-span-2">
          <Field label="Your idea">
            <textarea name="idea" rows={5} required defaultValue={inspired ? `Something like "${inspired.title}".\n` : ''} className={input} />
          </Field>
        </div>
        <Honeypot />
        <div className="space-y-3 sm:col-span-2">
          <button disabled={status === 'sending'} className={button}>{status === 'sending' ? 'Sending…' : 'Send request'}</button>
          <StatusLine status={status} sent="Thank you, the artist will reply with a quote." />
        </div>
      </form>
      {site.shop.paymentsEnabled && <Link to="/commission/deposit" className="text-sm underline underline-offset-4">Already have a quote? Pay your deposit</Link>}
    </Container>
  );
}

function CheckoutPage() {
  const { slug } = useParams();
  const { artworks, site } = useSite();
  const artwork = artworks.find(a => a.slug === slug);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  if (!artwork || !artwork.price) return <NotFound />;

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const text = readForm(e.currentTarget);
    setSending(true);
    setError('');
    try {
      const started = await platform.checkout({
        artworkSlug: artwork.slug,
        buyer: { name: text('name'), email: text('email'), phone: text('phone') },
        shipping: { address: text('address'), city: text('city'), country: text('country') },
      });
      window.location.href = started.checkoutUrl;
    } catch (err) {
      setError((err as Error).message);
      setSending(false);
    }
  };

  return (
    <Container className="grid gap-10 md:grid-cols-2">
      <div className="space-y-4">
        {artwork.images[0] && <img src={artwork.images[0].urls.medium} alt="" className="w-full max-w-sm" />}
        <p className="text-text-strong">{artwork.title}</p>
        <Price artwork={artwork} />
      </div>
      {artwork.sold ? (
        <p>This work has been sold.</p>
      ) : (
        <form onSubmit={submit} className="grid gap-4">
          <Heading as="h1">Checkout</Heading>
          <Field label="Full name"><input name="name" required autoComplete="name" className={input} /></Field>
          <Field label="Email"><input name="email" type="email" required autoComplete="email" className={input} /></Field>
          <Field label="Phone (optional)"><input name="phone" autoComplete="tel" className={input} /></Field>
          <Field label="Address"><input name="address" required autoComplete="street-address" className={input} /></Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="City"><input name="city" required className={input} /></Field>
            <Field label="Country"><input name="country" required className={input} /></Field>
          </div>
          <button disabled={sending} className={button}>
            {sending ? 'Redirecting to payment…' : `Pay ${formatMoney(artwork.price.effectiveCents, artwork.price.currency)}`}
          </button>
          {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
          <p className="text-xs text-text-muted">The work is reserved for you for {site.shop.holdMinutes} minutes while you pay.</p>
        </form>
      )}
    </Container>
  );
}

function DepositPage() {
  const { artworks, site } = useSite();
  const currency = artworks[0]?.price?.currency ?? 'USD';
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  if (!site.shop.paymentsEnabled) return <NotFound />;

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const text = readForm(e.currentTarget);
    setSending(true);
    setError('');
    try {
      const started = await platform.deposit({
        buyer: { name: text('name'), email: text('email') },
        amountCents: Math.round(Number(text('amount')) * 100),
        currency,
        note: text('note'),
      });
      window.location.href = started.checkoutUrl;
    } catch (err) {
      setError((err as Error).message);
      setSending(false);
    }
  };

  return (
    <Container className="max-w-md">
      <form onSubmit={submit} className="grid gap-4">
        <Heading as="h1">Pay a deposit</Heading>
        <Field label="Full name"><input name="name" required className={input} /></Field>
        <Field label="Email"><input name="email" type="email" required className={input} /></Field>
        <Field label={`Amount (${currency})`}><input name="amount" type="number" min="1" step="0.01" required className={input} /></Field>
        <Field label="Quote reference (optional)"><input name="note" className={input} /></Field>
        <button disabled={sending} className={button}>{sending ? 'Redirecting…' : 'Pay deposit'}</button>
        {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
      </form>
    </Container>
  );
}

function PaymentCompletePage() {
  const { state, result } = useOrderStatus();
  const copy = {
    loading: ['Checking your payment…', 'This only takes a moment.'],
    pending: ['Waiting for confirmation…', 'Keep this page open; it updates by itself.'],
    paid: ['Thank you!', result ? `Your payment of ${formatMoney(result.amountCents, result.currency)}${result.kind === 'artwork' ? ` for "${result.artworkTitle}"` : ''} is confirmed.` : ''],
    unpaid: ['Payment not completed', 'No money was taken. You can try again whenever you are ready.'],
    missing: ['We could not find this payment', 'If money left your account, get in touch with your receipt.'],
  }[state];
  return (
    <Container className="max-w-lg space-y-4 py-10 text-center">
      <Heading as="h1">{copy[0]}</Heading>
      <p>{copy[1]}</p>
      <Link to="/" className={ghostButton}>Back home</Link>
    </Container>
  );
}

/** The minimal theme: light, quiet and grid based. */
export default function MinimalSite() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="works" element={<IfEnabled slug="gallery"><WorksPage /></IfEnabled>} />
        <Route path="works/:slug" element={<ArtworkPage />} />
        <Route path="checkout/:slug" element={<CheckoutPage />} />
        <Route path="offers" element={<IfEnabled slug="offers"><OffersPage /></IfEnabled>} />
        <Route path="about" element={<IfEnabled slug="about"><AboutPage /></IfEnabled>} />
        <Route path="commission" element={<IfEnabled slug="commission"><CommissionPage /></IfEnabled>} />
        <Route path="commission/deposit" element={<DepositPage />} />
        <Route path="contact" element={<IfEnabled slug="contact"><ContactPage /></IfEnabled>} />
        <Route path="payment/complete" element={<PaymentCompletePage />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
