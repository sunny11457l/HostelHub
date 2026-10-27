import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

const TICKETS = [
  { code: 'HH-1042', title: 'Ceiling fan sparking', cat: 'electrical', pri: 'HIGH', sla: 'due in 2h 14m', tone: 'escalated', status: 'in-progress' },
  { code: 'HH-1038', title: 'Wifi drops every evening', cat: 'wifi', pri: 'LOW', sla: 'ESCALATED ↑', tone: 'escalated', status: 'escalated' },
  { code: 'HH-1051', title: 'Geyser not heating', cat: 'plumbing', pri: 'HIGH', sla: 'assigned · 8h SLA', tone: 'assigned', status: 'assigned' },
  { code: 'HH-1055', title: 'Common room lights broken', cat: 'electrical', pri: 'MEDIUM', sla: 'open · 18h SLA', tone: 'open', status: 'open' },
];

const TONE_MAP = {
  escalated: { row: 'spine spine-escalated', badge: 'chip-escalated', dot: 'bg-danger' },
  assigned: { row: 'spine spine-assigned', badge: 'chip-assigned', dot: 'bg-blue-400' },
  open: { row: 'spine spine-open', badge: 'chip-open', dot: 'bg-slate-400' },
  'in-progress': { row: 'spine spine-in-progress', badge: 'chip-in-progress', dot: 'bg-warn' },
};

