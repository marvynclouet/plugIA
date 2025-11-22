import Image from 'next/image'

export function Logo({ className = 'h-8 w-8' }: { className?: string }) {
  return (
    <div className={className} style={{ position: 'relative' }}>
      <Image
        src="/logo.png"
        alt="Flow IA Logo"
        width={100}
        height={100}
        className="w-full h-full object-contain"
        priority
      />
    </div>
  )
}

