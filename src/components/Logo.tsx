interface LogoProps { size?: 'sm' | 'md' | 'lg' }
const sizes = { sm: 'text-lg', md: 'text-2xl', lg: 'text-3xl' }
export function Logo({ size = 'md' }: LogoProps) {
  return (
    <span className={`font-bold tracking-tight ${sizes[size]}`}>
      <span style={{ color: '#3B82F6' }}>SPEAKUP</span>
      <span style={{ color: '#ffffff' }}>GRADE</span>
    </span>
  )
}