export function StatCard({ label, value, color = '#5f4d8c' }: { label: string; value: string | number; color?: string }) {
  return (
    <div className="border-mist rounded-[20px] border-[1.5px] bg-paper px-5 py-[18px] shadow-[0_6px_18px_rgba(74,58,115,.07)]">
      <div className="text-muted-3 text-[11.5px] tracking-[.16em] uppercase">{label}</div>
      <div className="font-heading mt-1.5 text-[32px]" style={{ color }}>
        {value}
      </div>
    </div>
  )
}
