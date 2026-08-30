export function ScientificAtmosphere() {
  return (
    <div aria-hidden="true" className="scientific-atmosphere pointer-events-none absolute inset-0 overflow-hidden [contain:paint]">
      <div className="lab-grid absolute inset-0" />
      <div className="lab-glow absolute left-1/2 top-0 size-[32rem] -translate-x-1/2 rounded-full bg-cyan-300/[0.035] blur-3xl" />
      <div className="lab-orbit absolute left-1/2 top-28 size-[28rem] -translate-x-1/2 rounded-full border border-cyan-200/[0.08]" />
      <div className="lab-orbit lab-orbit-two absolute left-1/2 top-40 size-[21rem] -translate-x-1/2 rounded-full border border-amber-100/[0.06]" />
      <span className="lab-particle left-[16%] top-[24%]" />
      <span className="lab-particle left-[78%] top-[30%] [animation-delay:1.8s]" />
      <span className="lab-particle left-[68%] top-[72%] [animation-delay:3.2s]" />
    </div>
  )
}
