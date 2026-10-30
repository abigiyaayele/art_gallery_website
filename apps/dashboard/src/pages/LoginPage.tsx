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
    <div className="flex min-h-screen items-center justify-center px-4">
      <form onSubmit={submit} className="card w-full max-w-sm space-y-4">
        <div>
          <h1 className="text-xl font-semibold">Sign in</h1>
          <p className="text-sm text-stone-500">Manage your artwork, shop and website.</p>
        </div>
        <Field label="Email">
          <input className="input" type="email" autoComplete="email" required value={email} onChange={e => setEmail(e.target.value)} />
        </Field>
        <Field label="Password">
          <input className="input" type="password" autoComplete="current-password" required value={password} onChange={e => setPassword(e.target.value)} />
        </Field>
        <ErrorText error={error} />
        <button className="btn-primary w-full" disabled={busy}>
          {busy ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </div>
  );
}
