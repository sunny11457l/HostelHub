import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import client, { API_ROOT } from '../api/client.js';
import { Loading, ErrorState } from '../components/states.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import SceneBackground from '../components/SceneBackground.jsx';

function timeLeft(deadline) {
  const ms = new Date(deadline) - Date.now();
  if (ms < 0) return { text: 'OVERDUE', tone: 'text-red-600' };
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  return { text: `${h}h ${m}m remaining`, tone: ms < 2 * 3600000 ? 'text-amber-600' : 'text-slate-600' };
}

export default function TicketDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const toast = useToast();
  const [ticket, setTicket] = useState(null);
  const [error, setError] = useState('');
  const [comment, setComment] = useState('');
  const [assignForm, setAssignForm] = useState({ assignedTo: '' });
  const [resolveNote, setResolveNote] = useState('');
  const [reopenReason, setReopenReason] = useState('');
  const isStaff = user?.role !== 'student';

  async function load() {
    setError('');
    try { setTicket((await client.get(`/tickets/${id}`)).data); }
    catch (err) { setError(err.message); }
  }
  useEffect(() => { load(); }, [id]);

  async function act(fn, okMsg) {
    try {
      await fn();
      toast(okMsg);
      load();
    } catch (err) {
      toast(err.message, 'error');
    }
  }

  if (error) return (
    <div className="relative min-h-screen">
      <SceneBackground />
      <main className="relative mx-auto max-w-4xl px-4 py-10"><ErrorState message={error} onRetry={load} /></main>
    </div>
  );
  if (!ticket) return <Loading label="Opening ticket…" />;

  const sla = ticket.slaDeadline && !['resolved'].includes(ticket.status) ? timeLeft(ticket.slaDeadline) : null;
  const isOwner = user && ticket.student?._id === user.id;
  const canReopen = isOwner && ticket.status === 'resolved' && ticket.resolvedAt && Date.now() - new Date(ticket.resolvedAt) < 72 * 3600000;

  return (
    <div className="relative min-h-screen">
      <SceneBackground />
      <main className="relative mx-auto max-w-4xl px-4 py-8">
      <Link to="/tickets" className="text-sm font-bold text-slate-400 hover:text-teal2">← All tickets</Link>
      <div className="mt-3 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className={`spine spine-${ticket.status} p-6`}>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <span className="mono text-xs text-slate-400">{ticket.code}</span>
              <h1 className="text-2xl font-extrabold">{ticket.title}</h1>
              <p className="mt-1 text-sm capitalize text-slate-500">{ticket.category} · priority <strong>{ticket.priority}</strong> · {ticket.student?.name} · room {ticket.room}</p>
            </div>
            <div className="text-right">
              <span className={`spine spine-${ticket.status} rounded-r px-3 py-1 text-sm font-bold capitalize`}>{ticket.status}</span>
              {sla && <p className={`mono mt-2 text-xs font-bold ${sla.tone}`}>⏱ {sla.text}</p>}
            </div>
          </div>
          {ticket.description && <p className="mt-3 leading-relaxed text-slate-600">{ticket.description}</p>}
          {ticket.photoPath && <img src={`${API_ROOT}${ticket.photoPath}`} alt="ticket photo" className="mt-3 max-h-72 rounded-xl border border-slate-200 object-cover" />}
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-2 border-t border-slate-100 bg-field p-4">
          {isStaff && ['open', 'assigned', 'escalated'].includes(ticket.status) && (
            <div className="flex flex-wrap gap-2">
              <input value={assignForm.assignedTo} onChange={(e) => setAssignForm({ assignedTo: e.target.value })} placeholder="Staff (e.g. Ramesh, Electrician)"
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-teal2" />
              <button onClick={() => assignForm.assignedTo.trim().length >= 2 && act(() => client.patch(`/tickets/${id}/assign`, assignForm), 'Assigned — SLA clock started')}
                className="rounded-xl bg-console px-4 py-2 text-sm font-extrabold text-white">Assign & start SLA</button>
            </div>
          )}
          {isStaff && ticket.status === 'assigned' && (
            <button onClick={() => act(() => client.patch(`/tickets/${id}/status`, { status: 'in-progress' }), 'Work started')}
              className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-extrabold">Start work</button>
          )}
          {isStaff && ['assigned', 'in-progress', 'escalated'].includes(ticket.status) && (
            <div className="flex flex-wrap gap-2">
              <input value={resolveNote} onChange={(e) => setResolveNote(e.target.value)} placeholder="Resolution note"
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-teal2" />
              <button onClick={() => resolveNote.trim().length >= 3 && act(() => client.patch(`/tickets/${id}/status`, { status: 'resolved', note: resolveNote }), 'Resolved')}
                className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-extrabold text-white">Resolve</button>
            </div>
          )}
          {isOwner && ticket.status === 'resolved' && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-slate-400">Satisfied?</span>
              {[1, 2, 3, 4, 5].map((n) => (
                <button key={n} onClick={() => act(() => client.post(`/tickets/${id}/feedback`, { satisfaction: n }), `Rated ${n}/5 — thanks!`)}
                  className="rounded-full border border-slate-200 px-3 py-1 text-sm font-bold hover:border-amber-400">{'★'.repeat(n)}</button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="font-extrabold">Timeline</h2>
          <ol className="mt-4 space-y-4">
            {ticket.timeline.map((e, i) => (
              <li key={i} className="relative pl-6">
                <span className="absolute left-0 top-1 h-3 w-3 rounded-full border-2 border-white bg-teal2 shadow" />
                {i < ticket.timeline.length - 1 && <span className="absolute left-[5px] top-4 h-full w-0.5 bg-slate-200" />}
                <p className="text-sm font-bold">{e.action}</p>
                {e.note && <p className="text-sm text-slate-500">{e.note}</p>}
                <p className="mono text-[11px] text-slate-400">{e.actorName || 'system'} · {new Date(e.at).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>
              </li>
            ))}
          </ol>
          <form onSubmit={(ev) => { ev.preventDefault(); if (comment.trim()) { act(() => client.post(`/tickets/${id}/comments`, { note: comment }), 'Comment added'); setComment(''); } }} className="mt-4 flex gap-2">
            <input value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Add a comment…"
              className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-teal2" />
            <button className="rounded-xl bg-console px-4 py-2 text-sm font-extrabold text-white">Post</button>
          </form>
        </section>

        <section className="space-y-4">
          {ticket.status === 'resolved' && (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
              <h2 className="font-extrabold text-emerald-800">Resolved</h2>
              <p className="mt-1 text-sm text-emerald-700">{ticket.resolutionNote}</p>
              {canReopen && (
                <div className="mt-3">
                  <input value={reopenReason} onChange={(e) => setReopenReason(e.target.value)} placeholder="Why should it reopen?"
                    className="w-full rounded-xl border border-emerald-200 px-3 py-2 text-sm outline-none focus:border-emerald-500" />
                  <button onClick={() => reopenReason.trim().length >= 3 && act(() => client.post(`/tickets/${id}/reopen`, { reason: reopenReason }), 'Reopened — SLA restarted (8h)')}
                    className="mt-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-extrabold text-white">Reopen ticket</button>
                  <p className="mt-1 text-xs text-emerald-600">Window closes 72h after resolution.</p>
                </div>
              )}
              {!canReopen && !isStaff && <p className="mt-2 text-xs text-emerald-600">The 72-hour reopen window has closed.</p>}
            </div>
          )}
          {ticket.assignedTo && (
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="font-extrabold">Assignment</h2>
              <p className="mt-1 text-sm text-slate-600">{ticket.assignedTo}</p>
              {ticket.slaDeadline && <p className="mono mt-1 text-xs text-slate-400">SLA deadline: {new Date(ticket.slaDeadline).toLocaleString('en-IN')}</p>}
            </div>
          )}
        </section>
      </div>
    </main>
    </div>
  );
}
