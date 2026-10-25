import SceneBackground from '../components/SceneBackground.jsx';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import AppShell from '../components/AppShell.jsx';

const STEPS = [
    ['1', 'Raise a ticket', 'Tickets → + Raise ticket. Pick a category — priority is auto-suggested (plumbing → high). Add a photo if helpful.'],
    ['2', 'Watch the SLA clock', 'Assignment starts the timer: high 8h, medium 24h, low 72h. Live countdowns show on every ticket.'],
    ['3', 'Track the timeline', 'Every event — created, assigned, in-progress, resolved — is stamped with actor and time. Comment anytime.'],
    ['4', 'Warden triage', 'Wardens see all tickets on a kanban board, assign staff, and mark resolutions with a required note.'],
    ['5', 'Reopen if needed', 'Not fixed? Reopen within 72h with a reason — the SLA restarts shorter. Rate the fix 1–5 stars.'],
  ];

export default function Guide() {
  const { user } = useAuth();
  return (
    <div className="relative min-h-screen">
      <SceneBackground />
      <AppShell />
      <main className="relative mx-auto max-w-3xl px-4 py-12">
        <p className="text-xs font-bold uppercase tracking-[0.35em] opacity-60">1-minute guide</p>
        <h1 className="mt-2 text-4xl font-bold tracking-tight sm:text-5xl">
          How HostelHub works
        </h1>
        <p className="mt-2 text-lg opacity-60">The ops console for your hostel</p>

        <ol className="mt-10 space-y-4">
          {STEPS.map(([n, title, body], i) => (
            <li key={n} className="card tilt-card flex gap-5 p-5" style={{ animation: `fadeUp .6s ${i * 0.07}s both` }}>
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-lg font-bold"
                style={{ background: 'var(--glow, rgba(0,0,0,.06))', color: 'inherit' }}>{n}</span>
              <div>
                <h3 className="text-lg font-bold">{title}</h3>
                <p className="mt-1 text-sm leading-relaxed opacity-70">{body}</p>
              </div>
            </li>
          ))}
        </ol>

        <div className="mt-10 flex gap-3">
          <Link to="/" className="rounded-full px-7 py-3 font-bold transition hover:opacity-80"
            style={{ background: 'var(--glow, #333)', color: '#fff' }}>Back to home →</Link>
        </div>
      </main>
    </div>
  );
}
