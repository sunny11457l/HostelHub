// Ambient console scene for HostelHub
export default function SceneBackground() {
  const orbs = [
    { color: 'bg-teal2/10', size: 'h-[34rem] w-[40rem]', pos: '-top-36 right-1/4', dur: '16s', delay: '0s' },
    { color: 'bg-teal-bright/6', size: 'h-[22rem] w-[22rem]', pos: 'bottom-0 left-1/4', dur: '20s', delay: '-4s' },
    { color: 'bg-teal2/4', size: 'h-[14rem] w-[14rem]', pos: 'top-1/2 right-1/4', dur: '14s', delay: '-7s' },
  ];
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden="true">
      {orbs.map((o, i) => (
        <div key={i}
          className={`blob absolute ${o.pos} ${o.size} ${o.color} rounded-full`}
          style={{ animation: `orbFloat ${o.dur} ease-in-out ${o.delay} infinite` }}
        />
      ))}
      <div
        className="absolute inset-0 opacity-[0.018]"
        style={{ backgroundImage: 'radial-gradient(circle, rgba(20,184,166,.8) 1px, transparent 1px)', backgroundSize: '40px 40px' }}
      />
    </div>
  );
}
