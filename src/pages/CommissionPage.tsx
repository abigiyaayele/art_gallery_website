import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Link, useSearchParams } from 'react-router-dom';
import { getArtwork } from '../data/artworks';
import { submitForm } from '../lib/forms';
import { PageMain } from '../components/layout/Layout';
import { Field, FormStatus, FormStatusMessage, inputClass } from '../components/forms/Field';

const styles = ['Realistic', 'Abstract', 'Portrait', 'Landscape', 'Still life', 'Other'];
const mediums = ['Oil on canvas', 'Acrylic', 'Watercolor', 'Mixed media', 'No preference'];
const sizes = ['Small (30 x 40 cm)', 'Medium (60 x 80 cm)', 'Large (100 x 100 cm)', 'Extra large (150 cm +)', 'Custom size'];
const budgets = ['Under $1,000', '$1,000 - $3,000', '$3,000 - $7,500', '$7,500 +', 'Not sure yet'];

const steps = [
  ['Request', 'Tell us your idea, size, colours and budget.'],
  ['Quote', 'The artist replies within 3 days with a price and timeline.'],
  ['Deposit', 'A 30% deposit secures your place in the studio schedule.'],
  ['Painting', 'You receive progress photos while the piece is painted.'],
  ['Delivery', 'Pay the balance and the finished painting is shipped to you.'],
];

export default function CommissionPage() {
  const [params] = useSearchParams();
  const inspiredBy = getArtwork(Number(params.get('inspired')));
  const [status, setStatus] = useState<FormStatus>('idle');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formEl = e.currentTarget;
    const form = new FormData(formEl);
    const text = (key: string) => String(form.get(key) ?? '').trim();
    const reference = form.get('referenceImage');

    setStatus('sending');
    try {
      const result = await submitForm(
        'commission-requests',
        `Painting request from ${text('name')}`,
        {
          name: text('name'),
          email: text('email'),
          phone: text('phone'),
          idea: text('idea'),
          style: text('style'),
          medium: text('medium'),
          size: text('size'),
          colors: text('colors'),
          budget: text('budget'),
          deadline: text('deadline'),
          notes: text('notes'),
        },
        { field: 'referenceImage', value: reference instanceof File && reference.size > 0 ? reference : null },
      );
      setStatus(result);
      if (result === 'saved') formEl.reset();
    } catch {
      setStatus('error');
    }
  };

  return (
    <PageMain>
      <div className="max-w-6xl mx-auto px-4 md:px-8 py-8 md:py-16">
        <motion.header initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center space-y-4 mb-12 md:mb-16">
          <p className="text-text-muted text-xs tracking-widest uppercase">// Commission</p>
          <h1 className="font-cursive text-5xl md:text-7xl text-text-strong leading-none">Request a painting</h1>
          <p className="max-w-2xl mx-auto text-sm md:text-base">
            Have something in mind? Describe the painting you would love to own and the artist will paint it for you,
            in your size, colours and style.
          </p>
        </motion.header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* How it works */}
          <aside className="space-y-6 lg:order-2">
            <h2 className="text-text-strong text-sm font-bold tracking-widest">// HOW IT WORKS</h2>
            <ol className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-6">
              {steps.map(([title, text], i) => (
                <li key={title} className="flex gap-4">
                  <span className="font-mono text-2xl text-text-faint leading-none">{String(i + 1).padStart(2, '0')}</span>
                  <div>
                    <p className="text-text-strong text-xs font-bold tracking-widest uppercase">{title}</p>
                    <p className="text-sm">{text}</p>
                  </div>
                </li>
              ))}
            </ol>
            <Link to="/commission/deposit" className="inline-block text-text-strong text-xs tracking-widest underline underline-offset-4 hover:text-accent transition-colors">
              ALREADY HAVE A QUOTE? PAY YOUR DEPOSIT &rarr;
            </Link>
          </aside>

          {/* Request form */}
          <form onSubmit={handleSubmit} className="lg:col-span-2 lg:order-1 space-y-8 font-sans">
            <fieldset className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <legend className="text-text-strong text-sm font-bold tracking-widest mb-4">// ABOUT YOU</legend>
              <Field label="Name"><input name="name" required className={inputClass} /></Field>
              <Field label="Email"><input name="email" type="email" required className={inputClass} /></Field>
              <Field label="Phone (optional)" className="sm:col-span-2"><input name="phone" type="tel" className={inputClass} /></Field>
            </fieldset>

            <fieldset className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-6 border-t border-border-color/20">
              <legend className="text-text-strong text-sm font-bold tracking-widest mb-4 pt-6">// YOUR PAINTING</legend>
              <Field label="What should it show?" className="sm:col-span-2">
                <textarea
                  name="idea"
                  required
                  rows={5}
                  defaultValue={inspiredBy ? `Something in the spirit of "${inspiredBy.title}" (${inspiredBy.collection}).\n` : ''}
                  placeholder="The subject, mood, a place or person, anything that inspires you..."
                  className={inputClass}
                />
              </Field>
              <Field label="Style">
                <select name="style" className={inputClass} defaultValue="">
                  <option value="" disabled>Choose a style</option>
                  {styles.map(s => <option key={s}>{s}</option>)}
                </select>
              </Field>
              <Field label="Medium">
                <select name="medium" className={inputClass} defaultValue="">
                  <option value="" disabled>Choose a medium</option>
                  {mediums.map(s => <option key={s}>{s}</option>)}
                </select>
              </Field>
              <Field label="Size">
                <select name="size" required className={inputClass} defaultValue="">
                  <option value="" disabled>Choose a size</option>
                  {sizes.map(s => <option key={s}>{s}</option>)}
                </select>
              </Field>
              <Field label="Budget (USD)">
                <select name="budget" required className={inputClass} defaultValue="">
                  <option value="" disabled>Choose a range</option>
                  {budgets.map(s => <option key={s}>{s}</option>)}
                </select>
              </Field>
              <Field label="Colour preferences">
                <input name="colors" placeholder="e.g. warm earth tones, deep blue" className={inputClass} />
              </Field>
              <Field label="Needed by (optional)">
                <input name="deadline" type="date" className={inputClass} />
              </Field>
              <Field label="Reference image (optional)" hint="A photo or sketch that helps explain your idea." className="sm:col-span-2">
                <input name="referenceImage" type="file" accept="image/*" className={`${inputClass} file:mr-4 file:border-0 file:bg-action-bg file:text-action-text file:px-3 file:py-1 file:text-xs file:font-bold`} />
              </Field>
              <Field label="Anything else?" className="sm:col-span-2">
                <textarea name="notes" rows={3} className={inputClass} />
              </Field>
            </fieldset>

            <div className="space-y-4">
              <button
                type="submit"
                disabled={status === 'sending'}
                className="w-full sm:w-auto bg-action-bg text-action-text rounded-full px-10 py-4 hover:opacity-80 transition-opacity tracking-widest text-xs font-bold uppercase disabled:opacity-50"
              >
                {status === 'sending' ? 'SENDING...' : 'SEND REQUEST'}
              </button>
              <FormStatusMessage status={status} savedText="Thank you! Your request has been received. The artist will reply with a quote within 3 days." />
            </div>
          </form>
        </div>
      </div>
    </PageMain>
  );
}
