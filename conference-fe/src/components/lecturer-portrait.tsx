import { User } from 'lucide-react'
import { LECTURER_PHOTO_POSITION, LECTURER_PHOTOS, type LecturerId } from '@/data/lecturers'
import { cn } from '@/lib/utils'

const AVATAR_TONES = [
  'bg-[#2d126e] text-[#eae6ff]',
  'bg-[#4a1393] text-[#f7f4ff]',
  'bg-[#1c015e] text-[#c4b5fd]',
  'bg-[#6f46be] text-[#f7f4ff]',
]

function toneFor(key: string) {
  let n = 0
  for (let i = 0; i < key.length; i += 1) n = (n + key.charCodeAt(i) * (i + 1)) % AVATAR_TONES.length
  return AVATAR_TONES[n]
}

export function LecturerPortrait({
  id,
  name,
  className,
}: {
  id?: LecturerId
  name: string
  className?: string
}) {
  const src = id ? LECTURER_PHOTOS[id] : undefined
  const position = id ? LECTURER_PHOTO_POSITION[id] : undefined

  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className={cn('overflow-hidden rounded-full object-cover', position ?? 'object-center', className)}
      />
    )
  }

  const initials = id
    ? name
        .split(/\s+/)
        .filter((part) => part && part !== '—' && part !== 'د.' && part !== 'Dr.')
        .slice(0, 2)
        .map((part) => part[0])
        .join('')
    : ''

  return (
    <span
      aria-hidden="true"
      className={cn(
        'inline-flex items-center justify-center overflow-hidden rounded-full',
        toneFor(id ?? name),
        className,
      )}
    >
      {initials ? (
        <span className="font-sans text-[0.7em] font-bold leading-none">{initials}</span>
      ) : (
        <User className="size-[55%] opacity-90" strokeWidth={1.75} />
      )}
    </span>
  )
}
