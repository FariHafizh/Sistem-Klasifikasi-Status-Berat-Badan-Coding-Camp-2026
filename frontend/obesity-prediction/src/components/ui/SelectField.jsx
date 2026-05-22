/**
 * SelectField — dropdown reusable
 *
 * Props:
 * - label: string
 * - id: string
 * - options: Array<{ value: string, label: string }>
 * - value, onChange, required — standard select props
 * - error: string — pesan error opsional
 */

export default function SelectField({
  label,
  id,
  options = [],
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
      <select
        id={id}
        value={value}
        onChange={onChange}
        required={required}
        className={`
          w-full px-4 py-2.5 rounded-lg border text-sm text-gray-800 bg-white
          outline-none transition-all duration-150 cursor-pointer
          focus:ring-2 focus:ring-primary/20 focus:border-primary
          ${error ? 'border-red-400' : 'border-gray-200'}
        `}
      >
        <option value="" disabled>Pilih...</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  )
}
