import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

const TICKETS = [
  ['HH-1042', 'Ceiling fan sparking', 'electrical', 'HIGH', 'due in 2h 14m', 'amber'],
  ['HH-1038', 'Wifi drops every evening', 'wifi', 'LOW', 'ESCALATED', 'red'],
  ['HH-1051', 'Geyser not heating', 'plumbing', 'HIGH', 'assigned · 8h SLA', 'teal'],
];

export default function Landing() {
  const { user } = useAuth();
  return (
    <div className="min-h-screen bg-console text-slate-200">
      <header className="mx-auto flex h-20 max-w-6xl items-center justify-between px-4">
        <div className="flex items-center gap-2.5 text-xl font-extrabold text-white">
          <span className="grid h-11 w-11 place-items-center rounded-2xl bg-teal2 text-console shadow-lg shadow-teal-500/40">HH</span> HostelHub
        </div>
        <Link to={user ? '/tickets' : '/login'} className="rounded-full bg-teal2 px-6 py-2.5 text-sm font-extrabold text-console shadow-lg shadow-teal-500/40 transition hover:-translate-y-0.5">
          {user ? 'Open console' : 'Console login'}
        </Link>
      </header>

      <main className="mx-auto max-w-6xl px-4">
        <section className="reveal grid items-center gap-12 py-14 md:grid-cols-2 md:py-20">
          <div>
            <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-teal2/30 bg-teal2/10 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-teal2">
              <span className="blink-dot h-2 w-2 rounded-full bg-teal2" /> SLA engine · live every 5 min
            </p>
            <h1 className="text-5xl font-extrabold leading-[1.06] text-white sm:text-6xl">
              Every complaint,<br /><span className="text-teal2">on the clock.</span>
            </h1>
            <p className="mt-6 max-w-lg text-lg leading-relaxed text-slate-400">
              Hostel tickets shouldn't die on sticky notes. HostelHub gives every
              complaint an SLA timer, auto-escalates breaches to the warden, and
              keeps a public status timeline.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link to="/register" className="btn-3d hover-lift rounded-full bg-teal2 px-8 py-4 font-extrabold text-console shadow-xl shadow-teal-500/30">Student sign-up →</Link>
              <Link to="/login" className="btn-3d rounded-full border border-slate-700 px-8 py-4 font-extrabold text-slate-200 hover:border-teal2">Warden login</Link>
            </div>
          </div>

          {/* live console card */}
          <div className="float-3d relative overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/80 shadow-2xl">
            <div className="flex items-center gap-2 border-b border-slate-800 px-5 py-3">
              <span className="h-3 w-3 rounded-full bg-red-400/70" /><span className="h-3 w-3 rounded-full bg-amber-400/70" /><span className="h-3 w-3 rounded-full bg-green-400/70" />
              <span className="mono ml-3 text-[11px] text-slate-500">hostelhub · sla-monitor</span>
            </div>
            <div className="space-y-3 p-5">
              {TICKETS.map(([code, title, cat, pri, sla, tone]) => (
                <div key={code} className={`spine spine-${tone === 'red' ? 'escalated' : tone === 'amber' ? 'in-progress' : 'resolved'} rounded-r-xl bg-slate-800/70 p-4`}>
                  <div className="flex items-center justify-between">
                    <span className="mono text-[11px] text-slate-500">{code} · {cat} · {pri}</span>
                    <span className={`mono rounded-full px-2.5 py-0.5 text-[10px] font-bold ${tone === 'red' ? 'bg-red-500/20 text-red-300' : tone === 'amber' ? 'bg-amber-500/20 text-amber-300' : 'bg-teal2/20 text-teal2'}`}>{sla}</span>
                  </div>
                  <p className="mt-1 font-bold text-white">{title}</p>
                </div>
              ))}
              <p className="mono pt-1 text-center text-[11px] text-slate-600">⏱ cron scan: escalated 1 · reminded 2 · healthy 5</p>
            </div>
          </div>
        </section>

        <section className="reveal grid gap-5 pb-16 sm:grid-cols-3">
          {[
            ['⏱', 'SLA timers', 'High 8h · medium 24h · low 72h. Assignment starts the clock; deadlines show as live countdowns.'],
            ['🚨', 'Auto-escalation', 'A cron engine scans every 5 minutes — approaching deadlines warn, breaches page the wardens.'],
            ['📜', 'Full timeline', 'Created → assigned → resolved (or reopened) — every step stamped with actor and note.'],
          ].map(([icon, t, b]) => (
            <div key={t} className="hover-lift rounded-3xl border border-slate-800 bg-slate-900/60 p-7">
              <span className="text-3xl">{icon}</span>
              <h3 className="mt-3 font-extrabold text-white">{t}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-400">{b}</p>
            </div>
          ))}
        </section>
      </main>

      <div className="border-y border-slate-800 bg-slate-900/50 py-4">
        <div className="marquee gap-10 text-xs font-bold uppercase tracking-[0.25em] text-slate-500">
          {[...Array(2)].map((_, dup) => (
            <div key={dup} className="flex gap-10 pr-10">
              {['SLA 8H/24H/72H', 'AUTO-ESCALATION', 'STATUS TIMELINES', 'REOPEN WINDOWS', 'WARDEN KANBAN'].map((t) => (
                <span key={t} className="flex items-center gap-10">{t} <span className="text-teal2">▮</span></span>
              ))}
            </div>
          ))}
        </div>
      </div>

      <footer className="py-10 text-center text-sm text-slate-500">HostelHub — complaints on the clock.</footer>
    </div>
  );
}
