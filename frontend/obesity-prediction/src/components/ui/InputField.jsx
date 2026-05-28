/**
 * InputField — input teks/angka reusable
 *
 * Props:
 * - label: string
 * - id: string
 * - type: 'text' | 'number' | 'email' | 'password'  (default: 'text')
 * - placeholder, value, onChange, required — standard input props
 * - error: string — pesan error opsional
 */

export default function InputField({
  label,
  id,
  type = 'text',
  placeholder,
  value,
  onChange,
  required = false,
  error = '',
  className = '',
}) {
  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      {label && (
        <label htmlFor={id} className="text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-red-400 ml-0.5">*</span>}
        </label>
      )}
      <input
        id={id}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        required={required}
        className={`
          w-full px-4 py-2.5 rounded-lg border text-sm text-gray-800
          placeholder:text-gray-400 bg-white
          outline-none transition-all duration-150
          focus:ring-2 focus:ring-primary/20 focus:border-primary
          ${error ? 'border-red-400' : 'border-gray-200'}
        `}
      />
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}
