import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';

const DEMO_ROLES = [
  { email: 'dev@demo.com', label: 'Student', icon: '🎓' },
  { email: 'warden@demo.com', label: 'Warden', icon: '🔑' },
  { email: 'admin@demo.com', label: 'Admin', icon: '⚙️' },
];

export default function Login() {
  const { login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const fillDemo = (email) => { setForm({ email, password: 'Demo@1234' }); setError(''); };

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
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-console px-4">
      {/* Orbs */}
      <div className="pointer-events-none fixed inset-0" aria-hidden="true">
        <div className="blob absolute -top-32 right-1/3 h-[28rem] w-[36rem] rounded-full bg-teal2/10" style={{ animation: 'orbFloat 16s ease-in-out infinite' }} />
        <div className="blob absolute bottom-0 left-1/4 h-[18rem] w-[18rem] rounded-full bg-teal-bright/6" style={{ animation: 'orbFloat 20s ease-in-out 3s infinite' }} />
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="mb-8 text-center">
          <Link to="/" className="inline-flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-teal-bright text-console text-sm font-black teal-glow">HH</div>
            <span className="text-xl font-extrabold text-white">HostelHub</span>
          </Link>
          <h1 className="mt-6 text-3xl font-extrabold text-white">Console login</h1>
          <p className="mt-2 text-sm text-slate-500">Jump into a seeded workspace</p>
        </div>

        <form onSubmit={submit} className="console-card space-y-5 rounded-3xl border border-console-edge p-8">
          {/* Role quick-fill */}
          <div className="grid grid-cols-3 gap-2">
            {DEMO_ROLES.map(({ email, label, icon }) => (
              <button
                key={email}
                type="button"
                onClick={() => fillDemo(email)}
                className={`flex flex-col items-center gap-1 rounded-2xl border px-2 py-3 text-center text-xs transition hover:border-teal-bright/50 hover:bg-teal-bright/8 ${form.email === email ? 'border-teal-bright/60 bg-teal-bright/12 text-teal-bright' : 'border-console-edge text-slate-400'}`}
              >
                <span className="text-base">{icon}</span>
                <span className="font-bold">{label}</span>
              </button>
            ))}
          </div>

          {error && (
            <div className="flex items-center gap-2 rounded-xl border border-danger/25 bg-danger/8 px-4 py-3">
              <span className="text-danger">⚠</span>
              <p className="text-sm font-bold text-danger">{error}</p>
            </div>
          )}

          <label className="block">
            <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500">Email</span>
            <input
              type="email"
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
              autoComplete="email"
              placeholder="you@hostel.edu"
              className="input-dark w-full rounded-xl px-4 py-3 text-sm"
            />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500">Password</span>
            <input
              type="password"
              value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })}
              autoComplete="current-password"
              placeholder="••••••••"
              className="input-dark w-full rounded-xl px-4 py-3 text-sm"
            />
          </label>

          <button
            type="submit"
            disabled={busy}
            className="btn-3d btn-teal w-full rounded-2xl py-3.5 text-sm font-extrabold disabled:opacity-50"
          >
            {busy ? (
              <span className="flex items-center justify-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-console border-t-teal-bright" />
                Checking…
              </span>
            ) : 'Open Console →'}
          </button>

          <p className="text-center text-sm text-slate-500">
            No account?{' '}
            <Link to="/register" className="font-extrabold text-teal-bright hover:underline">
              Register
            </Link>
          </p>
        </form>

        <p className="mono mt-5 text-center text-xs text-slate-600">
          Demo password: <span className="text-slate-400">Demo@1234</span>
        </p>
      </div>
    </div>
  );
}
