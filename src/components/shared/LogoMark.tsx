export function LogoMark({ className = '', sweep = false }: { className?: string; sweep?: boolean }) {
  return (
    <div className={`relative ${className}`}>
      <img
        src="/assets/johri-logo-lavender.png"
        alt="Johri Jewellers"
        className="block w-full drop-shadow-[0_6px_30px_rgba(185,154,95,.35)]"
      />
      {sweep && (
        <span className="pointer-events-none absolute -inset-[10%] overflow-hidden rounded-3xl">
          <span
            className="absolute -top-[20%] -bottom-[20%] w-[34%]"
            style={{
              background: 'linear-gradient(90deg,transparent,rgba(255,255,255,.75),transparent)',
              animation: 'sweep 2.6s ease-in-out .9s infinite',
            }}
          />
        </span>
      )}
    </div>
  )
}
