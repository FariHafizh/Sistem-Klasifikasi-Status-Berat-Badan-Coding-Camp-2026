/**
 * RadioGroup — grup radio button reusable
 *
 * Props:
 * - label: string
 * - name: string — harus unik per grup
 * - options: Array<{ value: string, label: string }>
 * - value: string — nilai yang dipilih saat ini
 * - onChange: (value: string) => void
 * - required: boolean
 * - error: string
 */

export default function RadioGroup({
  label,
  name,
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
        <span className="text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-red-400 ml-0.5">*</span>}
        </span>
      )}
      <div className="flex items-center gap-5">
        {options.map((opt) => (
          <label
            key={opt.value}
            className="flex items-center gap-2 cursor-pointer text-sm text-gray-700"
          >
            <input
              type="radio"
              name={name}
              value={opt.value}
              checked={value === opt.value}
              onChange={() => onChange(opt.value)}
              required={required}
              className="accent-primary w-4 h-4 cursor-pointer"
            />
            {opt.label}
          </label>
        ))}
      </div>
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  )
}
