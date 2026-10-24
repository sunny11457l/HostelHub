import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-console px-4 text-center">
      <p className="mono text-7xl font-bold text-teal2">404</p>
      <h1 className="text-xl font-extrabold text-white">This ticket doesn't exist</h1>
      <p className="text-slate-400">The page you're looking for is off the board.</p>
      <Link to="/tickets" className="rounded-full bg-teal2 px-6 py-2.5 font-extrabold text-console">Back to console</Link>
    </div>
  );
}
