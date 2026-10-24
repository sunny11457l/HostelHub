import { useEffect, useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import client from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';

const NAV = [
  { to: '/tickets', label: 'Tickets', icon: '▤' },
];

export default function AppShell() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let alive = true;
    const poll = () =>
      client.get('/notifications').then((r) => {
        if (alive) setUnread(r.data.filter((n) => !n.read).length);
      }).catch(() => {});
    poll();
    const t = setInterval(poll, 20000);
    return () => { alive = false; clearInterval(t); };
  }, []);

  const isStaff = user?.role === 'warden' || user?.role === 'admin';

  return (
    <div className="flex min-h-screen">
      <aside className={`fixed inset-y-0 left-0 z-40 w-60 transform bg-console text-slate-300 transition-transform lg:static lg:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex h-16 items-center gap-2 px-5 font-extrabold text-white">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-teal2 text-sm text-console">HH</span>
          HostelHub
        </div>
        <nav className="mt-4 space-y-1 px-3">
          {NAV.map((n) => (
            <NavLink key={n.to} to={n.to} onClick={() => setOpen(false)}
              className={({ isActive }) => `flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-bold ${isActive ? 'bg-teal2 text-console' : 'hover:bg-console-edge hover:text-white'}`}>
              <span>{n.icon}</span> {n.label}
            </NavLink>
          ))}
          {isStaff && (
            <a href="#" onClick={(e) => e.preventDefault()} className="flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-500">
              <span>▦</span> Warden board <span className="ml-auto mono text-[10px]">kanban below</span>
            </a>
          )}
        </nav>
        <div className="absolute bottom-4 w-full px-5 text-xs text-slate-500">
          <p className="font-bold text-slate-300">{user?.name}</p>
          <p>{user?.role}{user?.room ? ` · ${user.room}` : ''}</p>
          <button onClick={() => { logout(); navigate('/'); }} className="mt-2 rounded-lg border border-slate-700 px-3 py-1.5 font-bold text-slate-300 hover:border-teal2">Log out</button>
        </div>
      </aside>
      {open && <div className="fixed inset-0 z-30 bg-black/50 lg:hidden" onClick={() => setOpen(false)} />}

      <div className="flex-1">
        <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-slate-200 bg-white/90 px-4 backdrop-blur lg:hidden">
          <button onClick={() => setOpen(true)} className="rounded-lg border border-slate-200 px-3 py-1.5 font-bold">☰</button>
          <span className="font-extrabold">HostelHub</span>
          <span className="rounded-full bg-teal2/10 px-3 py-1 text-xs font-extrabold text-teal-700">{unread} alerts</span>
        </header>
        {unread > 0 && (
          <div className="hidden items-center justify-between bg-teal2/10 px-6 py-2 text-sm font-bold text-teal-800 lg:flex">
            <span>🔔 {unread} unread notification{unread === 1 ? '' : 's'}</span>
            <button onClick={async () => { await client.post('/notifications/read', {}); setUnread(0); }} className="underline">Mark all read</button>
          </div>
        )}
        <Outlet />
      </div>
    </div>
  );
}
