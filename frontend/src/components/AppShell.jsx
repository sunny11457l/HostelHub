import { useEffect, useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import client from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';

const NAV_ITEMS = [
  { to: '/tickets', label: 'Tickets', icon: '🎫' },
];

export default function AppShell() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let alive = true;
    const poll = () =>
      client.get('/notifications')
        .then(r => { if (alive) setUnread(r.data.filter(n => !n.read).length); })
        .catch(() => {});
    poll();
    const t = setInterval(poll, 20000);
    return () => { alive = false; clearInterval(t); };
  }, []);

  const isStaff = user?.role === 'warden' || user?.role === 'admin';

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-console-edge bg-console-mid transition-transform duration-300 lg:static lg:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full'}`}>
        {/* Logo */}
        <div className="flex h-16 items-center gap-3 border-b border-console-edge px-5">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-teal-bright text-console text-sm font-black teal-glow">HH</div>
          <span className="text-lg font-extrabold text-white">HostelHub</span>
        </div>

        {/* Nav */}
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {NAV_ITEMS.map(n => (
            <NavLink
              key={n.to}
              to={n.to}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-bold transition-all ${
                  isActive
                    ? 'bg-teal-bright/15 text-teal-bright border border-teal-bright/20'
                    : 'text-slate-400 hover:bg-console-edge hover:text-white'
                }`
              }
            >
              <span>{n.icon}</span>
              {n.label}
            </NavLink>
          ))}

          {isStaff && (
            <div className="mt-4 border-t border-console-edge pt-4">
              <p className="mono mb-2 px-4 text-[10px] uppercase tracking-widest text-slate-600">Staff</p>
              <NavLink
                to="/tickets"
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-bold transition-all ${
                    isActive ? 'bg-teal-bright/15 text-teal-bright' : 'text-slate-400 hover:bg-console-edge hover:text-white'
                  }`
                }
              >
                <span>📋</span> Warden Board
              </NavLink>
            </div>
          )}
        </nav>

        {/* Notification banner */}
        {unread > 0 && (
          <div className="mx-3 mb-2 rounded-xl bg-teal-bright/10 border border-teal-bright/20 p-3">
            <p className="text-xs font-bold text-teal-bright">🔔 {unread} notification{unread !== 1 ? 's' : ''}</p>
            <button
              onClick={async () => { await client.post('/notifications/read', {}); setUnread(0); }}
              className="mt-1 text-[10px] font-semibold text-teal-bright/60 underline"
            >Mark all read</button>
          </div>
        )}

        {/* User info */}
        <div className="border-t border-console-edge p-4">
          <div className="mb-2 rounded-xl bg-console-edge p-3">
            <p className="text-sm font-bold text-white">{user?.name}</p>
            <p className="mono mt-0.5 text-[10px] text-slate-500">{user?.role}{user?.room ? ` · Room ${user.room}` : ''}</p>
          </div>
          <button
            onClick={() => { logout(); navigate('/'); }}
            className="w-full rounded-xl border border-console-edge py-2 text-sm font-bold text-slate-400 transition hover:border-teal-bright/40 hover:text-teal-bright"
          >
            Log out
          </button>
        </div>
      </aside>

      {/* Mobile overlay */}
      {open && <div className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm lg:hidden" onClick={() => setOpen(false)} />}

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Mobile header */}
        <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-console-edge bg-console/90 px-4 backdrop-blur lg:hidden">
          <button onClick={() => setOpen(true)} className="rounded-xl border border-console-edge px-3 py-2 text-slate-400 hover:text-teal-bright">☰</button>
          <div className="flex items-center gap-2">
            <div className="grid h-7 w-7 place-items-center rounded-lg bg-teal-bright text-console text-xs font-black">HH</div>
            <span className="font-extrabold text-white">HostelHub</span>
          </div>
          {unread > 0 ? (
            <span className="rounded-full bg-teal-bright/15 px-3 py-1 text-xs font-extrabold text-teal-bright">{unread} 🔔</span>
          ) : <span className="w-16" />}
        </header>

        <Outlet />
      </div>
    </div>
  );
}
