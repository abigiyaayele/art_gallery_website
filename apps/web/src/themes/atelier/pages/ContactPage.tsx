import { Clock, Instagram, Mail, MapPin, Phone } from 'lucide-react';
import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Link, useSearchParams } from 'react-router-dom';
import { readForm, sendInquiry } from '../../../platform/forms';
import { useCatalog } from '../data';
import { PageMain } from '../components/layout/Layout';
import { Field, FormStatus, FormStatusMessage, Honeypot, inputClass } from '../components/forms/Field';

export default function ContactPage() {
  const { site, getArtwork } = useCatalog();
  const { profile } = site;
  const [params] = useSearchParams();
  const artwork = getArtwork(params.get('artwork') ?? undefined);
  const [status, setStatus] = useState<FormStatus>('idle');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
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
        artworkSlug: artwork?.id,
        website: text('website'),
      });
      setStatus('saved');
      formEl.reset();
    } catch {
      setStatus('error');
    }
  };

  const instagram = profile.socialLinks.find(l => /instagram/i.test(l.label) || l.url.includes('instagram.com'));
  const details = [
    profile.email && { icon: Mail, label: 'Email', value: profile.email, href: `mailto:${profile.email}` },
    profile.phone && { icon: Phone, label: 'Phone', value: profile.phone, href: `tel:${profile.phone.replace(/\s/g, '')}` },
    profile.address && { icon: MapPin, label: 'Studio', value: profile.address },
    profile.hours && { icon: Clock, label: 'Opening hours', value: profile.hours },
    instagram && { icon: Instagram, label: 'Instagram', value: 'Follow the studio', href: instagram.url },
  ].filter((d): d is { icon: typeof Mail; label: string; value: string; href?: string } => Boolean(d));

  return (
    <PageMain>
      <div className="max-w-6xl mx-auto px-4 md:px-8 py-8 md:py-16">
        <motion.header initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center space-y-4 mb-12 md:mb-16">
          <p className="text-text-muted text-xs tracking-widest uppercase">// Contact</p>
          <h1 className="font-cursive text-5xl md:text-7xl text-text-strong leading-none">Get in touch</h1>
          <p className="max-w-2xl mx-auto text-sm md:text-base">
            Questions about a painting, shipping or a visit to the studio? Send a message and we will get back to you.
            Want something painted just for you? <Link to="/commission" className="text-text-strong underline underline-offset-4">Request a commission</Link>.
          </p>
        </motion.header>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-12">
          <ul className="md:col-span-2 space-y-6">
            {details.map(({ icon: Icon, label, value, href }) => (
              <li key={label} className="flex gap-4">
                <Icon size={18} className="mt-0.5 shrink-0 text-accent" />
                <div>
                  <p className="text-text-muted text-xs tracking-widest uppercase">{label}</p>
                  {href ? (
                    <a href={href} target={href.startsWith('http') ? '_blank' : undefined} rel="noreferrer" className="text-text-strong text-sm hover:text-accent transition-colors break-all">
                      {value}
                    </a>
                  ) : (
                    <p className="text-text-strong text-sm whitespace-pre-line">{value}</p>
                  )}
                </div>
              </li>
            ))}
          </ul>

          <form onSubmit={handleSubmit} className="relative md:col-span-3 grid grid-cols-1 sm:grid-cols-2 gap-4 font-sans">
            <Field label="Name"><input name="name" required className={inputClass} /></Field>
            <Field label="Email"><input name="email" type="email" required className={inputClass} /></Field>
            <Field label="Subject" className="sm:col-span-2">
              <input name="subject" defaultValue={artwork ? `Buying "${artwork.title}"` : ''} className={inputClass} />
            </Field>
            <Field label="Message" className="sm:col-span-2"><textarea name="message" rows={6} required className={inputClass} /></Field>
            <Honeypot />
            <div className="sm:col-span-2 space-y-4 pt-2">
              <button
                type="submit"
                disabled={status === 'sending'}
                className="w-full sm:w-auto bg-action-bg text-action-text rounded-full px-10 py-4 hover:opacity-80 transition-opacity tracking-widest text-xs font-bold uppercase disabled:opacity-50"
              >
                {status === 'sending' ? 'SENDING...' : 'SEND MESSAGE'}
              </button>
              <FormStatusMessage status={status} savedText="Thank you! Your message has been sent." />
            </div>
          </form>
        </div>
      </div>
    </PageMain>
  );
}
