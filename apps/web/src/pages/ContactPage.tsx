import { Clock, Instagram, Mail, MapPin, Phone } from 'lucide-react';
import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { site } from '../data/site';
import { submitForm } from '../lib/forms';
import { PageMain } from '../components/layout/Layout';
import { Field, FormStatus, FormStatusMessage, inputClass } from '../components/forms/Field';

export default function ContactPage() {
  const [status, setStatus] = useState<FormStatus>('idle');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formEl = e.currentTarget;
    const form = new FormData(formEl);
    const text = (key: string) => String(form.get(key) ?? '').trim();

    setStatus('sending');
    try {
      const result = await submitForm('contact-messages', text('subject') || `Message from ${text('name')}`, {
        name: text('name'),
        email: text('email'),
        subject: text('subject'),
        message: text('message'),
      });
      setStatus(result);
      if (result === 'saved') formEl.reset();
    } catch {
      setStatus('error');
    }
  };

  const details = [
    { icon: Mail, label: 'Email', value: site.email, href: `mailto:${site.email}` },
    { icon: Phone, label: 'Phone', value: site.phone, href: `tel:${site.phone.replace(/\s/g, '')}` },
    { icon: MapPin, label: 'Studio', value: site.address.join(', ') },
    { icon: Clock, label: 'Opening hours', value: site.hours },
    { icon: Instagram, label: 'Instagram', value: 'Follow the studio', href: site.instagram },
  ];

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
                    <p className="text-text-strong text-sm">{value}</p>
                  )}
                </div>
              </li>
            ))}
          </ul>

          <form onSubmit={handleSubmit} className="md:col-span-3 grid grid-cols-1 sm:grid-cols-2 gap-4 font-sans">
            <Field label="Name"><input name="name" required className={inputClass} /></Field>
            <Field label="Email"><input name="email" type="email" required className={inputClass} /></Field>
            <Field label="Subject" className="sm:col-span-2"><input name="subject" className={inputClass} /></Field>
            <Field label="Message" className="sm:col-span-2"><textarea name="message" rows={6} required className={inputClass} /></Field>
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
