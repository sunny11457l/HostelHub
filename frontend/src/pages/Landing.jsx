import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function Landing() {
  const { user } = useAuth();
  return (
    <div className="min-h-screen bg-console text-slate-200">
      <header className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4">
        <div className="flex items-center gap-2 font-extrabold text-white">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-teal2 text-sm text-console">HH</span> HostelHub
        </div>
        <Link to={user ? '/tickets' : '/login'} className="rounded-full bg-teal2 px-5 py-2 text-sm font-extrabold text-console">
          {user ? 'Open console' : 'Log in'}
        </Link>
      </header>
      <main className="mx-auto max-w-5xl px-4">
        <section className="py-24 text-center">
          <h1 className="mx-auto max-w-2xl text-5xl font-extrabold leading-tight text-white">
            Every complaint, <span className="text-teal2">on the clock</span>.
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-lg text-slate-400">
            Hostel tickets shouldn't die on sticky notes. HostelHub gives every
            complaint an SLA timer, auto-escalates breaches to the warden, and
            keeps a public status timeline per ticket.
          </p>
          <div className="mt-8 flex justify-center gap-3">
            <Link to="/register" className="rounded-full bg-teal2 px-7 py-3 font-extrabold text-console">Student sign-up</Link>
            <Link to="/login" className="rounded-full border border-slate-700 px-7 py-3 font-extrabold text-slate-200 hover:border-teal2">Warden login</Link>
          </div>
        </section>
        <section className="grid gap-4 pb-24 sm:grid-cols-3">
          {[
            ['SLA timers', 'High 8h · medium 24h · low 72h. Assignment starts the clock; breaches escalate automatically.'],
            ['Auto-escalation', 'A cron engine scans every 5 minutes — approaching deadlines warn, breaches page the wardens.'],
            ['Full timeline', 'Created → assigned → in-progress → resolved (or reopened) — every step stamped with actor and note.'],
          ].map(([t, b]) => (
            <div key={t} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
              <h3 className="font-extrabold text-white">{t}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-400">{b}</p>
            </div>
          ))}
        </section>
      </main>
      <footer className="border-t border-slate-800 py-6 text-center text-sm text-slate-500">HostelHub — complaints on the clock.</footer>
    </div>
  );
}
