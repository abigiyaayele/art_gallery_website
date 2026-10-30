import { useState, type FormEvent } from 'react';
import { Navigate } from 'react-router-dom';
import { ErrorText, Field } from '../components/ui';
import { useAuth } from '../lib/auth';

export function LoginPage() {
  const { session, login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<unknown>(null);
  const [busy, setBusy] = useState(false);

  if (session) return <Navigate to="/" replace />;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await login(email, password);
    } catch (err) {
      setError(err);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-[1.1fr_1fr]">
      <div className="relative hidden overflow-hidden bg-stone-900 p-12 text-stone-50 lg:flex lg:flex-col lg:justify-between">
        <div
          aria-hidden
          className="absolute inset-0 opacity-80"
          style={{
            background:
              'radial-gradient(60% 50% at 20% 25%, #b8562f 0%, transparent 70%), radial-gradient(50% 45% at 80% 70%, #3f5f4a 0%, transparent 70%), radial-gradient(40% 35% at 60% 15%, #d9a441 0%, transparent 70%)',
            filter: 'blur(20px)',
          }}
        />
        <p className="eyebrow relative text-stone-300">Artist dashboard</p>
        <div className="relative max-w-md">
          <p className="display text-6xl leading-[0.95]">Your studio, your gallery, your shop.</p>
          <p className="mt-6 text-stone-300">Publish new work, set prices, answer collectors and shape your website, all in one place.</p>
        </div>
      </div>
      <div className="flex items-center justify-center px-4 py-12">
        <form onSubmit={submit} className="w-full max-w-sm space-y-5">
          <div>
            <p className="eyebrow mb-2">Welcome back</p>
            <h1 className="display text-5xl leading-none">Sign in</h1>
            <p className="mt-3 text-sm text-stone-500">Manage your artwork, shop and website.</p>
          </div>
          <Field label="Email">
            <input className="input" type="email" autoComplete="email" required value={email} onChange={e => setEmail(e.target.value)} />
          </Field>
          <Field label="Password">
            <input className="input" type="password" autoComplete="current-password" required value={password} onChange={e => setPassword(e.target.value)} />
          </Field>
          <ErrorText error={error} />
          <button className="btn-primary w-full py-2.5" disabled={busy}>
            {busy ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  );
}
