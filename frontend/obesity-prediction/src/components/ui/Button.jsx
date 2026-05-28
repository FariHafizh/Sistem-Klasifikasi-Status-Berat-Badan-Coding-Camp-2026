/**
 * Button — komponen tombol reusable
 *
 * Props:
 * - variant: 'primary' | 'outline' | 'ghost'  (default: 'primary')
 * - size:    'sm' | 'md' | 'lg'               (default: 'md')
 * - fullWidth: boolean                         (default: false)
 * - disabled, onClick, type, children — standard HTML button props
 */

const variants = {
  primary: 'bg-[#1e3a6e] text-white hover:bg-[#16305e] shadow-md shadow-blue-200',
  outline: 'border border-[#1e3a6e] text-[#1e3a6e] hover:bg-[#1e3a6e] hover:text-white',
  ghost:   'text-[#1e3a6e] hover:bg-blue-50',
}

const sizes = {
  sm: 'px-4 py-2 text-xs rounded-lg',
  md: 'px-6 py-3 text-sm rounded-xl',
  lg: 'px-8 py-3.5 text-sm rounded-xl',
}

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  disabled = false,
  type = 'button',
  onClick,
  className = '',
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`
        inline-flex items-center justify-center gap-2 font-semibold
        transition-all duration-200 cursor-pointer
        disabled:opacity-50 disabled:cursor-not-allowed
        ${variants[variant]}
        ${sizes[size]}
        ${fullWidth ? 'w-full' : ''}
        ${className}
      `}
    >
      {children}
    </button>
  )
}
