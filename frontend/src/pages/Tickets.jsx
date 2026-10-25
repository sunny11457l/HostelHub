import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import client from '../api/client.js';

function Announcements() {
  const isStaff = false;
  const [announcements, setAnnouncements] = useState(null);
  useEffect(() => { client.get('/announcements').then((r) => setAnnouncements(r.data)).catch(() => {}); }, []);
  if (!announcements?.length) return null;
  return (
    <div className="mb-6 space-y-2">
      <SceneBackground />
      {announcements.slice(0, 2).map((a) => (
        <div key={a._id} className={`rounded-2xl border p-4 ${a.pinned ? 'border-teal2/40 bg-teal2/10' : 'border-slate-200 bg-white'}`}>
          <p className="font-bold">{a.pinned ? '📌 ' : '📢 '}{a.title}</p>
          <p className="text-sm text-slate-600">{a.body}</p>
          <p className="mt-1 text-xs text-slate-400">— {a.byName}</p>
        </div>
      ))}
    </div>
  );
}
import { Loading, Empty, ErrorState } from '../components/states.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import SceneBackground from '../components/SceneBackground.jsx';

const CATEGORIES = ['plumbing', 'electrical', 'carpentry', 'cleanliness', 'wifi', 'other'];
const STATUSES = ['', 'open', 'assigned', 'in-progress', 'resolved', 'escalated', 'reopened'];

function dueChip(t) {
  if (!t.slaDeadline || ['resolved'].includes(t.status)) return null;
  const ms = new Date(t.slaDeadline) - Date.now();
  if (t.status === 'escalated') return <span className="mono rounded-full bg-red-100 px-2 py-0.5 text-[11px] font-bold text-red-700">ESCALATED</span>;
  if (ms < 0) return <span className="mono rounded-full bg-red-100 px-2 py-0.5 text-[11px] font-bold text-red-700">OVERDUE</span>;
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const urgent = ms < 2 * 3600000;
  return (
    <span className={`mono rounded-full px-2 py-0.5 text-[11px] font-bold ${urgent ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'}`}>
      {h}h {m}m left
    </span>
  );
}

