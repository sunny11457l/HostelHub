import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';

export default function Login() {
  const { login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setError('');
    if (!form.email || !form.password) return setError('Enter your email and password.');
    setBusy(true);
    try {
      const u = await login(form.email, form.password);
      toast(`Logged in as ${u.role}`);
      navigate('/tickets');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-console px-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-teal2 text-xl font-extrabold text-console">HH</span>
          <h1 className="mt-3 text-2xl font-extrabold text-white">Console login</h1>
        </div>
        <form onSubmit={submit} className="space-y-4 rounded-2xl border border-slate-800 bg-slate-900/70 p-6">
          {error && <p className="rounded-xl bg-red-500/10 px-3 py-2 text-sm font-bold text-red-300">{error}</p>}
          <label className="block"><span className="text-sm font-bold text-slate-300">Email</span>
            <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} autoComplete="email"
              className="mt-1 w-full rounded-xl border border-slate-700 bg-console px-3 py-2.5 text-white outline-none focus:border-teal2" /></label>
          <label className="block"><span className="text-sm font-bold text-slate-300">Password</span>
            <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} autoComplete="current-password"
              className="mt-1 w-full rounded-xl border border-slate-700 bg-console px-3 py-2.5 text-white outline-none focus:border-teal2" /></label>
          <button disabled={busy} className="w-full rounded-xl bg-teal2 py-2.5 font-extrabold text-console disabled:opacity-60">{busy ? 'Checking…' : 'Log in'}</button>
          <p className="text-center text-sm text-slate-400">No account? <Link to="/register" className="font-extrabold text-teal2">Register</Link></p>
        </form>
        <p className="mt-4 text-center text-xs text-slate-500">Demo: dev@demo.com (student) · warden@demo.com · admin@demo.com · Demo@1234</p>
      </div>
    </div>
  );
}
