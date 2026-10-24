import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';

export default function Register() {
  const { register } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', room: '', role: 'student' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  function validate() {
    if (form.name.trim().length < 2) return 'Enter your name (2+ characters).';
    if (!/^\S+@\S+\.\S+$/.test(form.email)) return 'Enter a valid email address.';
    if (form.password.length < 8 || !/[A-Za-z]/.test(form.password) || !/\d/.test(form.password))
      return 'Password needs 8+ characters with a letter and a number.';
    if (form.role === 'student' && !form.room.trim()) return 'Add your room number.';
    return '';
  }

  async function submit(e) {
    e.preventDefault();
    const v = validate();
    setError(v);
    if (v) return;
    setBusy(true);
    try {
      await register({ ...form, name: form.name.trim(), email: form.email.trim(), room: form.room.trim() });
      toast('Welcome to HostelHub');
      navigate('/tickets');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-console px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-extrabold text-white">Join HostelHub</h1>
          <p className="text-sm text-slate-400">Students raise tickets · wardens run them</p>
        </div>
        <form onSubmit={submit} className="space-y-4 rounded-2xl border border-slate-800 bg-slate-900/70 p-6">
          {error && <p className="rounded-xl bg-red-500/10 px-3 py-2 text-sm font-bold text-red-300">{error}</p>}
          <div className="grid grid-cols-2 gap-2">
            {[['student', 'Student'], ['warden', 'Warden']].map(([r, label]) => (
              <button type="button" key={r} onClick={() => setForm({ ...form, role: r })}
                className={`rounded-xl border px-3 py-2 text-sm font-extrabold ${form.role === r ? 'border-teal2 bg-teal2/10 text-teal2' : 'border-slate-700 text-slate-400'}`}>{label}</button>
            ))}
          </div>
          <label className="block"><span className="text-sm font-bold text-slate-300">Name</span>
            <input value={form.name} onChange={set('name')} className="mt-1 w-full rounded-xl border border-slate-700 bg-console px-3 py-2.5 text-white outline-none focus:border-teal2" /></label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block"><span className="text-sm font-bold text-slate-300">Email</span>
              <input type="email" value={form.email} onChange={set('email')} className="mt-1 w-full rounded-xl border border-slate-700 bg-console px-3 py-2.5 text-white outline-none focus:border-teal2" /></label>
            {form.role === 'student' && (
              <label className="block"><span className="text-sm font-bold text-slate-300">Room</span>
                <input value={form.room} onChange={set('room')} placeholder="B-204" className="mt-1 w-full rounded-xl border border-slate-700 bg-console px-3 py-2.5 text-white outline-none focus:border-teal2" /></label>
            )}
          </div>
          <label className="block"><span className="text-sm font-bold text-slate-300">Password</span>
            <input type="password" value={form.password} onChange={set('password')} className="mt-1 w-full rounded-xl border border-slate-700 bg-console px-3 py-2.5 text-white outline-none focus:border-teal2" /></label>
          <button disabled={busy} className="w-full rounded-xl bg-teal2 py-2.5 font-extrabold text-console disabled:opacity-60">{busy ? 'Creating…' : 'Create account'}</button>
          <p className="text-center text-sm text-slate-400">Have one? <Link to="/login" className="font-extrabold text-teal2">Log in</Link></p>
        </form>
      </div>
    </div>
  );
}