export default function Tickets() {
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [tickets, setTickets] = useState(null);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState({ category: 'other', room: user?.room || '', title: '', description: '' });
  const [busy, setBusy] = useState(false);
  const isStaff = user?.role !== 'student';

  async function load(s = status) {
    setError('');
    try {
      setTickets((await client.get(`/tickets${s ? `?status=${s}` : ''}`)).data);
    } catch (err) {
      setError(err.message);
    }
  }
  useEffect(() => { load(); }, []);

  async function create(e) {
    e.preventDefault();
    setBusy(true);
    try {
      await client.post('/tickets', form);
      toast('Ticket raised — the clock is running');
      setShowNew(false);
      setForm({ ...form, title: '', description: '' });
      load();
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setBusy(false);
    }
  }

  const columns = ['open', 'assigned', 'in-progress', 'resolved', 'escalated'];

  return (
    <main className="relative mx-auto max-w-6xl px-4 py-8">
      <Announcements />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold">{isStaff ? 'All tickets' : 'Your tickets'}</h1>
          <p className="text-sm text-slate-500">{isStaff ? 'Triage, track SLAs, resolve.' : 'Raise it once, watch the clock.'}</p>
        </div>
        <div className="flex items-center gap-2">
          <select value={status} onChange={(e) => { setStatus(e.target.value); load(e.target.value); }}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold outline-none focus:border-teal2">
            {STATUSES.map((s) => <option key={s} value={s}>{s === '' ? 'All statuses' : s}</option>)}
          </select>
          {user?.role === 'student' && (
            <button onClick={() => setShowNew(true)} className="rounded-xl bg-console px-5 py-2 text-sm font-extrabold text-white hover:bg-slate-800">+ Raise ticket</button>
          )}
          {isStaff && (
            <a href={`${import.meta.env.VITE_API_URL || 'http://localhost:5105/api'}/admin/tickets.csv`} target="_blank" rel="noreferrer"
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold hover:border-teal2">⬇ CSV</a>
          )}
        </div>
      </div>

      {error && <div className="mt-6"><ErrorState message={error} onRetry={load} /></div>}
      {!error && tickets === null && <Loading label="Pulling the board…" />}
      {!error && tickets !== null && tickets.length === 0 && (
        <div className="mt-6"><Empty title="No tickets here" hint={user?.role === 'student' ? 'Raise your first complaint — it gets an SLA immediately.' : 'Nothing matches this filter.'} /></div>
      )}

      {/* Warden kanban */}
      {isStaff && tickets !== null && tickets.length > 0 && (
        <div className="mt-6 hidden gap-3 overflow-x-auto lg:grid lg:grid-cols-5">
          {columns.map((col) => (
            <div key={col} className="rounded-2xl bg-white p-3 shadow-sm">
              <p className="mono px-1 pb-2 text-xs font-bold uppercase text-slate-400">{col} ({tickets.filter((t) => t.status === col).length})</p>
              <div className="space-y-2">
                {tickets.filter((t) => t.status === col).slice(0, 6).map((t) => (
                  <Link key={t._id} to={`/tickets/${t._id}`} className={`spine spine-${t.status} block rounded-lg bg-field p-3 text-sm hover:shadow-md`}>
                    <span className="mono text-[10px] text-slate-400">{t.code}</span>
                    <p className="truncate font-bold">{t.title}</p>
                    <p className="truncate text-xs text-slate-500">{t.student?.name} · {t.room}</p>
                    <div className="mt-1">{dueChip(t)}</div>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Table list */}
      <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-100 bg-field text-xs uppercase text-slate-400">
            <tr>
              <th className="px-4 py-3">Ticket</th>
              <th className="px-4 py-3">Category</th>
              <th className="hidden px-4 py-3 sm:table-cell">{isStaff ? 'Student' : 'Assigned to'}</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">SLA</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {tickets?.map((t) => (
              <tr key={t._id} onClick={() => navigate(`/tickets/${t._id}`)} className="cursor-pointer hover:bg-field">
                <td className="px-4 py-3">
                  <span className="mono text-xs text-slate-400">{t.code}</span>
                  <p className="font-bold">{t.title}</p>
                </td>
                <td className="px-4 py-3 capitalize text-slate-600">{t.category} · <span className="font-bold">{t.priority}</span></td>
                <td className="hidden px-4 py-3 text-slate-600 sm:table-cell">{isStaff ? `${t.student?.name} · ${t.room}` : t.assignedTo || '—'}</td>
                <td className="px-4 py-3"><span className={`spine spine-${t.status} rounded-r px-2 py-1 text-xs font-bold capitalize`}>{t.status}</span></td>
                <td className="px-4 py-3">{dueChip(t) || <span className="text-xs text-slate-300">—</span>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showNew && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4" onClick={() => setShowNew(false)}>
          <form onClick={(e) => e.stopPropagation()} onSubmit={create} className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="text-lg font-extrabold">Raise a ticket</h2>
            <p className="mt-1 text-sm text-slate-500">Priority is auto-suggested by category (plumbing/electrical → high).</p>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <label className="block"><span className="text-sm font-bold">Category</span>
                <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-teal2">
                  {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                </select></label>
              <label className="block"><span className="text-sm font-bold">Room</span>
                <input value={form.room} onChange={(e) => setForm({ ...form, room: e.target.value })} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-teal2" /></label>
            </div>
            <label className="mt-3 block"><span className="text-sm font-bold">Title</span>
              <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="One line summary"
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-teal2" /></label>
            <label className="mt-3 block"><span className="text-sm font-bold">Details (optional)</span>
              <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows="3"
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-teal2" /></label>
            <div className="mt-4 flex gap-2">
              <button type="button" onClick={() => setShowNew(false)} className="flex-1 rounded-xl border border-slate-200 py-2.5 font-bold text-slate-600">Cancel</button>
              <button disabled={busy} className="flex-1 rounded-xl bg-console py-2.5 font-extrabold text-white disabled:opacity-60">{busy ? 'Raising…' : 'Raise ticket'}</button>
            </div>
          </form>
        </div>
      )}
    </main>
  );
}
