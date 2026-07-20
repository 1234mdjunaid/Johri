import { Volume2, VolumeX } from 'lucide-react'

export function MuteToggle({ muted, onToggle }: { muted: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      aria-label={muted ? 'Unmute sound' : 'Mute sound'}
      className="fixed top-3.5 right-3.5 z-40 flex h-11 w-11 items-center justify-center rounded-full border border-mist bg-paper/80 text-royal backdrop-blur-md transition-colors hover:bg-wisteria"
    >
      {muted ? <VolumeX size={20} /> : <Volume2 size={20} />}
    </button>
  )
}
