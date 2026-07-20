export function Sparkles({ count = 3 }: { count?: number }) {
  return (
    <div className="flex justify-center gap-2">
      {Array.from({ length: count }).map((_, i) => (
        <svg
          key={i}
          width="18"
          height="18"
          viewBox="0 0 24 24"
          className="animate-twinkle"
          style={{ animationDelay: `${i * 0.4}s` }}
        >
          <path d="M12 2l2.4 7.6L22 12l-7.6 2.4L12 22l-2.4-7.6L2 12l7.6-2.4z" fill="#b99a5f" />
        </svg>
      ))}
    </div>
  )
}