export default function Landing() {
  const { user } = useAuth();
  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Ambient orbs */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden="true">
        <div className="blob absolute -top-40 right-1/4 h-[34rem] w-[40rem] rounded-full bg-teal2/10" style={{ animation: 'orbFloat 16s ease-in-out infinite' }} />
        <div className="blob absolute bottom-0 left-1/4 h-[22rem] w-[22rem] rounded-full bg-teal-bright/6" style={{ animation: 'orbFloat 20s ease-in-out 4s infinite' }} />
        <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle, rgba(20,184,166,.02) 1px, transparent 1px)', backgroundSize: '44px 44px' }} />
      </div>

      {/* Header */}
      <header className="relative mx-auto flex h-20 max-w-6xl items-center justify-between px-6">
        <div className="flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-2xl bg-teal-bright text-console text-sm font-black shadow-lg teal-glow">HH</div>
          <span className="text-xl font-extrabold text-white">HostelHub</span>
        </div>
        <nav className="flex items-center gap-2">
          <Link to="/guide" className="nav-link text-sm">📖 Guide</Link>
          <Link
            to={user ? '/tickets' : '/login'}
            className="btn-3d btn-teal ml-2 rounded-xl px-6 py-2.5 text-sm"
          >
            {user ? 'Open Console →' : 'Console Login →'}
          </Link>
        </nav>
      </header>

      <main className="relative mx-auto max-w-6xl px-6">
        {/* Hero — split layout */}
        <section className="reveal grid items-center gap-12 py-16 md:grid-cols-2 md:py-22">
          {/* Left — copy */}
          <div>
            <span className="mb-6 inline-flex items-center gap-2.5 rounded-full border border-teal-bright/25 bg-teal-bright/8 px-4 py-2 text-xs font-bold uppercase tracking-widest text-teal-bright">
              <span className="blink-dot h-2 w-2 rounded-full bg-teal-bright" />
              SLA Engine · Live every 5 min
            </span>

            <h1 className="text-5xl font-extrabold leading-[1.06] text-white sm:text-6xl lg:text-7xl">
              Every complaint,<br />
              <span className="text-teal-bright">on the clock.</span>
            </h1>

            <p className="mt-7 max-w-lg text-lg leading-relaxed text-slate-400">
              Hostel tickets shouldn't die on sticky notes. HostelHub gives every
              complaint an SLA timer, auto-escalates breaches to the warden, and
              keeps a public status timeline everyone can follow.
            </p>

            <div className="mt-10 flex flex-wrap gap-4">
              <Link to="/register" className="btn-3d btn-teal rounded-2xl px-9 py-4 font-extrabold">
                Student Sign-Up →
              </Link>
              <Link to="/login" className="btn-3d glass rounded-2xl px-9 py-4 font-extrabold text-slate-200 hover:border-teal-bright/30">
                Warden Login
              </Link>
            </div>

            {/* Stats */}
            <div className="mt-12 grid grid-cols-3 gap-4">
              {[['8h', 'High SLA'], ['24h', 'Medium SLA'], ['72h', 'Low SLA']].map(([v, l]) => (
                <div key={l} className="console-card relative rounded-2xl border border-console-edge p-4 text-center">
                  <p className="mono text-2xl font-bold text-teal-bright">{v}</p>
                  <p className="mt-1 text-xs uppercase tracking-wider text-slate-500">{l}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Right — live console */}
          <div className="perspective">
            <div className="float-3d console-card relative overflow-hidden rounded-3xl border border-teal-bright/12">
              {/* Terminal bar */}
              <div className="flex items-center gap-2 border-b border-console-edge bg-console-mid/80 px-5 py-3.5">
                <span className="h-3 w-3 rounded-full bg-danger/70" />
                <span className="h-3 w-3 rounded-full bg-warn/70" />
                <span className="h-3 w-3 rounded-full bg-success2/70" />
                <span className="mono ml-3 text-[11px] text-slate-500">hostelhub · sla-monitor · block-c</span>
                <span className="mono ml-auto flex items-center gap-1.5 text-[10px] text-teal-bright">
                  <span className="blink-dot h-1.5 w-1.5 rounded-full bg-teal-bright" /> LIVE
                </span>
              </div>

              {/* Ticket rows */}
              <div className="divide-y divide-console-edge">
                {TICKETS.map(({ code, title, cat, pri, sla, tone, status }) => {
                  const t = TONE_MAP[tone] || TONE_MAP.open;
                  return (
                    <div key={code} className={`${t.row} ticket-row px-5 py-4`}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="mono text-[10px] text-slate-500">{code}</span>
                            <span className={`mono rounded px-2 py-0.5 text-[9px] font-bold ${pri === 'HIGH' ? 'chip-high' : pri === 'MEDIUM' ? 'chip-medium' : 'chip-low'}`}>{pri}</span>
                            <span className="mono text-[10px] text-slate-600">{cat}</span>
                          </div>
                          <p className="mt-1 font-bold text-white">{title}</p>
                        </div>
                        <span className={`mono mt-1 shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold ${t.badge}`}>{sla}</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Footer cron info */}
              <div className="border-t border-console-edge bg-console-mid/60 px-5 py-3 text-center">
                <p className="mono text-[10px] text-slate-600">
                  ⏱ cron scan: escalated <span className="text-danger">1</span> · reminded <span className="text-warn">2</span> · healthy <span className="text-success2">5</span>
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Feature cards */}
        <section className="reveal mb-8 grid gap-5 pb-16 sm:grid-cols-3">
          {[
            ['⏱', 'SLA Timers', 'High 8h · medium 24h · low 72h. Assignment starts the clock; deadlines show as live countdowns in your dashboard.'],
            ['🚨', 'Auto-Escalation', 'A cron engine scans every 5 minutes — approaching deadlines warn; breaches immediately page the wardens.'],
            ['📜', 'Full Timeline', 'Created → assigned → resolved (or reopened) — every step stamped with actor, note, and timestamp.'],
          ].map(([icon, t, b]) => (
            <div key={t} className="hover-lift console-card rounded-3xl border border-console-edge p-7 transition-all">
              <span className="text-3xl">{icon}</span>
              <h3 className="mt-4 font-extrabold text-white">{t}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-400">{b}</p>
            </div>
          ))}
        </section>
      </main>

      {/* Marquee */}
      <div className="border-y border-console-edge bg-console-mid/60 py-4 backdrop-blur">
        <div className="marquee gap-12 text-xs font-bold uppercase tracking-[0.25em] text-slate-600">
          {[...Array(2)].map((_, dup) => (
            <div key={dup} className="mono flex gap-12 pr-12">
              {['SLA 8H/24H/72H', '▮', 'AUTO-ESCALATION', '▮', 'STATUS TIMELINES', '▮', 'REOPEN WINDOWS', '▮', 'WARDEN KANBAN'].map((t, i) => (
                <span key={i} className={t === '▮' ? 'text-teal-bright' : ''}>{t}</span>
              ))}
            </div>
          ))}
        </div>
      </div>

      <footer className="relative py-12 text-center">
        <p className="mono text-sm tracking-widest text-slate-700">HOSTELHUB — COMPLAINTS ON THE CLOCK.</p>
      </footer>
    </div>
  );
}
